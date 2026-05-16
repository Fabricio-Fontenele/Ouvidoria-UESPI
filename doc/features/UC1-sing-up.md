# Especificação da Feature: Cadastrar Usuário

## 1. Identificação

| Campo          | Descrição                                                 |
| -------------- | --------------------------------------------------------- |
| Caso de uso    | UC-01                                                     |
| Nome           | Cadastrar usuário                                         |
| Feature        | Cadastro de conta de acesso                               |
| Ator principal | Usuário                                                   |
| Prioridade     | Alta                                                      |
| Status         | Núcleo e controller implementados / adapter HTTP pendente |

---

## 2. Objetivo

Permitir que um novo usuário crie uma conta no sistema de Ouvidoria Institucional, informando seus dados básicos de cadastro, para posteriormente acessar funcionalidades protegidas do sistema conforme seu perfil de acesso.

---

## 3. Requisitos relacionados

| Código | Descrição                                                                                                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF01   | O sistema deve permitir o cadastro de novos usuários com validação de dados obrigatórios e e-mail único.                                                                                    |
| RF05   | O sistema deve permitir diferentes perfis de acesso, no mínimo: manifestante, ouvidor e administrador. No domínio, esses perfis são representados por `manifestant`, `ombudsman` e `admin`. |
| RNF04  | O sistema deve ser responsivo e oferecer experiência compatível com dispositivos desktop e móveis.                                                                                          |
| RNF05  | O sistema deve seguir diretrizes de acessibilidade.                                                                                                                                         |
| RNF07  | O sistema deve exigir autenticação e aplicar autorização por perfil.                                                                                                                        |

---

## 4. Escopo da feature

### 4.1 Incluído

Esta feature deve permitir:

- cadastrar um novo usuário;
- validar os dados obrigatórios;
- validar o formato do e-mail;
- impedir cadastro com e-mail duplicado;
- armazenar a senha de forma segura usando hash;
- definir um perfil válido para o usuário;
- impedir criação não autorizada de perfis privilegiados;
- retornar os dados públicos do usuário criado;
- não retornar senha nem hash da senha na resposta.

### 4.2 Não incluído

Esta feature não contempla:

- autenticação/login;
- recuperação de senha;
- confirmação de e-mail;
- edição de dados cadastrais;
- exclusão de usuário;
- criação administrativa de ouvidores;
- criação administrativa de administradores;
- envio de e-mail de boas-vindas.

---

## 5. Ator principal

### Usuário

Pessoa que deseja criar uma conta no sistema para registrar, acompanhar ou interagir com manifestações na Ouvidoria Institucional.

---

## 6. Pré-condições

Para executar o cadastro:

- o usuário não deve possuir cadastro ativo com o e-mail informado;
- o sistema deve estar disponível;
- o sistema deve possuir os perfis de acesso previamente definidos;
- o mecanismo de hash de senha deve estar disponível.

---

## 7. Pós-condições

Após um cadastro bem-sucedido:

- o usuário é registrado no sistema;
- o e-mail fica associado a uma única conta;
- a senha é armazenada apenas em formato de hash;
- o usuário recebe o perfil padrão do cadastro público;
- os dados públicos do usuário criado são retornados;
- a senha e o hash da senha não são retornados.

---

## 8. Entrada

A feature deve receber os seguintes dados:

| Campo    | Tipo   | Obrigatório | Descrição                                             |
| -------- | ------ | ----------- | ----------------------------------------------------- |
| name     | string | Sim         | Nome completo do usuário, com ao menos duas palavras. |
| email    | string | Sim         | E-mail que será usado para identificar a conta.       |
| password | string | Sim         | Senha de acesso do usuário.                           |

### Exemplo de entrada

```json
{
  "name": "Fabricio Fontenele",
  "email": "fabricio@email.com",
  "password": "Password1"
}
```

## 9. Regras de negócio

