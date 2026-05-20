import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import type { SubmitHandler } from 'react-hook-form'
import { useForm } from 'react-hook-form'

import { getAuthenticatedHomeRoute, navigateTo, routes } from '../app/routes'
import { getSignInFormDefaultValues, signInFormSchema } from '../application/auth/sign-in-form-contract'
import type { SignInFormData } from '../application/auth/sign-in-form-contract'
import { AuthForm } from '../components/auth/auth-form'
import type { AuthFormField } from '../components/auth/auth-form'
import { AuthPageShell } from '../components/layout/auth-page-shell'
import { useAuth } from '../hooks/use-auth'
import { cx } from '../utils/cx'

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

export function LoginPage() {
  const { error, isAuthenticated, isLoading, signIn, user } = useAuth()
  const form = useForm<SignInFormData>({
    defaultValues: getSignInFormDefaultValues(),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(signInFormSchema),
  })
  const linkFocusClasses =
    'transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue'

  const handleSubmit: SubmitHandler<SignInFormData> = async (formData) => {
    await signIn(formData)
  }

  useEffect(() => {
    if (isAuthenticated && user !== null) {
      navigateTo(getAuthenticatedHomeRoute(user.role))
    }
  }, [isAuthenticated, user])

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

      <AuthForm
        className="flex flex-col gap-[17px] sm:gap-5"
        fields={loginFields}
        form={form}
        onSubmit={handleSubmit}
        status={error === null ? null : 'error'}
        statusMessage={error ?? undefined}
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

        <div className="space-y-1 text-center text-xs leading-5 text-login-brown">
          <p>
            Manifestante: <strong>exemplo@uespi.br</strong> / <strong>123456</strong>
          </p>
          <p>
            Ouvidor: <strong>ouvidor@uespi.com.br</strong> / <strong>ouv12345</strong>
          </p>
        </div>
      </AuthForm>

      <p className="mx-auto mt-[31px] w-[225px] text-center text-sm leading-5 text-login-brown sm:w-auto md:mt-8 md:text-[15px]">
        Não tem uma conta?{' '}
        <a className={cx('text-login-blue no-underline', linkFocusClasses)} href={routes.sign}>
          Cadastre-se aqui.
        </a>
      </p>
    </AuthPageShell>
  )
}
