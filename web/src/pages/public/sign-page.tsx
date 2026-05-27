import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import type { SubmitHandler, UseFormRegisterReturn } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { getAuthenticatedHomeRoute, replaceWith, routes } from '../../app/routes'
import { savePostAuthNotification } from '../../application/auth/post-auth-notification'
import { getSignUpFormDefaultValues, signUpFormSchema } from '../../application/auth/sign-up-form-contract'
import type { SignUpFormData } from '../../application/auth/sign-up-form-contract'
import { AuthField } from '../../components/auth/auth-field'
import { AuthForm, AuthFormMessage } from '../../components/auth/auth-form'
import type { AuthFormField } from '../../components/auth/auth-form'
import { AuthPageShell } from '../../components/layout/auth-page-shell'
import { useAuth } from '../../hooks/use-auth'
import { cx } from '../../utils/cx'

const signUpFields: AuthFormField<SignUpFormData>[] = [
  {
    autoComplete: 'name',
    icon: 'user',
    inputType: 'text',
    label: 'Nome completo',
    name: 'fullName',
    placeholder: 'Seu nome completo',
  },
  {
    autoComplete: 'email',
    icon: 'email',
    inputType: 'email',
    label: 'Email',
    name: 'email',
    placeholder: 'exemplo@uespi.br',
  },
  {
    autoComplete: 'new-password',
    icon: 'lock',
    inputType: 'password',
    label: 'Senha',
    name: 'password',
    placeholder: '••••••••',
  },
  {
    autoComplete: 'new-password',
    icon: 'lock',
    inputType: 'password',
    label: 'Confirmar senha',
    name: 'confirmPassword',
    placeholder: '••••••••',
  },
]

const emailVerificationFormSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Informe o código de 6 dígitos.'),
})

type EmailVerificationFormData = z.infer<typeof emailVerificationFormSchema>

function TermsCheckbox({ error, inputProps }: { error?: string; inputProps: UseFormRegisterReturn<'acceptedTerms'> }) {
  const linkFocusClasses =
    'rounded-sm transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue'

  return (
    <div className="md:mx-auto md:max-w-[360px]">
      <label className="grid cursor-pointer grid-cols-[22px_1fr] items-start gap-2 text-sm leading-5 text-login-brown">
        <input
          aria-describedby={error === undefined ? undefined : 'accepted-terms-error'}
          aria-invalid={error === undefined ? undefined : true}
          className="peer sr-only"
          type="checkbox"
          {...inputProps}
        />
        <span
          aria-hidden="true"
          className="mt-0.5 grid size-[22px] place-items-center rounded border border-login-blue text-login-on-blue transition-colors duration-150 peer-checked:bg-login-blue peer-checked:[&>svg]:opacity-100 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-login-blue"
        >
          <svg
            className="size-3.5 opacity-0 transition-opacity duration-150 peer-checked:opacity-100"
            fill="none"
            viewBox="0 0 16 16"
          >
            <path
              d="m3.5 8 3 3 6-6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </span>
        <span>
          Aceito os{' '}
          <a className={cx('text-login-blue no-underline', linkFocusClasses)} href="#termos">
            termos de uso
          </a>{' '}
          e política de privacidade.
        </span>
      </label>
      <AuthFormMessage id="accepted-terms-error" variant="error">
        {error}
      </AuthFormMessage>
    </div>
  )
}

