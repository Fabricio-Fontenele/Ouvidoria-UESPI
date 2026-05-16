import { AuthField } from '../components/auth-field'
import { AuthPageShell } from '../components/auth-page-shell'
import { Icon } from '../components/icon'
import { cx } from '../utils/cx'

export function LoginPage() {
  const linkFocusClasses =
    'transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue'

  return (
    <AuthPageShell cardClassName="max-w-[342px] sm:max-w-[420px] md:max-w-[480px] lg:max-w-[500px]" titleId="login-title">
      <h1
        className="text-center text-[30px] leading-9 font-bold text-login-text sm:text-[32px] md:text-[34px] md:leading-10"
        id="login-title"
      >
        Bem-vindo
      </h1>
      <p className="mx-auto mt-[27px] mb-9 max-w-[250px] text-center text-base leading-6 text-login-brown sm:max-w-[310px] md:mb-10 md:max-w-[340px] md:text-[17px]">
        Acesse o portal da transparência acadêmica
      </p>

      <form className="flex flex-col gap-[17px] sm:gap-5" onSubmit={(event) => event.preventDefault()}>
        <AuthField
          autoComplete="email"
          icon="user"
          id="email"
          isLabelStrong={false}
          label="Email"
          placeholder="exemplo@uespi.br"
          required
          type="email"
        />
        <AuthField
          autoComplete="current-password"
          icon="lock"
          id="password"
          label="Senha"
          placeholder="••••••••"
          required
          type="password"
        />

        <a className={cx('self-end text-sm leading-5 text-login-blue no-underline md:text-[15px]', linkFocusClasses)} href="#recuperar-senha">
          Esqueci minha senha.
        </a>

        <button
          className="inline-flex min-h-[49px] w-56 cursor-pointer items-center justify-center gap-1 self-center rounded-lg bg-login-blue text-lg leading-7 font-bold text-login-on-blue transition duration-150 hover:opacity-85 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue sm:w-60 md:mt-1 md:w-64"
          type="submit"
        >
          Entrar
          <Icon className="size-[18px]" name="arrow-right" />
        </button>
      </form>

      <p className="mx-auto mt-[31px] w-[225px] text-center text-sm leading-5 text-login-brown sm:w-auto md:mt-8 md:text-[15px]">
        Não tem uma conta?{' '}
        <a className={cx('text-login-blue no-underline', linkFocusClasses)} href="/sign">
          Cadastre-se aqui.
        </a>
      </p>
    </AuthPageShell>
  )
}
