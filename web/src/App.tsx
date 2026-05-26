import { getCurrentPath, routes } from './app/routes'
import { EvaluationPage } from './pages/manifestant/evaluation-page'
import { HomePage } from './pages/manifestant/home-page'
import { ManifestationDetailsPage } from './pages/manifestant/manifestation-details-page'
import { ManifestationFormPage } from './pages/manifestant/manifestation-form-page'
import { OmbudsmanManifestationDetailsPage } from './pages/ombudsman/ombudsman-manifestation-details-page'
import { OmbudsmanHomePage } from './pages/ombudsman/ombudsman-home-page'
import { FaqPage } from './pages/public/faq-page'
import { GuaraPage } from './pages/public/guara-page'
import { LandingPage } from './pages/public/landing-page'
import { LoginPage } from './pages/public/login-page'
import { PrivacyPage } from './pages/public/privacy-page'
import { SignPage } from './pages/public/sign-page'
import { TrackPage } from './pages/public/track-page'

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

  if (normalizedPath === routes.faq) {
    return <FaqPage />
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

  if (normalizedPath === routes.privacy) {
    return <PrivacyPage />
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

  if (normalizedPath === routes.track) {
    return <TrackPage />
  }

  return <LandingPage />
}

export default App
