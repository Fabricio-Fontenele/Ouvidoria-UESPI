import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import type { SubmitHandler } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { getAuthenticatedHomeRoute, getSearchParams, replaceWith, routes } from '../../app/routes'
import { savePostAuthNotification } from '../../application/auth/post-auth-notification'
import { AuthField } from '../../components/auth/auth-field'
import { AuthFormMessage } from '../../components/auth/auth-form'
import { AuthPageShell } from '../../components/layout/auth-page-shell'
import { useAuth } from '../../hooks/use-auth'
import { cx } from '../../utils/cx'

const emailSchema = z.object({
  email: z.email('Informe um email válido.'),
})

const codeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Informe o código de 6 dígitos.'),
})

const passwordSchema = z
  .object({
    password: z
      .string()
      .trim()
      .min(8, 'A senha deve ter pelo menos 8 caracteres.')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        'A senha deve conter uma letra maiúscula, uma minúscula e um número.',
      ),
    confirmPassword: z.string().trim().min(1, 'Confirme sua senha.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas não conferem.',
    path: ['confirmPassword'],
  })

type EmailFormData = z.infer<typeof emailSchema>
type CodeFormData = z.infer<typeof codeSchema>
type PasswordFormData = z.infer<typeof passwordSchema>
type Step = 'email' | 'code' | 'password'

