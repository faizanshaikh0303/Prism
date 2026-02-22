// Prism API Service — aligned with FastAPI backend
// Base URL: empty string uses Vite's dev proxy; set VITE_API_URL for production.
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || ''

export type StemType = 'vocals' | 'bass' | 'guitar' | 'piano' | 'drums' | 'other'
// Backend status values: 'complete' and 'error' (not 'completed'/'failed')
export type SongStatus = 'pending' | 'processing' | 'complete' | 'error'

export interface StemInfo {
  id: number
  stem_type: StemType
  file_path: string   // absolute server path — use prismApi.stemUrl() to get a browser URL
}

export interface Song {
  id: number
  title: string
  artist?: string
  status: SongStatus
  is_demo: boolean
  error_message?: string
  created_at: string
  stems?: StemInfo[]
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface UserProfile {
  id: number
  email: string
  created_at: string
}

export interface ApiError {
  detail: string
  status_code: number
}

class PrismApiService {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('prism_token', token)
    } else {
      localStorage.removeItem('prism_token')
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('prism_token')
    }
    return this.token
  }

  private getHeaders(includeAuth = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (includeAuth && this.getToken()) {
      headers['Authorization'] = `Bearer ${this.getToken()}`
    }
    return headers
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: 'An unexpected error occurred',
        status_code: response.status,
      }))
      throw new Error(error.detail || `HTTP Error ${response.status}`)
    }
    if (response.status === 204) return undefined as unknown as T
    return response.json()
  }

  // ── Authentication ───────────────────────────────────────────────────────────

  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, password }),
    })
    const data = await this.handleResponse<AuthResponse>(response)
    this.setToken(data.access_token)
    return data
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    // Backend uses JSON at /api/auth/login (not OAuth2 form-data)
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, password }),
    })
    const data = await this.handleResponse<AuthResponse>(response)
    this.setToken(data.access_token)
    return data
  }

  logout() {
    this.setToken(null)
  }

  async getProfile(): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse<UserProfile>(response)
  }

  // ── Songs ────────────────────────────────────────────────────────────────────

  async getDemos(): Promise<Song[]> {
    const response = await fetch(`${API_BASE_URL}/api/songs/demos`)
    return this.handleResponse<Song[]>(response)
  }

  async getMySongs(): Promise<Song[]> {
    const response = await fetch(`${API_BASE_URL}/api/songs/my`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse<Song[]>(response)
  }

  async uploadSong(file: File, onProgress?: (percent: number) => void): Promise<Song> {
    const formData = new FormData()
    formData.append('file', file)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_BASE_URL}/api/songs/upload`)

      const token = this.getToken()
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          try {
            reject(new Error(JSON.parse(xhr.responseText).detail || 'Upload failed'))
          } catch {
            reject(new Error('Upload failed'))
          }
        }
      })

      xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
      xhr.send(formData)
    })
  }

  async getSong(songId: number): Promise<Song> {
    const response = await fetch(`${API_BASE_URL}/api/songs/${songId}`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse<Song>(response)
  }

  async deleteSong(songId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/songs/${songId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
    await this.handleResponse<void>(response)
  }

  // ── Stem file URL ────────────────────────────────────────────────────────────

  /**
   * Convert an absolute server-side file_path to a URL the browser can fetch.
   * The backend mounts /uploads as a static directory.
   */
  stemUrl(filePath: string): string {
    if (!filePath) return ''
    const norm = filePath.replace(/\\/g, '/')
    const idx  = norm.indexOf('/uploads/')
    if (idx !== -1) return `${API_BASE_URL}${norm.slice(idx)}`
    return `${API_BASE_URL}/api/files/${encodeURIComponent(norm)}`
  }

  // ── Polling ───────────────────────────────────────────────────────────────────

  pollSongStatus(
    songId: number,
    onUpdate: (song: Song) => void,
    intervalMs = 2000,
  ): Promise<Song> {
    return new Promise((resolve, reject) => {
      const poll = setInterval(async () => {
        try {
          const song = await this.getSong(songId)
          onUpdate(song)
          if (song.status === 'complete') {
            clearInterval(poll)
            resolve(song)
          } else if (song.status === 'error') {
            clearInterval(poll)
            reject(new Error(song.error_message || 'Processing failed'))
          }
        } catch (err) {
          clearInterval(poll)
          reject(err)
        }
      }, intervalMs)
    })
  }
}

export const prismApi = new PrismApiService()
