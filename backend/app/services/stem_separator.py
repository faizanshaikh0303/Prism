"""
Stem separation using Meta's Demucs.

Models used (in priority order):
  1. htdemucs_6s  → 6 stems: vocals, drums, bass, guitar, piano, other
  2. htdemucs     → 4 stems: vocals, drums, bass, other   (fallback)

MP3 handling on Windows:
  torchaudio 2.5.x on Windows cannot load MP3 natively (soundfile only
  supports WAV/FLAC; torchaudio's ffmpeg integration needs shared libs that
  are not trivially available on Windows).

  Fix: if the input is an MP3 (or any non-WAV), we convert it to WAV first
  using the ffmpeg binary bundled by imageio-ffmpeg, then hand the WAV to
  demucs. soundfile can always read WAV, so no system ffmpeg is needed.
"""
import os
import subprocess
import shutil
import sys
import tempfile
from pathlib import Path

KNOWN_STEMS = {"vocals", "drums", "bass", "guitar", "piano", "other"}


def _get_ffmpeg_exe() -> str | None:
    """Return the path to the imageio-ffmpeg binary, or None if unavailable."""
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


def _to_wav(input_path: Path, tmp_dir: Path) -> Path:
    """
    Convert *input_path* to a 44100 Hz stereo WAV using imageio-ffmpeg.
    Returns the path to the converted WAV file.
    Raises RuntimeError on failure.
    """
    ffmpeg = _get_ffmpeg_exe()
    if not ffmpeg:
        raise RuntimeError(
            "imageio-ffmpeg not available. "
            "Install it with: pip install imageio-ffmpeg"
        )

    wav_path = tmp_dir / f"{input_path.stem}_converted.wav"
    result = subprocess.run(
        [
            ffmpeg,
            "-y",                    # overwrite without asking
            "-i", str(input_path),
            "-ar", "44100",          # resample to 44.1 kHz
            "-ac", "2",              # stereo
            "-f", "wav",
            str(wav_path),
        ],
        capture_output=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg conversion failed:\n{result.stderr}")
    return wav_path


def separate_stems(input_path: str, output_base_dir: str, song_id: int) -> dict[str, str]:
    """
    Run demucs on *input_path* and move the resulting stem files to
    *output_base_dir*.

    Returns a dict mapping stem_type → absolute file path.
    Raises RuntimeError if separation fails.
    """
    input_path = Path(input_path).resolve()
    output_base_dir = Path(output_base_dir).resolve()
    output_base_dir.mkdir(parents=True, exist_ok=True)

    tmp_dir = output_base_dir / f"_tmp_{song_id}"
    tmp_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Convert non-WAV inputs to WAV so torchaudio can load them on Windows
        if input_path.suffix.lower() != ".wav":
            work_path = _to_wav(input_path, tmp_dir)
        else:
            work_path = input_path

        try:
            stems = _run_demucs(work_path, tmp_dir, song_id, model="htdemucs_6s")
        except RuntimeError:
            stems = _run_demucs(work_path, tmp_dir, song_id, model="htdemucs")

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

    return stems


def _run_demucs(
    input_path: Path,
    tmp_dir: Path,
    song_id: int,
    model: str,
) -> dict[str, str]:
    result = subprocess.run(
        [
            sys.executable, "-m", "demucs",
            "--name", model,
            "--out", str(tmp_dir),
            str(input_path),
        ],
        capture_output=True,
        encoding="utf-8",
        errors="replace",   # demucs prints Unicode progress bars; don't crash on cp1252
    )
    if result.returncode != 0:
        raise RuntimeError(f"demucs ({model}) failed:\n{result.stdout}\n{result.stderr}")

    stem_dir = _find_stem_dir(tmp_dir)
    if stem_dir is None:
        raise RuntimeError("Could not locate demucs output directory.")

    final_dir = tmp_dir.parent
    stems: dict[str, str] = {}

    for stem_file in sorted(stem_dir.iterdir()):
        stem_type = stem_file.stem.lower()
        if stem_type not in KNOWN_STEMS:
            continue
        dest = final_dir / f"{song_id}_{stem_type}{stem_file.suffix}"
        shutil.move(str(stem_file), str(dest))
        stems[stem_type] = str(dest)

    if not stems:
        raise RuntimeError("No recognisable stem files found in demucs output.")

    return stems


def _find_stem_dir(root: Path) -> Path | None:
    """Walk up to 3 levels deep to find a directory containing audio files."""
    for level1 in root.iterdir():
        if not level1.is_dir():
            continue
        for level2 in level1.iterdir():
            if not level2.is_dir():
                continue
            if any(f.suffix in {".wav", ".mp3", ".flac"} for f in level2.iterdir()):
                return level2
    return None
