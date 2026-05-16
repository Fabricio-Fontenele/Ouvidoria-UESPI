import { AuthField } from '../components/auth-field'
import { AuthPageShell } from '../components/auth-page-shell'
import { cx } from '../utils/cx'

function TermsCheckbox() {
  const linkFocusClasses =
    'rounded-sm transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue'

  return (
    <label className="grid cursor-pointer grid-cols-[22px_1fr] items-start gap-2 text-sm leading-5 text-login-brown md:col-span-2 md:mx-auto md:max-w-[360px]">
      <input className="peer sr-only" required type="checkbox" />
      <span
        aria-hidden="true"
        className="mt-0.5 grid size-[22px] place-items-center rounded border border-login-blue text-login-on-blue transition-colors duration-150 peer-checked:bg-login-blue peer-checked:[&>svg]:opacity-100 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-login-blue"
      >
        <svg className="size-3.5 opacity-0 transition-opacity duration-150 peer-checked:opacity-100" fill="none" viewBox="0 0 16 16">
          <path d="m3.5 8 3 3 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
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
  )
}

export function SignPage() {
  const linkFocusClasses =
    'transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue'

  return (
    <AuthPageShell
      cardClassName="max-w-[342px] sm:max-w-[480px] md:max-w-[720px] lg:max-w-[780px]"
      footerId="suporte"
      titleId="sign-title"
    >
      <h1 className="text-center text-[30px] leading-9 font-bold text-login-text sm:text-[32px] md:text-[34px] md:leading-10" id="sign-title">
        Criar Conta
      </h1>
      <p className="mx-auto mt-[15px] mb-5 max-w-[260px] text-center text-lg leading-7 text-login-brown sm:max-w-[350px] md:mb-8 md:max-w-[430px] md:text-xl">
        Inicie seu diálogo com a Universidade de forma segura e transparente.
      </p>

      <form className="grid gap-y-[17px] md:grid-cols-2 md:gap-x-6 md:gap-y-5" onSubmit={(event) => event.preventDefault()}>
        <AuthField autoComplete="name" icon="user" id="full-name" label="Nome completo" placeholder="Seu nome completo" required type="text" />
        <AuthField autoComplete="email" icon="email" id="sign-email" label="Email" placeholder="exemplo@uespi.br" required type="email" />
        <AuthField
          autoComplete="new-password"
          icon="lock"
          id="sign-password"
          label="Senha"
          placeholder="••••••••"
          required
          type="password"
        />
        <AuthField
          autoComplete="new-password"
          icon="lock"
          id="confirm-password"
          label="Confirmar senha"
          placeholder="••••••••"
          required
          type="password"
        />

        <div className="mt-[2px] md:col-span-2 md:mt-1">
          <TermsCheckbox />
        </div>

        <button
          className="mt-[22px] inline-flex min-h-[48px] w-56 cursor-pointer items-center justify-center justify-self-center rounded-lg bg-login-blue text-lg leading-7 font-bold text-login-on-blue transition duration-150 hover:opacity-85 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue md:col-span-2 md:mt-4 md:w-64"
          type="submit"
        >
          Cadastrar
        </button>
      </form>

      <p className="mx-auto mt-[15px] w-[225px] text-center text-sm leading-5 text-login-brown sm:w-auto md:mt-5 md:text-[15px]">
        Já tem uma conta?{' '}
        <a className={cx('text-login-blue no-underline', linkFocusClasses)} href="/login">
          Faça login.
        </a>
      </p>
    </AuthPageShell>
  )
}