| Código     | Regra                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------- |
| RN-UC01-01 | O nome do usuário é obrigatório.                                                             |
| RN-UC01-02 | O e-mail do usuário é obrigatório.                                                           |
| RN-UC01-03 | A senha do usuário é obrigatória.                                                            |
| RN-UC01-04 | O e-mail deve possuir formato válido.                                                        |
| RN-UC01-05 | O e-mail deve ser único no sistema.                                                          |
| RN-UC01-06 | A senha deve ser armazenada usando hash.                                                     |
| RN-UC01-07 | A senha original não deve ser armazenada em texto puro.                                      |
| RN-UC01-08 | A senha e o hash da senha não devem ser retornados na resposta.                              |
| RN-UC01-09 | O perfil do usuário deve ser válido.                                                         |
| RN-UC01-10 | Usuários comuns não podem criar contas com perfil de `ombudsman` ou `admin` sem autorização. |
| RN-UC01-11 | No cadastro público, o perfil padrão do usuário deve ser `manifestant`.                      |

---

## 10. Validações

### 10.1 Nome

O campo `name` deve:

- ser obrigatório;
- não estar vazio;
- não conter apenas espaços em branco;
- possuir no mínimo 5 caracteres após normalização;
- conter ao menos duas palavras separadas por espaço.

### 10.2 E-mail

O campo `email` deve:

- ser obrigatório;
- não estar vazio;
- possuir formato válido;
- ser único no sistema;
- ser tratado de forma normalizada para evitar duplicidade por diferença de letras maiúsculas e minúsculas.

Exemplo:

```text
FABRICIO@EMAIL.COM
fabricio@email.com
```

Ambos devem ser considerados o mesmo e-mail.

### 10.3 Senha

O campo `password` deve:

- ser obrigatório;
- não estar vazio;
- não conter apenas espaços em branco;
- possuir no mínimo 8 caracteres;
- conter ao menos 1 letra minúscula;
- conter ao menos 1 letra maiúscula;
- conter ao menos 1 número;
- ser transformado em hash antes da persistência;
- nunca ser retornado na resposta.

### 10.4 Perfil

O perfil deve:

- ser válido;
- respeitar os perfis previstos pelo sistema;
- impedir criação pública de perfis privilegiados.

Perfis previstos no domínio:

- `manifestant`
- `ombudsman`
- `admin`

No cadastro público, o perfil permitido deve ser:

- `manifestant`

---

## 11. Fluxo principal

1. O usuário acessa a funcionalidade de cadastro.
2. O sistema solicita nome, e-mail e senha.
3. O usuário informa os dados cadastrais.
4. O sistema valida os campos obrigatórios.
5. O sistema valida o formato do e-mail.
6. O sistema verifica se o e-mail já está cadastrado.
7. O sistema gera o hash da senha.
8. O sistema define o perfil do usuário como `manifestant`.
9. O sistema registra o novo usuário.
10. O sistema retorna confirmação de cadastro com os dados públicos do usuário.

---

## 12. Fluxos alternativos

### FA01 - Dados obrigatórios ausentes

Condição:
O usuário não informa nome, e-mail ou senha.

Comportamento esperado:
O sistema deve rejeitar o cadastro e informar que existem dados obrigatórios ausentes.

### FA02 - E-mail inválido

Condição:
O usuário informa um e-mail em formato inválido.

Comportamento esperado:
O sistema deve rejeitar o cadastro e informar que o e-mail é inválido.

### FA03 - E-mail já cadastrado

Condição:
O usuário informa um e-mail que já pertence a outra conta.

Comportamento esperado:
O sistema deve rejeitar o cadastro e informar que o e-mail já está cadastrado.

### FA04 - Senha inválida

Condição:
O usuário informa uma senha que não atende às regras mínimas de validação.

Comportamento esperado:
O sistema deve rejeitar o cadastro e informar que a senha é inválida.

### FA05 - Tentativa de criar perfil privilegiado

Condição:
O usuário tenta se cadastrar com um perfil privilegiado, como `ombudsman` ou `admin`, sem autorização.

