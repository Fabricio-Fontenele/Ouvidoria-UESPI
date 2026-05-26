import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import type { SubmitHandler, UseFormRegisterReturn } from 'react-hook-form'
import { useForm } from 'react-hook-form'

import { routes } from '../../app/routes'
import { getSignUpFormDefaultValues, signUpFormSchema } from '../../application/auth/sign-up-form-contract'
import type { SignUpFormData } from '../../application/auth/sign-up-form-contract'
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
  const { error: authError, signUp } = useAuth()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const form = useForm<SignUpFormData>({
    defaultValues: getSignUpFormDefaultValues(),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(signUpFormSchema),
  })
  const linkFocusClasses =
    'transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue'
  const acceptedTermsError = form.formState.errors.acceptedTerms?.message
  const acceptedTermsInputProps = form.register('acceptedTerms', {
    onChange: () => setSuccessMessage(null),
  })

  const handleSubmit: SubmitHandler<SignUpFormData> = async (values) => {
    setSuccessMessage(null)

    const ok = await signUp({
      email: values.email.trim(),
      name: values.fullName.trim(),
      password: values.password,
    })

    if (ok) {
      setSuccessMessage('Conta criada com sucesso. Redirecionando...')
      window.location.assign(routes.home)
    }
  }

  const status = authError !== null ? 'error' : successMessage !== null ? 'success' : null
  const statusMessage = authError ?? successMessage ?? undefined

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

      <p className="mx-auto mt-[15px] w-[225px] text-center text-sm leading-5 text-login-brown sm:w-auto md:mt-5 md:text-[15px]">
        Já tem uma conta?{' '}
        <a className={cx('text-login-blue no-underline', linkFocusClasses)} href={routes.login}>
          Faça login.
        </a>
      </p>
    </AuthPageShell>
  )
}
