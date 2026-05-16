import { HomePage } from './pages/home-page'
import { LoginPage } from './pages/login-page'
import { SignPage } from './pages/sign-page'

function App() {
  const normalizedPath = window.location.pathname.replace(/\/$/, '')

  if (normalizedPath === '/home') {
    return <HomePage />
  }

  if (normalizedPath === '/sign') {
    return <SignPage />
  }

  return <LoginPage />
}

export default App
