import { getCurrentPath, routes } from './app/routes'
import { GuaraPage } from './pages/guara-page'
import { HomePage } from './pages/home-page'
import { LandingPage } from './pages/landing-page'
import { LoginPage } from './pages/login-page'
import { ManifestationFormPage } from './pages/manifestation-form-page'
import { SignPage } from './pages/sign-page'

function App() {
  const normalizedPath = getCurrentPath()

  if (normalizedPath === routes.landing) {
    return <LandingPage />
  }

  if (normalizedPath === routes.login) {
    return <LoginPage />
  }

  if (normalizedPath === routes.home) {
    return <HomePage />
  }

  if (normalizedPath === routes.guara) {
    return <GuaraPage />
  }

  if (normalizedPath === routes.manifestation) {
    return <GuaraPage />
  }

  if (normalizedPath === routes.manifestationForm) {
    return <ManifestationFormPage />
  }

  if (normalizedPath === routes.sign) {
    return <SignPage />
  }

  return <LandingPage />
}

export default App
