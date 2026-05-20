import { getCurrentPath, routes } from './app/routes'
import { GuaraPage } from './pages/guara-page'
import { HomePage } from './pages/home-page'
import { LandingPage } from './pages/landing-page'
import { LoginPage } from './pages/login-page'
import { EvaluationPage } from './pages/evaluation-page'
import { ManifestationDetailsPage } from './pages/manifestation-details-page'
import { ManifestationFormPage } from './pages/manifestation-form-page'
import { OmbudsmanManifestationDetailsPage } from './pages/ombudsman-manifestation-details-page'
import { OmbudsmanHomePage } from './pages/ombudsman-home-page'
import { SignPage } from './pages/sign-page'

function App() {
  const normalizedPath = getCurrentPath()

  if (normalizedPath === routes.landing) {
    return <LandingPage />
  }

  if (normalizedPath === routes.login) {
    return <LoginPage />
  }

  if (normalizedPath === routes.evaluation) {
    return <EvaluationPage />
  }

  if (normalizedPath === routes.home) {
    return <HomePage />
  }

  if (normalizedPath === routes.ombudsmanHome) {
    return <OmbudsmanHomePage />
  }

  if (normalizedPath === routes.ombudsmanManifestation) {
    return <OmbudsmanManifestationDetailsPage />
  }

  if (normalizedPath === routes.guara) {
    return <GuaraPage />
  }

  if (normalizedPath === routes.manifestation) {
    return <ManifestationDetailsPage />
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
