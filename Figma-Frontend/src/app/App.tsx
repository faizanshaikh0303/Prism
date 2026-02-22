import { useEffect } from 'react'
import { RouterProvider } from 'react-router'
import { router } from './routes'
import '../styles/fonts.css'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function App() {
  // Wake up Render free-tier backend on first page load
  useEffect(() => {
    if (API_URL) fetch(`${API_URL}/health`).catch(() => {})
  }, [])

  return <RouterProvider router={router} />
}
