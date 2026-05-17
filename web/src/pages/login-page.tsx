import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { navigateTo, routes } from '../app/routes'
import { AuthField } from '../components/auth/auth-field'
import { Icon } from '../components/icons/icon'
import { AuthPageShell } from '../components/layout/auth-page-shell'
import { useAuth } from '../hooks/use-auth'
import { cx } from '../utils/cx'

export function LoginPage() {
  const { error, isAuthenticated, isLoading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const linkFocusClasses =
    'transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    await signIn({ email, password })
  }

  useEffect(() => {
    if (isAuthenticated) {
      navigateTo(routes.home)
    }
  }, [isAuthenticated])

  return (
    <AuthPageShell
      cardClassName="max-w-[342px] sm:max-w-[420px] md:max-w-[480px] lg:max-w-[500px]"
      titleId="login-title"
    >
      <h1
        className="text-center text-[30px] leading-9 font-bold text-login-text sm:text-[32px] md:text-[34px] md:leading-10"
        id="login-title"
      >
        Bem-vindo
      </h1>
      <p className="mx-auto mt-[27px] mb-9 max-w-[250px] text-center text-base leading-6 text-login-brown sm:max-w-[310px] md:mb-10 md:max-w-[340px] md:text-[17px]">
        Acesse o portal da transparência acadêmica
      </p>

      <form className="flex flex-col gap-[17px] sm:gap-5" onSubmit={(event) => void handleSubmit(event)}>
        <AuthField
          autoComplete="email"
          icon="user"
          id="email"
          isLabelStrong={false}
          label="Email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="exemplo@uespi.br"
          required
          type="email"
          value={email}
        />
        <AuthField
          autoComplete="current-password"
          icon="lock"
          id="password"
          label="Senha"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
          type="password"
          value={password}
        />

        <a
          className={cx('self-end text-sm leading-5 text-login-blue no-underline md:text-[15px]', linkFocusClasses)}
          href="#recuperar-senha"
        >
          Esqueci minha senha.
        </a>

        <button
          className="inline-flex min-h-[49px] w-56 cursor-pointer items-center justify-center gap-1 self-center rounded-lg bg-login-blue text-lg leading-7 font-bold text-login-on-blue transition duration-150 hover:opacity-85 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue disabled:cursor-not-allowed disabled:opacity-70 sm:w-60 md:mt-1 md:w-64"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
          <Icon className="size-[18px]" name="arrow-right" />
        </button>

        {error !== null ? (
          <p className="text-center text-sm leading-5 font-bold text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <p className="text-center text-xs leading-5 text-login-brown">
          Acesso de teste: <strong>exemplo@uespi.br</strong> / <strong>123456</strong>
        </p>
      </form>

      <p className="mx-auto mt-[31px] w-[225px] text-center text-sm leading-5 text-login-brown sm:w-auto md:mt-8 md:text-[15px]">
        Não tem uma conta?{' '}
        <a className={cx('text-login-blue no-underline', linkFocusClasses)} href={routes.sign}>
          Cadastre-se aqui.
        </a>
      </p>
    </AuthPageShell>
  )
}