export function ForgotPasswordPage() {
  const {
    confirmPasswordResetCode,
    error: authError,
    isAuthenticated,
    requestPasswordReset,
    resetPassword,
    user,
  } = useAuth()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState(() => getSearchParams().get('email') ?? '')
  const [code, setCode] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const linkFocusClasses =
    'transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue'
  const emailForm = useForm<EmailFormData>({
    defaultValues: { email },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(emailSchema),
  })
  const codeForm = useForm<CodeFormData>({
    defaultValues: { code: '' },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(codeSchema),
  })
  const passwordForm = useForm<PasswordFormData>({
    defaultValues: { confirmPassword: '', password: '' },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(passwordSchema),
  })

  useEffect(() => {
    if (isAuthenticated && user !== null) {
      replaceWith(getAuthenticatedHomeRoute(user.role))
    }
  }, [isAuthenticated, user])

  const handleEmailSubmit: SubmitHandler<EmailFormData> = async (values) => {
    setSuccessMessage(null)
    const normalizedEmail = values.email.trim()
    const ok = await requestPasswordReset(normalizedEmail)

    if (ok) {
      setEmail(normalizedEmail)
      setStep('code')
      setSuccessMessage('Enviamos um código para o email informado.')
    }
  }

  const handleCodeSubmit: SubmitHandler<CodeFormData> = async (values) => {
    setSuccessMessage(null)
    const normalizedCode = values.code.trim()
    const ok = await confirmPasswordResetCode({ code: normalizedCode, email })

    if (ok) {
      setCode(normalizedCode)
      setStep('password')
      setSuccessMessage('Código confirmado. Defina sua nova senha.')
    }
  }

  const handlePasswordSubmit: SubmitHandler<PasswordFormData> = async (values) => {
    setSuccessMessage(null)
    const ok = await resetPassword({
      code,
      email,
      password: values.password,
    })

    if (ok) {
      savePostAuthNotification('password-reset')
      setSuccessMessage('Senha redefinida. Redirecionando...')
      window.location.assign(routes.home)
    }
  }

  const status = authError !== null ? 'error' : successMessage !== null ? 'success' : null
  const statusMessage = authError ?? successMessage ?? undefined

  if (isAuthenticated && user !== null) {
    return null
  }

  return (
    <AuthPageShell
      cardClassName="max-w-[342px] sm:max-w-[420px] md:max-w-[480px] lg:max-w-[500px]"
      titleId="forgot-password-title"
    >
      <h1
        className="text-center text-[30px] leading-9 font-bold text-login-text sm:text-[32px] md:text-[34px] md:leading-10"
        id="forgot-password-title"
      >
        Redefinir senha
      </h1>
      <p className="mx-auto mt-[20px] mb-8 max-w-[280px] text-center text-base leading-6 text-login-brown sm:max-w-[340px] md:text-[17px]">
        {step === 'email' ? 'Informe seu email para receber o código.' : null}
        {step === 'code' ? (
          <>
            Digite o código enviado para <strong className="font-bold text-login-text">{email}</strong>.
          </>
        ) : null}
        {step === 'password' ? 'Escolha uma nova senha para sua conta.' : null}
      </p>

      {step === 'email' ? (
        <form
          className="flex flex-col gap-[17px] sm:gap-5"
          noValidate
          onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
        >
          <AuthField
            aria-describedby={emailForm.formState.errors.email?.message === undefined ? undefined : 'email-error'}
            aria-invalid={emailForm.formState.errors.email?.message === undefined ? undefined : true}
            autoComplete="email"
            icon="email"
            id="auth-reset-email"
            label="Email"
            placeholder="exemplo@uespi.br"
            required
            type="email"
            {...emailForm.register('email')}
          />
          <AuthFormMessage id="email-error" variant="error">
            {emailForm.formState.errors.email?.message}
          </AuthFormMessage>
          <SubmitButton
            isSubmitting={emailForm.formState.isSubmitting}
            label="Enviar código"
            submittingLabel="Enviando..."
          />
        </form>
      ) : null}

      {step === 'code' ? (
        <form
          className="flex flex-col gap-[17px] sm:gap-5"
          noValidate
          onSubmit={codeForm.handleSubmit(handleCodeSubmit)}
        >
          <AuthField
            aria-describedby={codeForm.formState.errors.code?.message === undefined ? undefined : 'code-error'}
            aria-invalid={codeForm.formState.errors.code?.message === undefined ? undefined : true}
            autoComplete="one-time-code"
            icon="lock"
            id="auth-reset-code"
            inputMode="numeric"
            label="Código"
            maxLength={6}
            placeholder="000000"
            required
            type="text"
            {...codeForm.register('code')}
          />
          <AuthFormMessage id="code-error" variant="error">
            {codeForm.formState.errors.code?.message}
          </AuthFormMessage>
          <SubmitButton
            isSubmitting={codeForm.formState.isSubmitting}
            label="Confirmar código"
            submittingLabel="Confirmando..."
          />
          <button
            className={cx(
              'self-center text-sm leading-5 text-login-blue no-underline md:text-[15px]',
              linkFocusClasses,
            )}
            onClick={() => void handleEmailSubmit({ email })}
            type="button"
          >
            Reenviar código
          </button>
        </form>
      ) : null}

      {step === 'password' ? (
        <form
          className="flex flex-col gap-[17px] sm:gap-5"
          noValidate
          onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
        >
          <AuthField
            aria-describedby={
              passwordForm.formState.errors.password?.message === undefined ? undefined : 'password-error'
            }
            aria-invalid={passwordForm.formState.errors.password?.message === undefined ? undefined : true}
            autoComplete="new-password"
            icon="lock"
            id="auth-reset-password"
            label="Nova senha"
            placeholder="••••••••"
            required
            type="password"
            {...passwordForm.register('password')}
          />
          <AuthFormMessage id="password-error" variant="error">
            {passwordForm.formState.errors.password?.message}
          </AuthFormMessage>
          <AuthField
            aria-describedby={
              passwordForm.formState.errors.confirmPassword?.message === undefined
                ? undefined
                : 'confirm-password-error'
            }
            aria-invalid={passwordForm.formState.errors.confirmPassword?.message === undefined ? undefined : true}
            autoComplete="new-password"
            icon="lock"
            id="auth-reset-confirm-password"
            label="Confirmar nova senha"
            placeholder="••••••••"
            required
            type="password"
            {...passwordForm.register('confirmPassword')}
          />
          <AuthFormMessage id="confirm-password-error" variant="error">
            {passwordForm.formState.errors.confirmPassword?.message}
          </AuthFormMessage>
          <SubmitButton
            isSubmitting={passwordForm.formState.isSubmitting}
            label="Redefinir senha"
            submittingLabel="Salvando..."
          />
        </form>
      ) : null}

      {status !== null && statusMessage !== undefined ? (
        <div className="mt-5 text-center">
          <AuthFormMessage variant={status}>{statusMessage}</AuthFormMessage>
        </div>
      ) : null}

      <p className="mx-auto mt-[26px] text-center text-sm leading-5 text-login-brown md:text-[15px]">
        Lembrou a senha?{' '}
        <a className={cx('text-login-blue no-underline', linkFocusClasses)} href={routes.login}>
          Faça login.
        </a>
      </p>
    </AuthPageShell>
  )
}

function SubmitButton({
  isSubmitting,
  label,
  submittingLabel,
}: {
  isSubmitting: boolean
  label: string
  submittingLabel: string
}) {
  return (
    <button
      className="mt-[10px] inline-flex min-h-[48px] w-56 cursor-pointer items-center justify-center self-center rounded-lg bg-login-blue text-lg leading-7 font-bold text-login-on-blue transition duration-150 hover:opacity-85 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue disabled:cursor-not-allowed disabled:opacity-70"
      disabled={isSubmitting}
      type="submit"
    >
      {isSubmitting ? submittingLabel : label}
    </button>
  )
}
