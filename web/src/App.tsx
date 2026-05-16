import { HomePage } from './pages/home-page'
import { LandingPage } from './pages/landing-page'
import { LoginPage } from './pages/login-page'
import { SignPage } from './pages/sign-page'

function App() {
  const normalizedPath = window.location.pathname.replace(/\/$/, '')

  if (normalizedPath === '') {
    return <LandingPage />
  }

  if (normalizedPath === '/login') {
    return <LoginPage />
  }

  if (normalizedPath === '/home') {
    return <HomePage />
  }

  if (normalizedPath === '/sign') {
    return <SignPage />
  }

  return <LandingPage />
}

export default App
