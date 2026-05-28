# Especificação da Feature: Verificar E-mail da Conta

## 1. Identificação

| Campo          | Descrição                                                                                |
| -------------- | ---------------------------------------------------------------------------------------- |
| Caso de uso    | UC-01b (complementar — verificação de e-mail do UC-01)                                   |
| Nome           | Verificar e-mail da conta                                                                |
| Feature        | Confirmação e reenvio de código de verificação de e-mail                                 |
| Ator principal | Usuário                                                                                  |
| Prioridade     | Alta                                                                                     |
| Status         | Implementado de ponta a ponta (domínio, aplicação, presentation, infra, rotas HTTP, e2e) |

---

## 2. Objetivo

Permitir que um usuário recém-cadastrado confirme a posse do e-mail informado, usando um código de verificação enviado no cadastro (UC-01). A confirmação ativa a conta para login (UC-02) e já devolve um token de sessão. A feature também permite reenviar/renovar o código quando ele expira ou se perde.

Esta feature complementa o UC-01, que apenas **emite** o primeiro código no momento do cadastro.

---

## 3. Requisitos relacionados

| Código | Descrição                                                                                                |
| ------ | -------------------------------------------------------------------------------------------------------- |
| RF01   | O sistema deve permitir o cadastro de novos usuários com validação de dados obrigatórios e e-mail único. |
| RF02   | O sistema deve permitir a autenticação de usuários cadastrados e liberar acesso conforme perfil.         |
| RNF07  | O sistema deve exigir autenticação e aplicar autorização por perfil.                                     |
| RNF08  | O sistema deve proteger dados pessoais e sensíveis de acordo com princípios de privacidade.              |

---

## 4. Escopo da feature

### 4.1 Incluído

Esta feature deve permitir:

- confirmar o e-mail informando `email` + `code`;
- comparar o código informado contra o hash armazenado, sem persistir o código em texto plano;
- rejeitar código inválido ou expirado;
- marcar a conta como verificada (`emailVerifiedAt`) e limpar o código pendente;
- emitir um token de sessão imediatamente após a confirmação bem-sucedida;
- reenviar/renovar o código de verificação para uma conta ainda pendente;
- responder de forma genérica no reenvio, evitando enumeração de contas.

### 4.2 Não incluído

Esta feature não contempla:

- emissão do primeiro código (UC-01);
- recuperação de senha (UC-03);
- bloqueio por tentativas inválidas (responsabilidade da camada de transporte);
- verificação de e-mail para troca de e-mail de conta já existente;
- notificações além do e-mail com o código.

---

## 5. Ator principal

### Usuário

Pessoa que se cadastrou (UC-01) e precisa confirmar o e-mail para ativar a conta, ou que precisa de um novo código por expiração/perda do anterior.

---

## 6. Pré-condições

- O usuário possui uma conta cadastrada com o e-mail informado.
- A conta está pendente de verificação (`emailVerifiedAt === null`) e possui `emailVerificationCodeHash` + `emailVerificationCodeExpiresAt`.
- O mecanismo de comparação de hash e o gerador de token estão disponíveis (confirmação).
- O gerador de código e o `EmailSender` estão disponíveis (reenvio).

---

## 7. Pós-condições

Após a confirmação bem-sucedida:

- `emailVerifiedAt` passa a conter a data da verificação;
- `emailVerificationCodeHash` e `emailVerificationCodeExpiresAt` são limpos (`null`);
- um token de sessão é emitido para a conta verificada;
- a conta passa a poder autenticar normalmente pelo UC-02.

Após um reenvio bem-sucedido:

- um novo `emailVerificationCodeHash` + expiração (`+15 min`) substituem o anterior;
- um e-mail com o novo código em texto plano é enviado.

---

## 8. Entradas

### 8.1 Confirmar verificação

| Campo | Tipo   | Obrigatório | Descrição                                  |
| ----- | ------ | ----------- | ------------------------------------------ |
| email | string | Sim         | E-mail da conta a verificar.               |
| code  | string | Sim         | Código de verificação recebido por e-mail. |

```json
{ "email": "fabricio@email.com", "code": "482913" }
```

### 8.2 Reenviar código

| Campo | Tipo   | Obrigatório | Descrição                 |
| ----- | ------ | ----------- | ------------------------- |
| email | string | Sim         | E-mail da conta pendente. |

