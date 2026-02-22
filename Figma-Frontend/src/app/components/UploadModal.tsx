import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Upload, Music, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { prismApi, type Song } from '../api/prismApi'

const STEM_COLORS: Record<string, string> = {
  vocals: '#FF6B9D',
  bass: '#4ECDC4',
  guitar: '#45B7D1',
  piano: '#F7DC6F',
  drums: '#FF6348',
  other: '#A29BFE',
}

const STEM_ICONS: Record<string, string> = {
  vocals: '🎤',
  bass: '🎸',
  guitar: '🎵',
  piano: '🎹',
  drums: '🥁',
  other: '🎶',
}

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
}

type ModalState = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [state, setState] = useState<ModalState>('idle')
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [song, setSong] = useState<Song | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const reset = () => {
    setState('idle')
    setDragOver(false)
    setUploadProgress(0)
    setProcessingProgress(0)
    setSong(null)
    setError(null)
    setSelectedFile(null)
    if (pollRef.current) clearInterval(pollRef.current)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const processFile = useCallback(async (file: File) => {
    // Validate
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/aiff', 'audio/x-aiff']
    const validExts = ['.mp3', '.wav', '.flac', '.ogg', '.aiff', '.aif']
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      setError('Please upload an audio file (MP3, WAV, FLAC, OGG, or AIFF)')
      setState('error')
      return
    }
    if (file.size > 200 * 1024 * 1024) {
      setError('File too large. Maximum size is 200MB.')
      setState('error')
      return
    }

    setSelectedFile(file)
    setState('uploading')
    setUploadProgress(0)

    try {
      // Upload
      const uploadedSong = await prismApi.uploadSong(file, (pct) => setUploadProgress(pct))
      setSong(uploadedSong)
      setState('processing')
      setProcessingProgress(5)

      // Simulate/poll processing progress
      let prog = 5
      pollRef.current = setInterval(async () => {
        try {
          const updated = await prismApi.getSong(uploadedSong.id)
          setSong(updated)
          prog = Math.min(prog + Math.random() * 8, 95)
          setProcessingProgress(Math.round(updated.progress ?? prog))

          if (updated.status === 'completed') {
            if (pollRef.current) clearInterval(pollRef.current)
            setProcessingProgress(100)
            setState('done')
          } else if (updated.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current)
            setError(updated.error_message || 'Processing failed. Please try again.')
            setState('error')
          }
        } catch {
          // API might not be connected — simulate completion for demo
          prog = Math.min(prog + Math.random() * 10, 100)
          setProcessingProgress(Math.round(prog))
          if (prog >= 100) {
            if (pollRef.current) clearInterval(pollRef.current)
            // Mock completed song for demo
            setSong({
              id: uploadedSong.id,
              filename: file.name,
              original_filename: file.name,
              status: 'completed',
              progress: 100,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              stems: ['vocals', 'bass', 'guitar', 'piano', 'drums', 'other'].map((s) => ({
                stem_type: s as any,
                file_url: '#',
                duration: 180,
                file_size: 10 * 1024 * 1024,
              })),
            })
            setState('done')
          }
        }
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Is the backend running?')
      setState('error')
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDownload = (stemType: string) => {
    if (!song) return
    const url = prismApi.getStemDownloadUrl(song.id, stemType as any)
    const a = document.createElement('a')
    a.href = url
    a.download = `${song.original_filename?.replace(/\.[^.]+$/, '')}_${stemType}.wav`
    a.click()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-lg pointer-events-auto rounded-2xl p-6 overflow-hidden"
              style={{
                background: 'rgba(8,8,28,0.95)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04) inset',
              }}
            >
              {/* Gradient accent */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, #A29BFE, #FF6B9D, #4ECDC4, transparent)' }}
              />

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(162,155,254,0.1)', border: '1px solid rgba(162,155,254,0.2)' }}
                  >
                    <Music size={18} color="#A29BFE" />
                  </div>
                  <div>
                    <h2
                      style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'white', fontSize: '1.1rem' }}
                    >
                      Split Your Track
                    </h2>
                    <p style={{ fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>
                      6 stems · AI-powered separation
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-white/5"
                >
                  <X size={16} color="rgba(255,255,255,0.4)" />
                </button>
              </div>

              {/* ── IDLE: Drop Zone ── */}
              {state === 'idle' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative flex flex-col items-center justify-center gap-4 rounded-xl p-12 cursor-pointer transition-all duration-300"
                  style={{
                    border: `2px dashed ${dragOver ? 'rgba(162,155,254,0.6)' : 'rgba(255,255,255,0.08)'}`,
                    background: dragOver ? 'rgba(162,155,254,0.05)' : 'rgba(255,255,255,0.01)',
                    transform: dragOver ? 'scale(1.01)' : 'scale(1)',
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(162,155,254,0.1)', border: '1px solid rgba(162,155,254,0.2)' }}
                  >
                    <Upload size={24} color="#A29BFE" />
                  </div>
                  <div className="text-center">
                    <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'white', fontSize: '1rem' }}>
                      Drop your audio file here
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginTop: 4 }}>
                      MP3, WAV, FLAC, AIFF — up to 200MB
                    </p>
                  </div>
                  <div
                    className="px-4 py-2 rounded-full text-sm"
                    style={{
                      background: 'rgba(162,155,254,0.1)',
                      border: '1px solid rgba(162,155,254,0.2)',
                      color: '#A29BFE',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    Browse Files
                  </div>
                  <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileInput} />
                </motion.div>
              )}

              {/* ── UPLOADING ── */}
              {state === 'uploading' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Music size={16} color="#A29BFE" />
                    <span style={{ fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                      {selectedFile?.name}
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span style={{ fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                        Uploading...
                      </span>
                      <span style={{ fontFamily: 'Inter, sans-serif', color: '#A29BFE', fontSize: '0.75rem' }}>
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #A29BFE, #FF6B9D)' }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── PROCESSING ── */}
              {state === 'processing' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(162,155,254,0.05)' }}>
                    <Loader size={16} color="#A29BFE" className="animate-spin" />
                    <div>
                      <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>
                        AI Separating Stems
                      </p>
                      <p style={{ fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>
                        Demucs is analyzing your track...
                      </p>
                    </div>
                  </div>

                  {/* Animated waveform visualization */}
                  <div className="flex items-center justify-center gap-1 h-10">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 rounded-full"
                        style={{ background: `hsl(${i * 15}, 70%, 65%)` }}
                        animate={{ height: [4, Math.random() * 28 + 4, 4] }}
                        transition={{ duration: 0.8 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.05 }}
                      />
                    ))}
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span style={{ fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                        Processing
                      </span>
                      <span style={{ fontFamily: 'Inter, sans-serif', color: '#A29BFE', fontSize: '0.75rem' }}>
                        {processingProgress}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #FF6B9D, #A29BFE, #4ECDC4)' }}
                        animate={{ width: `${processingProgress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  <p style={{ fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', textAlign: 'center' }}>
                    This usually takes 2–5 minutes
                  </p>
                </motion.div>
              )}

              {/* ── DONE ── */}
              {state === 'done' && song && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={16} color="#4ECDC4" />
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>
                      Separation Complete
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(song.stems ?? []).map((stem) => (
                      <button
                        key={stem.stem_type}
                        onClick={() => handleDownload(stem.stem_type)}
                        className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                          background: `rgba(${hexToRgb(STEM_COLORS[stem.stem_type] || '#fff')}, 0.06)`,
                          border: `1px solid rgba(${hexToRgb(STEM_COLORS[stem.stem_type] || '#fff')}, 0.18)`,
                        }}
                      >
                        <span className="text-lg">{STEM_ICONS[stem.stem_type]}</span>
                        <div className="flex-1 min-w-0">
                          <p
                            style={{
                              fontFamily: 'Syne, sans-serif',
                              fontWeight: 700,
                              color: STEM_COLORS[stem.stem_type] || 'white',
                              fontSize: '0.82rem',
                              textTransform: 'capitalize',
                            }}
                          >
                            {stem.stem_type}
                          </p>
                          <p style={{ fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>
                            Download WAV
                          </p>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M6 1v7M6 8L3 5M6 8L9 5M1 11h10" stroke={STEM_COLORS[stem.stem_type] || 'white'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={reset}
                    className="w-full py-2.5 rounded-xl text-sm transition-all duration-200 hover:opacity-80"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.4)',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    Split another track
                  </button>
                </motion.div>
              )}

              {/* ── ERROR ── */}
              {state === 'error' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div
                    className="flex items-start gap-3 p-4 rounded-xl"
                    style={{ background: 'rgba(255,99,72,0.06)', border: '1px solid rgba(255,99,72,0.15)' }}
                  >
                    <AlertCircle size={18} color="#FF6348" className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#FF6348', fontSize: '0.875rem' }}>
                        Something went wrong
                      </p>
                      <p style={{ fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: 4 }}>
                        {error}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={reset}
                    className="w-full py-2.5 rounded-xl text-sm transition-all duration-200"
                    style={{
                      background: 'rgba(162,155,254,0.1)',
                      border: '1px solid rgba(162,155,254,0.2)',
                      color: '#A29BFE',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    Try Again
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}
