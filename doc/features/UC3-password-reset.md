# Especificação da Feature: Recuperar Senha

## 1. Identificação

| Campo          | Descrição                                                                                |
| -------------- | ---------------------------------------------------------------------------------------- |
| Caso de uso    | UC-03                                                                                    |
| Nome           | Recuperar senha                                                                          |
| Feature        | Recuperação e redefinição de senha por código enviado por e-mail                         |
| Ator principal | Usuário                                                                                  |
| Prioridade     | Alta                                                                                     |
| Status         | Implementado de ponta a ponta (domínio, aplicação, presentation, infra, rotas HTTP, e2e) |

---

## 2. Objetivo

Permitir que um usuário que perdeu o acesso recupere a conta redefinindo a senha por um canal seguro: o sistema envia um código por e-mail, o usuário confirma o código e define uma nova senha. Ao final, a sessão é restabelecida com um token.

---

## 3. Requisitos relacionados

| Código | Descrição                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------ |
| RF03   | O sistema deve permitir a recuperação e redefinição de senha por canal seguro e com validade limitada. |
| RNF07  | O sistema deve exigir autenticação e aplicar autorização por perfil.                                   |
| RNF08  | O sistema deve proteger dados pessoais e sensíveis de acordo com princípios de privacidade.            |

---

## 4. Escopo da feature

### 4.1 Incluído

Esta feature deve permitir:

- solicitar um código de redefinição informando o `email`;
- enviar o código por e-mail (TTL de 15 minutos), persistindo apenas o hash;
- confirmar o código antes de exibir o formulário de nova senha;
- redefinir a senha com `email` + `code` + nova `password`;
- emitir um token de sessão após a redefinição bem-sucedida;
- responder de forma genérica na solicitação, evitando enumeração de contas.

### 4.2 Não incluído

Esta feature não contempla:

- alteração de senha por usuário autenticado (troca voluntária com senha atual);
- bloqueio por tentativas inválidas (camada de transporte);
- expiração de sessões existentes após a redefinição;
- recuperação por SMS, perguntas de segurança ou outros canais.

---

## 5. Ator principal

### Usuário

Pessoa cadastrada que perdeu acesso à conta e deseja redefinir a senha por e-mail.

---

## 6. Pré-condições

- O usuário possui conta com o e-mail informado (verificada ou não).
- Para confirmar/redefinir: existe `passwordResetCodeHash` + `passwordResetCodeExpiresAt` válidos.
- Gerador de código, `EmailSender`, `HashComparer`, `PasswordHasher` e gerador de token disponíveis.

---

## 7. Pós-condições

Após a solicitação:

- `passwordResetCodeHash` + expiração (`+15 min`) ficam persistidos;
- um e-mail com o código em texto plano é enviado.

Após a redefinição bem-sucedida:

- a senha é trocada (`changePassword`, apenas hash persistido);
- a conta é marcada como verificada (`verifyEmail`) — concluir a redefinição comprova posse do e-mail;
- o código de recuperação é limpo (`clearPasswordReset`);
- um token de sessão é emitido.

---

## 8. Entradas

### 8.1 Solicitar código

| Campo | Tipo   | Obrigatório | Descrição        |
| ----- | ------ | ----------- | ---------------- |
| email | string | Sim         | E-mail da conta. |

```json
{ "email": "fabricio@email.com" }
```

### 8.2 Confirmar código

| Campo | Tipo   | Obrigatório | Descrição                   |
| ----- | ------ | ----------- | --------------------------- |
| email | string | Sim         | E-mail da conta.            |
| code  | string | Sim         | Código recebido por e-mail. |

```json
{ "email": "fabricio@email.com", "code": "739204" }
```

### 8.3 Redefinir senha

| Campo    | Tipo   | Obrigatório | Descrição                            |
| -------- | ------ | ----------- | ------------------------------------ |
| email    | string | Sim         | E-mail da conta.                     |
| code     | string | Sim         | Código de recuperação.               |
| password | string | Sim         | Nova senha (regras do value-object). |

```json
{ "email": "fabricio@email.com", "code": "739204", "password": "NovaSenha1" }
```

### 8.4 Contrato HTTP atual

- `POST /password-reset/codes` — body `{ email }`; público. Solicita o código.
- `POST /password-reset/confirm` — body `{ email, code }`; público. Valida o código antes da troca.
- `POST /password-reset` — body `{ email, code, password }`; público. Redefine a senha.