export function SignPage() {
  const {
    confirmEmailVerification,
    error: authError,
    isAuthenticated,
    resendEmailVerificationCode,
    signUp,
    user,
  } = useAuth()
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const form = useForm<SignUpFormData>({
    defaultValues: getSignUpFormDefaultValues(),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(signUpFormSchema),
  })
  const verificationForm = useForm<EmailVerificationFormData>({
    defaultValues: { code: '' },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(emailVerificationFormSchema),
  })
  const linkFocusClasses =
    'transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue'
  const acceptedTermsError = form.formState.errors.acceptedTerms?.message
  const acceptedTermsInputProps = form.register('acceptedTerms', {
    onChange: () => setSuccessMessage(null),
  })

  useEffect(() => {
    if (isAuthenticated && user !== null) {
      replaceWith(getAuthenticatedHomeRoute(user.role))
    }
  }, [isAuthenticated, user])

  const handleSubmit: SubmitHandler<SignUpFormData> = async (values) => {
    setSuccessMessage(null)

    const ok = await signUp({
      email: values.email.trim(),
      name: values.fullName.trim(),
      password: values.password,
    })

    if (ok) {
      setPendingEmail(values.email.trim())
      setSuccessMessage('Enviamos um código de verificação para seu email.')
    }
  }

  const handleVerificationSubmit: SubmitHandler<EmailVerificationFormData> = async (values) => {
    if (pendingEmail === null) {
      return
    }

    setSuccessMessage(null)

    const ok = await confirmEmailVerification({
      code: values.code.trim(),
      email: pendingEmail,
    })

    if (ok) {
      savePostAuthNotification('email-verified')
      setSuccessMessage('Email confirmado. Redirecionando...')
      window.location.assign(routes.home)
    }
  }

  const handleResendVerificationCode = async () => {
    if (pendingEmail === null) {
      return
    }

    setSuccessMessage(null)
    const ok = await resendEmailVerificationCode(pendingEmail)

    if (ok) {
      setSuccessMessage('Enviamos um novo código para seu email.')
    }
  }

  const status = authError !== null ? 'error' : successMessage !== null ? 'success' : null
  const statusMessage = authError ?? successMessage ?? undefined

  if (isAuthenticated && user !== null) {
    return null
  }

  return (
    <AuthPageShell
      cardClassName="max-w-[342px] sm:max-w-[480px] md:max-w-[720px] lg:max-w-[780px]"
      footerId="suporte"
      titleId="sign-title"
    >
      <h1
        className="text-center text-[30px] leading-9 font-bold text-login-text sm:text-[32px] md:text-[34px] md:leading-10"
        id="sign-title"
      >
        Criar Conta
      </h1>
      <p className="mx-auto mt-[15px] mb-5 max-w-[260px] text-center text-lg leading-7 text-login-brown sm:max-w-[350px] md:mb-8 md:max-w-[430px] md:text-xl">
        Inicie seu diálogo com a Universidade de forma segura e transparente.
      </p>

      {pendingEmail === null ? (
        <AuthForm
          className="grid gap-y-[17px] md:grid-cols-2 md:gap-x-6 md:gap-y-5"
          fields={signUpFields}
          form={form}
          onInvalid={() => setSuccessMessage(null)}
          onSubmit={handleSubmit}
          status={status}
          statusMessage={statusMessage}
          submitLabel="Cadastrar"
        >
          <div className="mt-[2px] md:col-span-2 md:mt-1">
            <TermsCheckbox error={acceptedTermsError} inputProps={acceptedTermsInputProps} />
          </div>
        </AuthForm>
      ) : (
        <form
          className="mx-auto grid max-w-[360px] gap-y-[17px]"
          noValidate
          onSubmit={verificationForm.handleSubmit(handleVerificationSubmit, () => setSuccessMessage(null))}
        >
          <AuthField
            aria-describedby={verificationForm.formState.errors.code?.message === undefined ? undefined : 'code-error'}
            aria-invalid={verificationForm.formState.errors.code?.message === undefined ? undefined : true}
            autoComplete="one-time-code"
            icon="lock"
            id="auth-email-verification-code"
            inputMode="numeric"
            label="Código de verificação"
            maxLength={6}
            placeholder="000000"
            required
            type="text"
            {...verificationForm.register('code')}
          />
          <AuthFormMessage id="code-error" variant="error">
            {verificationForm.formState.errors.code?.message}
          </AuthFormMessage>

          <button
            className="mt-2 inline-flex min-h-[48px] w-56 cursor-pointer items-center justify-center self-center justify-self-center rounded-lg bg-login-blue text-lg leading-7 font-bold text-login-on-blue transition duration-150 hover:opacity-85 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue disabled:cursor-not-allowed disabled:opacity-70"
            disabled={verificationForm.formState.isSubmitting}
            type="submit"
          >
            {verificationForm.formState.isSubmitting ? 'Verificando...' : 'Confirmar email'}
          </button>

          <button
            className="justify-self-center rounded-sm text-sm leading-5 font-bold text-login-blue transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue"
            onClick={() => void handleResendVerificationCode()}
            type="button"
          >
            Reenviar código
          </button>

          {status !== null && statusMessage !== undefined ? (
            <div className="text-center">
              <AuthFormMessage variant={status}>{statusMessage}</AuthFormMessage>
            </div>
          ) : null}
        </form>
      )}

      <p className="mx-auto mt-[15px] w-[225px] text-center text-sm leading-5 text-login-brown sm:w-auto md:mt-5 md:text-[15px]">
        Já tem uma conta?{' '}
        <a className={cx('text-login-blue no-underline', linkFocusClasses)} href={routes.login}>
          Faça login.
        </a>
      </p>
    </AuthPageShell>
  )
}
