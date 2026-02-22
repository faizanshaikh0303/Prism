import { HeroSection } from './HeroSection'
import '../../styles/fonts.css'

export function LandingPage() {
  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>
      <HeroSection onUploadClick={() => {}} />
    </div>
  )
}