---

## 9. Regras de negócio

| Código     | Regra                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| RN-UC03-01 | O código é armazenado apenas como hash (`PasswordHasher`) e comparado por `HashComparer`; nunca há igualdade direta de strings.      |
| RN-UC03-02 | O código tem validade de 15 minutos (`PASSWORD_RESET_CODE_TTL_MS`).                                                                  |
| RN-UC03-03 | O código informado é normalizado com `trim()` antes da comparação.                                                                   |
| RN-UC03-04 | A solicitação só gera código para contas existentes; contas inexistentes encerram silenciosamente.                                   |
| RN-UC03-05 | O endpoint de solicitação responde sempre com mensagem genérica, evitando enumeração de contas.                                      |
| RN-UC03-06 | A nova senha respeita as mesmas regras do value-object `PlainPassword` (mín. 8, com maiúscula, minúscula e número).                  |
| RN-UC03-07 | Concluir a redefinição também verifica o e-mail (`verifyEmail`), pois prova posse do e-mail; o código de recuperação é então limpo.  |
| RN-UC03-08 | A confirmação (`/confirm`) é uma etapa de validação e não altera o estado da conta; a troca real ocorre apenas em `/password-reset`. |

---

## 10. Validações

- `email`: obrigatório, value-object `Email` (formato → `InvalidEmailError`).
- `code`: obrigatório; comparado após `trim()`; expiração checada por `passwordResetCodeExpiresAt`.
- `password`: value-object `PlainPassword` (regras de força → `InvalidPasswordError`).

---

## 11. Fluxo principal

1. O usuário solicita recuperação informando o `email` (`POST /password-reset/codes`).
2. O sistema busca a conta; se existir, gera código, faz hash, define expiração, persiste e envia e-mail. Se não existir, encerra silenciosamente.
3. O sistema responde com mensagem genérica.
4. O usuário informa `email` + `code` (`POST /password-reset/confirm`).
5. O sistema valida existência/validade/expiração do código e responde `passwordResetAllowed: true`.
6. O usuário envia `email` + `code` + nova `password` (`POST /password-reset`).
7. O sistema revalida o código, troca a senha, verifica o e-mail, limpa o código e emite token.
8. O sistema retorna `{ token }`.

---

## 12. Fluxos alternativos

### FA01 — Conta inexistente na solicitação

`/password-reset/codes` encerra silenciosamente e responde `200` genérico (sem envio de e-mail).

### FA02 — Código inválido

Código não corresponde ao hash, ou não há código pendente. `InvalidPasswordResetCodeError` → **422** (em `/confirm` e `/password-reset`).

### FA03 — Código expirado

`passwordResetCodeExpiresAt` no passado. `PasswordResetCodeExpiredError` → **422**.

### FA04 — Senha nova inválida

A nova senha não atende às regras de força. `InvalidPasswordError` → **400**.

### FA05 — E-mail malformado

`InvalidEmailError` → **400** (todos os endpoints).

---

## 13. Saídas de sucesso

### 13.1 Solicitar código — `200 OK` (genérico)

```json
{ "message": "If the account exists, a password reset code was sent." }
```

### 13.2 Confirmar código — `200 OK`

```json
{ "passwordResetAllowed": true }
```

### 13.3 Redefinir senha — `200 OK`

```json
{ "token": "access-token" }
```

---

## 14. Erros esperados

| Condição                                   | Erro                            | HTTP |
| ------------------------------------------ | ------------------------------- | ---- |
| E-mail malformado                          | `InvalidEmailError`             | 400  |
| Nova senha inválida (em `/password-reset`) | `InvalidPasswordError`          | 400  |
| Código inválido / sem código pendente      | `InvalidPasswordResetCodeError` | 422  |
| Código expirado                            | `PasswordResetCodeExpiredError` | 422  |

A solicitação (`/password-reset/codes`) não expõe existência de conta: sempre `200` genérico (exceto `InvalidEmailError` em `400`).

---

## 15. Regras de segurança

- o código de recuperação é credencial: armazenado em hash, comparado por `HashComparer`, com validade de 15 minutos;
- a solicitação responde de forma genérica para não revelar quais e-mails têm conta;
- a redefinição revalida o código antes de trocar a senha (a etapa `/confirm` é apenas UX e não dispensa a revalidação no `/password-reset`);
- concluir a redefinição verifica o e-mail e invalida o código usado;
- o controle de tentativas (rate limiting / lockout) é responsabilidade da camada de transporte.

