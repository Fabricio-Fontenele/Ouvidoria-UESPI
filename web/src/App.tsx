import { GuarapiPage } from './pages/guarapi-page'
import { HomePage } from './pages/home-page'
import { LandingPage } from './pages/landing-page'
import { LoginPage } from './pages/login-page'
import { ManifestationFormPage } from './pages/manifestation-form-page'
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

  if (normalizedPath === '/guarapi') {
    return <GuarapiPage />
  }

  if (normalizedPath === '/manifestation') {
    return <GuarapiPage />
  }

  if (normalizedPath === '/manifestation-form') {
    return <ManifestationFormPage />
  }

  if (normalizedPath === '/sign') {
    return <SignPage />
  }

  return <LandingPage />
}

export default App