```json
{ "email": "fabricio@email.com" }
```

### 8.3 Contrato HTTP atual

- `POST /email-verification/confirm` — body `{ email, code }`; público (sem Bearer).
- `POST /email-verification/codes` — body `{ email }`; público (sem Bearer).

---

## 9. Regras de negócio

| Código      | Regra                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| RN-UC01b-01 | O código é comparado contra `emailVerificationCodeHash` por `HashComparer`; nunca há igualdade direta nem persistência em texto plano.     |
| RN-UC01b-02 | O código tem validade de 15 minutos (`EMAIL_VERIFICATION_CODE_TTL_MS`).                                                                    |
| RN-UC01b-03 | O código informado é normalizado com `trim()` antes da comparação.                                                                         |
| RN-UC01b-04 | Confirmar uma conta sem código pendente: se já estiver verificada, falha com `EmailAlreadyVerifiedError`; caso contrário, código inválido. |
| RN-UC01b-05 | Após confirmar, o código pendente é limpo e a conta recebe um token de sessão.                                                             |
| RN-UC01b-06 | O reenvio só gera novo código para contas existentes e ainda pendentes; demais casos retornam silenciosamente sem enviar e-mail.           |
| RN-UC01b-07 | O endpoint de reenvio responde sempre com mensagem genérica, independentemente de a conta existir, evitando enumeração.                    |

---

## 10. Validações

- `email`: obrigatório, normalizado pelo value-object `Email` (formato válido; falha → `InvalidEmailError`).
- `code`: obrigatório; comparado após `trim()`.
- expiração: `emailVerificationCodeExpiresAt.getTime() < Date.now()` → expirado.

---

## 11. Fluxo principal (confirmação)

1. O usuário informa `email` e `code`.
2. O sistema normaliza o e-mail e busca a conta.
3. O sistema valida a existência de código pendente e a não expiração.
4. O sistema compara o código (após `trim`) contra o hash.
5. O sistema marca a conta como verificada e limpa o código.
6. O sistema persiste e gera um token de sessão.
7. O sistema retorna `{ token }`.

### 11.1 Fluxo de reenvio

1. O usuário informa o `email`.
2. O sistema busca a conta; se não existir ou já estiver verificada, encerra silenciosamente.
3. Caso pendente, o sistema gera novo código, faz hash, define nova expiração e persiste.
4. O sistema envia o e-mail com o novo código.
5. O sistema responde com a mensagem genérica.

---

## 12. Fluxos alternativos

### FA01 — Código inválido

`code` não corresponde ao hash. `InvalidEmailVerificationCodeError` → **422**.

### FA02 — Código expirado

`emailVerificationCodeExpiresAt` no passado. `EmailVerificationCodeExpiredError` → **422**.

### FA03 — Conta já verificada

Confirmar conta sem código pendente que já está verificada. `EmailAlreadyVerifiedError` → **409**.

### FA04 — Conta inexistente / sem código pendente (e não verificada)

`InvalidEmailVerificationCodeError` → **422** (mesmo erro do código inválido, evitando distinguir contas).

### FA05 — E-mail malformado

`InvalidEmailError` → **400** (confirmação e reenvio).

---

## 13. Saídas de sucesso

### 13.1 Confirmação

Status HTTP `200 OK`:

```json
{ "token": "access-token" }
```

### 13.2 Reenvio

Status HTTP `200 OK` (genérico, anti-enumeração):

```json
{ "message": "If the account exists and is pending verification, a new code was sent." }
```

---

## 14. Erros esperados

| Condição                                    | Erro                                | HTTP |
| ------------------------------------------- | ----------------------------------- | ---- |
| E-mail malformado                           | `InvalidEmailError`                 | 400  |
| Código inválido / conta sem código pendente | `InvalidEmailVerificationCodeError` | 422  |
| Código expirado                             | `EmailVerificationCodeExpiredError` | 422  |
| Conta já verificada (na confirmação)        | `EmailAlreadyVerifiedError`         | 409  |

O reenvio não expõe erros de existência: responde sempre `200` genérico (exceto `InvalidEmailError` em `400`).

---

## 15. Regras de segurança

- o código de verificação é tratado como credencial: armazenado apenas em hash, comparado por `HashComparer`;
- o token de sessão só é emitido após a verificação bem-sucedida;
- o reenvio não revela se uma conta existe ou está pendente (resposta genérica);
- código com validade limitada (15 min) reduz a janela de uso indevido;
- o controle de tentativas (rate limiting) é responsabilidade da camada de transporte.