---

## 16. Critérios de aceite

- solicitar para conta existente → `200` genérico + e-mail enviado;
- solicitar para conta inexistente → `200` genérico sem envio;
- confirmar código válido → `200` `{ passwordResetAllowed: true }`;
- confirmar/redefinir com código inválido ou expirado → `422`;
- redefinir com senha fraca → `400`;
- redefinir com código válido → `200` `{ token }`, senha trocada, e-mail verificado, código limpo.

---

## 17. Casos de teste

### 17.1 Unit

- `RequestPasswordResetUseCase`: conta existente gera/salva/envia (`sent: true`); inexistente retorna `{ sent: false }` sem enviar.
- `ConfirmPasswordResetCodeUseCase`: sucesso; sem código pendente → inválido; expirado; código errado.
- `ResetPasswordUseCase`: sucesso (troca senha + verifyEmail + clearPasswordReset + token); código inválido/expirado; senha fraca; comparação com `code.trim()`.

### 17.2 E2E

- Fluxo completo: solicitar → confirmar → redefinir → login com a nova senha.
- Redefinir com código expirado → `422`.

---

## 18. Sugestão de tipos

```ts
interface RequestPasswordResetInput {
  email: string
}
interface RequestPasswordResetOutput {
  sent: boolean
}

interface ConfirmPasswordResetCodeInput {
  email: string
  code: string
}
interface ConfirmPasswordResetCodeOutput {
  passwordResetAllowed: true
}

interface ResetPasswordInput {
  email: string
  code: string
  password: string
}
interface ResetPasswordOutput {
  token: string
}

export class User {
  get passwordResetCodeHash(): string | null
  get passwordResetCodeExpiresAt(): Date | null
  startPasswordReset(codeHash: string, expiresAt: Date): void
  changePassword(passwordHash: string): void
  verifyEmail(): void
  clearPasswordReset(): void
}
```

---

## 19. Observações de implementação

- Os três casos de uso vivem em `src/application/use-cases/password-reset/`: `request-password-reset-use-case.ts`, `confirm-password-reset-code-use-case.ts`, `reset-password-use-case.ts`. TTL `PASSWORD_RESET_CODE_TTL_MS = 15 * 60 * 1000`.
- `RequestPasswordResetUseCase` depende de `UsersRepository`, `PasswordHasher`, `VerificationCodeGenerator`, `EmailSender`; usa `user.startPasswordReset(...)`.
- `ConfirmPasswordResetCodeUseCase` depende de `UsersRepository` e `HashComparer`; é puramente validador.
- `ResetPasswordUseCase` depende de `UsersRepository`, `HashComparer`, `PasswordHasher`, `TokenGenerator`; aplica `changePassword`, `verifyEmail`, `clearPasswordReset` e emite token.
- Erros compartilhados em `password-reset/errors/`: `InvalidPasswordResetCodeError`, `PasswordResetCodeExpiredError`.
- Controllers em `src/presentation/controllers/auth/`: `RequestPasswordResetController` (sempre `200` genérico; `InvalidEmailError → 400`), `ConfirmPasswordResetCodeController` (`200` `{ passwordResetAllowed }`; código inválido/expirado → `422`; `InvalidEmailError → 400`), `ResetPasswordController` (`200` `{ token }`; `InvalidEmailError`/`InvalidPasswordError → 400`; código inválido/expirado → `422`).
- Endpoints em `src/main/routes/auth.routes.ts`, todos públicos (sem middleware de autenticação): `POST /password-reset/codes`, `POST /password-reset/confirm`, `POST /password-reset`. Em produção, o proxy deve rotear `/password-reset/*` para o backend.
- Infraestrutura: `PrismaUsersRepository`, `BcryptjsHasher` (como `HashComparer`/`PasswordHasher`), `JwtTokenGenerator`, mais `VerificationCodeGenerator` e `EmailSender` wired em `src/main/factories/infrastructure.ts`.

---

## 20. Observação final

Esta feature corresponde ao UC-03 canônico (Cockburn). Evoluções como invalidação de sessões ativas após a troca, expiração configurável ou rate limiting dedicado devem ser tratadas em revisões desta especificação, preservando o tratamento do código como credencial.