Comportamento esperado:
O sistema deve rejeitar a operação ou ignorar o perfil informado, garantindo que o cadastro público não crie usuário com perfil privilegiado.

Decisão recomendada:
Rejeitar a requisição, pois o campo `role` não deve fazer parte do cadastro público. No núcleo da aplicação, o caso de uso também força o perfil `manifestant`.

---

## 13. Saída de sucesso

Status HTTP:

`201 Created`

Corpo da resposta:

```json
{
  "user": {
    "id": "user_123",
    "name": "Fabricio Fontenele",
    "email": "fabricio@email.com",
    "role": "manifestant",
    "createdAt": "2026-05-07T21:30:00.000Z"
  }
}
```

Observação:
No caso de uso, `createdAt` é um objeto `Date`. Na camada HTTP, ele tende a ser serializado como string ISO em JSON.

Observações:

A resposta não deve retornar:

```json
{
  "password": "Password1",
  "passwordHash": "hash_da_senha"
}
```

---

## 14. Erros esperados

### 14.1 Dados inválidos

Status HTTP:

`400 Bad Request`

Exemplo de resposta:

```json
{
  "error": "INVALID_INPUT",
  "message": "Dados inválidos.",
  "fields": {
    "email": ["E-mail inválido."],
    "password": ["A senha deve possuir no mínimo 8 caracteres, 1 letra minúscula, 1 letra maiúscula e 1 número."]
  }
}
```

### 14.2 E-mail já cadastrado

Status HTTP:

`409 Conflict`

Exemplo de resposta:

```json
{
  "error": "EMAIL_ALREADY_IN_USE",
  "message": "Este e-mail já está cadastrado."
}
```

### 14.3 Perfil inválido ou não autorizado

Status HTTP:

`400 Bad Request`

Exemplo de resposta:

```json
{
  "error": "INVALID_ROLE",
  "message": "O perfil informado é inválido ou não pode ser usado neste tipo de cadastro."
}
```

---

## 15. Contrato sugerido da API

Endpoint:

```http
POST /users
```

Request body:

```json
{
  "name": "Fabricio Fontenele",
  "email": "fabricio@email.com",
  "password": "Password1"
}
```

Response body:

```json
{
  "user": {
    "id": "user_123",
    "name": "Fabricio Fontenele",
    "email": "fabricio@email.com",
    "role": "manifestant",
    "createdAt": "2026-05-07T21:30:00.000Z"
  }
}
```

---

## 16. Regras de segurança

- A senha deve ser armazenada apenas em formato de hash.
- A senha original nunca deve ser persistida.
- A senha original nunca deve ser retornada pela API.
- O hash da senha nunca deve ser retornado pela API.
- O cadastro público não deve permitir criação de perfis administrativos.
- O sistema deve impedir duplicidade de e-mail.
- A validação de e-mail único deve existir na aplicação e também no banco de dados.
- O sistema deve evitar enumeração excessiva de dados sensíveis nas mensagens de erro.

---

## 17. Critérios de aceite

A feature será considerada concluída quando:

- for possível cadastrar um usuário com dados válidos;
- o usuário criado possuir e-mail único;
- a senha for armazenada com hash;
- a senha original não for salva;
- a resposta não retornar senha nem hash;
- o perfil padrão do cadastro público for `manifestant`;
- o sistema impedir cadastro com e-mail duplicado;
- o sistema impedir cadastro com e-mail inválido;
- o sistema impedir cadastro com dados obrigatórios ausentes;
- o sistema impedir criação pública de perfis `ombudsman` ou `admin`;
- os casos de teste definidos estiverem passando.

---

## 18. Casos de teste

### 18.1 Testes unitários do caso de uso

#### CT-UC01-001 - Deve cadastrar usuário com dados válidos

Dado que o usuário informa nome, e-mail e senha válidos,
Quando executar o cadastro,
Então o sistema deve criar o usuário com sucesso.

Resultado esperado:

- usuário criado;
- e-mail salvo corretamente;
- perfil definido como `manifestant`;
- senha armazenada como hash;
- senha não retornada.

#### CT-UC01-002 - Não deve cadastrar usuário sem nome

Dado que o usuário não informa o nome,
Quando executar o cadastro,
Então o sistema deve rejeitar a operação.

Resultado esperado:

- erro de dados inválidos;
- usuário não criado.

#### CT-UC01-003 - Não deve cadastrar usuário sem e-mail

Dado que o usuário não informa o e-mail,
Quando executar o cadastro,
Então o sistema deve rejeitar a operação.

Resultado esperado:

- erro de dados inválidos;
- usuário não criado.

#### CT-UC01-004 - Não deve cadastrar usuário com e-mail inválido

Dado que o usuário informa um e-mail inválido,
Quando executar o cadastro,
Então o sistema deve rejeitar a operação.

Resultado esperado:

- erro de dados inválidos;
- usuário não criado.

#### CT-UC01-005 - Não deve cadastrar usuário com e-mail duplicado

Dado que já existe um usuário cadastrado com o mesmo e-mail,
Quando outro cadastro for solicitado com esse e-mail,
Então o sistema deve rejeitar a operação.

Resultado esperado:

- erro de e-mail já cadastrado;
- novo usuário não criado.

#### CT-UC01-006 - Não deve cadastrar usuário com e-mail duplicado usando letras maiúsculas

Dado que já existe um usuário com o e-mail `fabricio@email.com`,
Quando for solicitado cadastro com `FABRICIO@EMAIL.COM`,
Então o sistema deve considerar o e-mail duplicado.

Resultado esperado:

- erro de e-mail já cadastrado;
- novo usuário não criado.

#### CT-UC01-007 - Não deve cadastrar usuário sem senha

Dado que o usuário não informa a senha,
Quando executar o cadastro,
Então o sistema deve rejeitar a operação.

Resultado esperado:

- erro de dados inválidos;
- usuário não criado.

#### CT-UC01-008 - Não deve cadastrar usuário com senha inválida

Dado que o usuário informa uma senha que não atende aos critérios mínimos,
Quando executar o cadastro,
Então o sistema deve rejeitar a operação.

Resultado esperado:

- erro de dados inválidos;
- usuário não criado.

#### CT-UC01-009 - Deve armazenar a senha com hash

Dado que o usuário informa uma senha válida,
Quando o cadastro for realizado,
Então o sistema deve armazenar apenas o hash da senha.

Resultado esperado:

- o serviço de hash é chamado;
- a senha original não é persistida;
- apenas o hash é salvo.

#### CT-UC01-010 - Não deve retornar password na resposta

Dado que o usuário foi cadastrado com sucesso,
Quando a resposta for retornada,
Então o campo `password` não deve estar presente.

Resultado esperado:

- resposta sem `password`.

#### CT-UC01-011 - Não deve retornar passwordHash na resposta

Dado que o usuário foi cadastrado com sucesso,
Quando a resposta for retornada,
Então o campo `passwordHash` não deve estar presente.

Resultado esperado:

- resposta sem `passwordHash`.

#### CT-UC01-012 - Deve criar usuário com perfil padrão manifestant

Dado que o cadastro público foi solicitado,
Quando o usuário for criado,
Então o perfil atribuído deve ser `manifestant`.

Resultado esperado:

- usuário criado com perfil `manifestant`.

#### CT-UC01-013 - Não deve permitir cadastro público como ombudsman

Dado que o usuário tenta informar o perfil `ombudsman`,
Quando executar o cadastro público,
Então o sistema deve rejeitar a operação.

Resultado esperado:

- erro de perfil inválido ou não autorizado;
- usuário não criado como `ombudsman`.

#### CT-UC01-014 - Não deve permitir cadastro público como admin

Dado que o usuário tenta informar o perfil `admin`,
Quando executar o cadastro público,
Então o sistema deve rejeitar a operação.

Resultado esperado:

- erro de perfil inválido ou não autorizado;
- usuário não criado como `admin`.

### 18.2 Testes de rota HTTP

#### CT-UC01-015 - Deve retornar 201 ao cadastrar usuário válido

Dado que a API recebe dados válidos,
Quando a rota de cadastro for chamada,
Então deve retornar status `201 Created`.

Resultado esperado:

- status 201;
- corpo com dados públicos do usuário;
- sem senha;
- sem hash da senha.

#### CT-UC01-016 - Deve retornar 400 para dados inválidos

Dado que a API recebe dados inválidos,
Quando a rota de cadastro for chamada,
Então deve retornar status `400 Bad Request`.

Resultado esperado:

- status 400;
- mensagem de erro;
- usuário não criado.

#### CT-UC01-017 - Deve retornar 409 para e-mail já cadastrado

Dado que já existe usuário com o e-mail informado,
Quando a rota de cadastro for chamada,
Então deve retornar status `409 Conflict`.

Resultado esperado:

- status 409;
- erro `EMAIL_ALREADY_IN_USE`;
- usuário não criado.

#### CT-UC01-018 - Deve rejeitar role no body do cadastro público

Dado que a API recebe o campo `role` no body,
Quando a rota de cadastro público for chamada,
Então deve retornar erro de validação.

Resultado esperado:

- status 400;
- erro de campo inválido ou não permitido.

### 18.3 Testes de integração com banco de dados

#### CT-UC01-019 - Deve persistir usuário no banco

Dado que os dados são válidos,
Quando o cadastro for concluído,
Então o usuário deve existir no banco de dados.

Resultado esperado:

- registro criado;
- e-mail salvo;
- role `manifestant` salva no cadastro público;
- hash da senha salvo.

#### CT-UC01-020 - Deve garantir unicidade de e-mail no banco

Dado que dois cadastros tentam usar o mesmo e-mail,
Quando houver tentativa de persistência duplicada,
Então o banco deve impedir a duplicidade.

Resultado esperado:

- apenas um usuário criado;
- tentativa duplicada rejeitada.

---

## 19. Sugestão de tipos

Entrada do caso de uso:

```ts
interface RegisterUserUseCaseInput {
  name: string
  email: string
  password: string
}
```

Saída do caso de uso:

```ts
interface RegisterUserUseCaseOutput {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    createdAt: Date
  }
}
```

Repositório:

```ts
interface UsersRepository {
  findByEmail(email: string): Promise<User | null>
  save(user: User): Promise<void>
}
```

Serviço de hash:

```ts
interface PasswordHasher {
  hash(password: string): Promise<string>
}
```

---

## 20. Observações de implementação

- A validação de entrada pode ser feita antes de chamar o caso de uso.
- A regra de e-mail único deve existir no caso de uso e também no banco de dados.
- O campo `role` não deve ser aceito no cadastro público.
- O caso de uso não deve depender diretamente de biblioteca de hash.
- O caso de uso deve depender de uma abstração como `PasswordHasher`.
- O caso de uso deve depender de uma abstração como `UsersRepository`.
- O retorno do caso de uso deve ser um objeto seguro, sem dados sensíveis.
- Erros de domínio devem ser mapeados para status HTTP na camada de apresentação.
- A camada de apresentação fornece `RegisterUserController` em `src/presentation/controllers/auth/`, que valida o body via `Validator<RegisterUserBody>` agnóstico e mapeia `UserAlreadyExistsError` para `409 Conflict` e erros de value-object (`InvalidNameError`, `InvalidEmailError`, `InvalidPasswordError`) para `400 Bad Request`. Falhas inesperadas caem no `500` padrão do `BaseController`.
- O adapter para framework HTTP e a implementação concreta do `Validator` ainda não foram materializados.

---

## 21. Observação final

Essa versão já está boa para colocar em algo tipo:

```txt
docs/features/uc-01-cadastrar-usuario.md
```

Ou:

```txt
docs/specs/uc-01-register-user.md
```