---

## 16. Critérios de aceite

- confirmar com código válido e não expirado → `200` com `token`, conta verificada e código limpo;
- confirmar com código errado → `422`;
- confirmar com código expirado → `422`;
- confirmar conta já verificada → `409`;
- reenviar para conta pendente → `200` genérico e novo e-mail enviado;
- reenviar para conta inexistente ou já verificada → `200` genérico sem envio;
- e-mail malformado → `400`.

---

## 17. Casos de teste

### 17.1 Unit

- `ConfirmEmailVerificationUseCase`: sucesso (verifica + token); código inválido; expirado; conta já verificada; conta inexistente; chamada de `HashComparer.compare` com `code.trim()`.
- `ResendEmailVerificationCodeUseCase`: conta pendente gera/salva/envia novo código (`sent: true`); conta inexistente ou já verificada retorna `{ sent: false }` sem enviar.

### 17.2 E2E (`test/e2e/auth.e2e.spec.ts`)

- Cadastro → confirmação com código → login subsequente bem-sucedido.
- Login antes de verificar → `403 EmailNotVerifiedError`.
- Confirmação com código inválido/expirado → `422`.

---

## 18. Sugestão de tipos

```ts
interface ConfirmEmailVerificationInput {
  email: string
  code: string
}
interface ConfirmEmailVerificationOutput {
  token: string
}

interface ResendEmailVerificationCodeInput {
  email: string
}
interface ResendEmailVerificationCodeOutput {
  sent: boolean
}

interface HashComparer {
  compare(value: string, hash: string): Promise<boolean>
}
interface VerificationCodeGenerator {
  generate(): Promise<string>
}
interface EmailSender {
  send(message: { to: string; subject: string; text: string }): Promise<void>
}

export class User {
  get isEmailVerified(): boolean
  get emailVerificationCodeHash(): string | null
  get emailVerificationCodeExpiresAt(): Date | null
  startEmailVerification(codeHash: string, expiresAt: Date): void
  verifyEmail(): void // seta emailVerifiedAt e limpa código pendente
}
```

---

## 19. Observações de implementação

- `ConfirmEmailVerificationUseCase` (`src/application/use-cases/confirm-email-verification/`) depende de `UsersRepository`, `HashComparer` e `TokenGenerator`; chama `user.verifyEmail()` e emite token `{ sub, role }`.
- `ResendEmailVerificationCodeUseCase` (`src/application/use-cases/resend-email-verification-code/`) depende de `UsersRepository`, `PasswordHasher`, `VerificationCodeGenerator` e `EmailSender`; reusa `user.startEmailVerification(...)`. TTL `EMAIL_VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000`.
- Os erros de confirmação vivem em `confirm-email-verification/errors/` (`InvalidEmailVerificationCodeError`, `EmailVerificationCodeExpiredError`, `EmailAlreadyVerifiedError`).
- A camada de apresentação fornece `ConfirmEmailVerificationController` e `ResendEmailVerificationCodeController` em `src/presentation/controllers/auth/`. O confirm mapeia `InvalidEmailError → 400`, código inválido/expirado → `422 (unprocessableEntity)`, conta já verificada → `409`, e retorna `200` com `{ token }`. O resend valida o body, sempre retorna `200` genérico e mapeia `InvalidEmailError → 400`.
- Os endpoints `POST /email-verification/confirm` e `POST /email-verification/codes` são registrados em `src/main/routes/auth.routes.ts`, ambos públicos (sem middleware de autenticação). Em produção, o proxy precisa rotear `/email-verification/*` para o backend.
- A infraestrutura concreta materializa os contratos: `PrismaUsersRepository`, `BcryptjsHasher` (como `HashComparer` e `PasswordHasher`), `JwtTokenGenerator`, mais os adapters de `VerificationCodeGenerator` e `EmailSender` wired em `src/main/factories/infrastructure.ts`.

---

## 20. Observação final

Esta feature fecha o ciclo de ativação da conta iniciado no UC-01. Evoluções futuras (rate limiting de reenvio, verificação de troca de e-mail, expiração configurável) devem ser tratadas em revisões desta especificação, preservando o tratamento do código como credencial.
