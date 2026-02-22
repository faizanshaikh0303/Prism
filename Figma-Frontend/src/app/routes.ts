import { createBrowserRouter } from 'react-router'
import { LandingPage } from './components/LandingPage'
import { LoginPage }   from './components/LoginPage'
import Studio          from './pages/Studio'

export const router = createBrowserRouter([
  { path: '/',       Component: LandingPage },
  { path: '/login',  Component: LoginPage   },
  { path: '/studio', Component: Studio      },
])
