import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import type { SubmitHandler } from 'react-hook-form'
import { useForm } from 'react-hook-form'

import { getAuthenticatedHomeRoute, replaceWith, routes } from '../../app/routes'
import type { AuthenticatedUserRole } from '../../application/auth/auth-types'
import { getSignInFormDefaultValues, signInFormSchema } from '../../application/auth/sign-in-form-contract'
import type { SignInFormData } from '../../application/auth/sign-in-form-contract'
import { AuthForm } from '../../components/auth/auth-form'
import type { AuthFormField } from '../../components/auth/auth-form'
import { AuthPageShell } from '../../components/layout/auth-page-shell'
import { useAuth } from '../../hooks/use-auth'
import { cx } from '../../utils/cx'

const loginFields: AuthFormField<SignInFormData>[] = [
  {
    autoComplete: 'email',
    icon: 'user',
    inputType: 'email',
    isLabelStrong: false,
    label: 'Email',
    name: 'email',
    placeholder: 'exemplo@uespi.br',
  },
  {
    autoComplete: 'current-password',
    icon: 'lock',
    inputType: 'password',
    label: 'Senha',
    name: 'password',
    placeholder: '••••••••',
  },
]

const manifestantLoginRoles: readonly AuthenticatedUserRole[] = ['manifestant']
const restrictedLoginRoles: readonly AuthenticatedUserRole[] = ['admin', 'ombudsman']

interface LoginPageBaseProps {
  allowedRoles: readonly AuthenticatedUserRole[]
  showSignUpLink: boolean
  subtitle: string
  unauthorizedMessage: string
}

function LoginPageBase({ allowedRoles, showSignUpLink, subtitle, unauthorizedMessage }: LoginPageBaseProps) {
  const { error, isAuthenticated, isLoading, signIn, signOut, user } = useAuth()
  const [authorizationError, setAuthorizationError] = useState<string | null>(null)
  const form = useForm<SignInFormData>({
    defaultValues: getSignInFormDefaultValues(),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(signInFormSchema),
  })
  const linkFocusClasses =
    'transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue'

  const handleSubmit: SubmitHandler<SignInFormData> = async (formData) => {
    setAuthorizationError(null)
    await signIn(formData)
  }

  useEffect(() => {
    if (!isAuthenticated || user === null) {
      return
    }

    if (allowedRoles.includes(user.role)) {
      replaceWith(getAuthenticatedHomeRoute(user.role))
      return
    }

    // Usuário autenticado com papel não permitido nesta tela: encerra a sessão e mostra o
    // motivo. O setState fica após o await (assíncrono), evitando o set-state-in-effect.
    const rejectUnauthorizedSession = async () => {
      await signOut().catch(() => undefined)
      setAuthorizationError(unauthorizedMessage)
    }

    void rejectUnauthorizedSession()
  }, [allowedRoles, isAuthenticated, signOut, unauthorizedMessage, user])

  const isAuthorizedAuthenticatedUser = isAuthenticated && user !== null && allowedRoles.includes(user.role)
  const statusMessage = authorizationError ?? error ?? undefined

  if (isAuthorizedAuthenticatedUser) {
    return null
  }

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
        {subtitle}
      </p>

      <AuthForm
        className="flex flex-col gap-[17px] sm:gap-5"
        fields={loginFields}
        form={form}
        onSubmit={handleSubmit}
        status={statusMessage === undefined ? null : 'error'}
        statusMessage={statusMessage}
        submitIcon="arrow-right"
        submitLabel={isLoading ? 'Entrando...' : 'Entrar'}
        submittingLabel="Entrando..."
      >
        <a
          className={cx('self-end text-sm leading-5 text-login-blue no-underline md:text-[15px]', linkFocusClasses)}
          href="#recuperar-senha"
        >
          Esqueci minha senha.
        </a>
      </AuthForm>

      {showSignUpLink ? (
        <p className="mx-auto mt-[31px] w-[225px] text-center text-sm leading-5 text-login-brown sm:w-auto md:mt-8 md:text-[15px]">
          Não tem uma conta?{' '}
          <a className={cx('text-login-blue no-underline', linkFocusClasses)} href={routes.sign}>
            Cadastre-se aqui.
          </a>
        </p>
      ) : null}
    </AuthPageShell>
  )
}

export function LoginPage() {
  return (
    <LoginPageBase
      allowedRoles={manifestantLoginRoles}
      showSignUpLink
      subtitle="Acesse o portal da transparência acadêmica"
      unauthorizedMessage="Esta tela é exclusiva para manifestantes. Use o acesso restrito para entrar como ouvidor ou administrador."
    />
  )
}

export function RestrictedLoginPage() {
  return (
    <LoginPageBase
      allowedRoles={restrictedLoginRoles}
      showSignUpLink={false}
      subtitle="Acesse a área administrativa"
      unauthorizedMessage="Esta tela é exclusiva para ouvidores e administradores. Use o login comum para entrar como manifestante."
    />
  )
}
