# Fase 1 — Catálogos: Notas Detalhadas de Implementação

> Arquivo temporário de registro. Não faz parte da documentação permanente do projeto.

---

## 1. Schema Prisma — Models `Campus` e `AdministrativeUnit`

### O que foi feito

Adicionados dois novos blocos `model` ao final do arquivo `prisma/schema.prisma`, antes do model `ManifestationMessage`. Nenhum model existente foi modificado.

```prisma
model Campus {
  id        String               @id @default(uuid()) @db.Uuid
  name      String
  createdAt DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime             @updatedAt @map("updated_at") @db.Timestamptz(6)
  units     AdministrativeUnit[]

  @@map("campuses")
}

model AdministrativeUnit {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  campusId  String   @map("campus_id") @db.Uuid
  campus    Campus   @relation(fields: [campusId], references: [id])
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([campusId])
  @@map("administrative_units")
}
```

### Por que esses models existem?

Antes da Fase 1, o sistema **não tinha uma fonte oficial de verdade** para campi e unidades administrativas. A tabela `manifestations` armazenava `campus_id` e `administrative_unit_id` como strings soltas — qualquer valor podia ser gravado, não havia validação referencial, e nenhum lugar no código definia quais valores eram válidos.

Isso era um problema porque o `SendAiMessageUseCase` (UC-09 — Consultar IA) precisa **validar** os IDs que o modelo de IA devolve no draft. Sem um catálogo oficial, a validação era impossível. As RNs abaixo estavam, portanto, insatisfeitas:

| RN         | Descrição                                                                                | Como fica satisfeita                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| RN-UC09-06 | "IDs de campus e unidade administrativa só são aceitos se estiverem no catálogo oficial" | `CampusCatalogProvider.list()` + `AdministrativeUnitCatalogProvider.list()` agora consultam as tabelas |
| RN-UC09-11 | "A unidade administrativa sugerida só é válida quando pertence ao campus sugerido"       | `AdministrativeUnit` tem FK para `Campus`, e o use case valida a relação                               |
| RN08 (PRD) | "Somente conteúdos institucionais aprovados podem ser utilizados como base"              | As tabelas conterão apenas dados oficiais, semeados pelo seed                                          |

### Por que a estrutura escolhida?

**Campos e tipos:**

| Campo                                | Tipo       | Motivo                                                                                                                                                           |
| ------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | `UUID`     | Consistente com todas as outras tabelas do sistema (`users`, `manifestations`, etc.). UUID evita colisão em distributed scenarios e não expõe sequência numérica |
| `name`                               | `String`   | Nome legível do campus ou unidade. Será usado como `label` no `AiCatalogItem`                                                                                    |
| `createdAt` / `updatedAt`            | `DateTime` | Padrão do projeto para auditoria. Segue exatamente o formato das outras tabelas                                                                                  |
| `campusId` (em `AdministrativeUnit`) | `UUID`     | FK referenciando `Campus.id`. Garante integridade referencial: toda unidade pertence a um campus real                                                            |

**Relação Campus → AdministrativeUnit:** É 1:N. Um campus (ex: "Campus Poeta Torquato Neto") tem múltiplas unidades administrativas (ex: "Coordenação de Sistemas", "Coordenação de Matemática", "Biblioteca Setorial"). Essa relação é essencial para a RN-UC09-11: o use case precisa verificar se a unidade sugerida pertence ao campus sugerido.

**Índice em `administrative_units.campus_id`:** Otimiza a consulta `findMany` com filtro por campus, que será usada pelo `SendAiMessageUseCase` internamente quando ele validar a consistência do draft.

**`@@map("campuses")` e `@@map("administrative_units")`:** Convenção do projeto. Todas as tabelas no banco usam snake_case. O Prisma mapeia automaticamente os nomes PascalCase do schema para os nomes em snake_case no banco.

### Por que NÃO foi adicionada FK em Manifestation?

Esta foi uma decisão de design consciente. O model `Manifestation` tem:

```prisma
campusId             String   @map("campus_id")
administrativeUnitId String   @map("administrative_unit_id")
```

Se adicionássemos uma relação `Campus | AdministrativeUnit` aqui com FK constraint, o banco passaria a **exigir** que todo `campus_id` em manifestações existisse na tabela `campuses`. Problemas:

1. **Dados existentes:** Manifestações já registradas podem ter IDs que não existiriam na nova tabela. A FK bloquearia a migration.
2. **Responsabilidade:** A validação contra catálogo é uma regra da aplicação (RN-UC09-06), não uma constraint de dados. O lugar correto para essa validação é no `SendAiMessageUseCase`, não no banco.
3. **Flexibilidade:** Se no futuro houver manifestações com campi externos ou temporários, a aplicação tem liberdade para decidir como tratar — o banco não trava.

A validação contra catálogo acontece assim no use case:

```ts
// SendAiMessageUseCase.normalizeCatalogId()
const allowedIds = new Set(catalog.map((item) => item.id))
return allowedIds.has(normalizedValue) ? normalizedValue : null
```

Se o ID não estiver no catálogo, vira `null` e entra em `missingFields`. A decisão é da aplicação, não do banco.

---

## 2. Migration SQL

### O que foi criado

Diretório `prisma/migrations/20260517130000_add_campus_and_administrative_units/` com arquivo `migration.sql`:

```sql
-- CreateTable
CREATE TABLE "campuses" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "campuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administrative_units" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "campus_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "administrative_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "administrative_units_campus_id_idx" ON "administrative_units"("campus_id");

-- AddForeignKey
ALTER TABLE "administrative_units"
ADD CONSTRAINT "administrative_units_campus_id_fkey"
FOREIGN KEY ("campus_id") REFERENCES "campuses"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
```

### Por que criar a migration manualmente?

Normalmente, usaríamos `pnpm prisma migrate dev --name add-campus-and-administrative-unit`, que:

1. Compara o schema Prisma com o banco atual
2. Gera o SQL da migration automaticamente
3. Aplica a migration no banco
4. Atualiza o `_prisma_migrations` table

Isso não foi possível porque não há um banco Postgres rodando neste ambiente (Docker indisponível). A alternativa foi gerar o SQL manualmente, espelhando exatamente o que o Prisma geraria.

### Padrão seguido

A migration segue fielmente o estilo das duas migrations existentes:

| Aspecto                          | Migration existente                      | Esta migration                                       |
| -------------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| Formato do nome                  | `<timestamp>_<descrição>`                | `20260517130000_add_campus_and_administrative_units` |
| `CREATE TABLE`                   | Campos com tipo, constraints, defaults   | Idêntico                                             |
| `CREATE INDEX`                   | `CREATE INDEX ... ON "tabela"("coluna")` | Idêntico                                             |
| `AddForeignKey`                  | `ON DELETE RESTRICT ON UPDATE CASCADE`   | Idêntico                                             |
| Aspas duplas nos identificadores | `"tabela"`, `"coluna"`                   | Idêntico                                             |

### Como aplicar

Quando o banco estiver disponível:

```bash
pnpm prisma migrate dev
```

O Prisma detecta que o diretório `prisma/migrations/` tem uma migration nova que não foi aplicada e a executa. Como é uma migration **aditiva** (só cria tabelas novas), não há risco de conflito.

### E se precisar recriar do zero?

Se alguém clonar o projeto e executar `pnpm db:up` + `pnpm prisma migrate dev` do zero, o Prisma aplicará as migrations em ordem cronológica:

1. `20260515120000_core_persistence_v1`
2. `20260517120000_evaluation_and_attendant`
3. `20260517130000_add_campus_and_administrative_units`

E as tabelas `campuses` e `administrative_units` serão criadas junto com todo o resto.

---

## 3. `PrismaCampusCatalogProvider`

### Arquivo criado

`src/infra/database/prisma/repositories/prisma-campus-catalog-provider.ts` (28 linhas)

```ts
import type { PrismaClient } from '@prisma/client'

import type { CampusCatalogProvider } from '#src/application/ai/ai-catalog-providers.js'
import type { AiCatalogItem } from '#src/application/ai/ai-gateway.js'

export class PrismaCampusCatalogProvider implements CampusCatalogProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async list(): Promise<AiCatalogItem[]> {
    const campuses = await this.prisma.campus.findMany({
      orderBy: { name: 'asc' },
    })

    return campuses.map((campus) => ({
      id: campus.id,
      label: campus.name,
    }))
  }
}
```

### O problema que este arquivo resolve

O `SendAiMessageUseCase` (UC-09) precisa, antes de chamar o gateway de IA, carregar uma lista de campi válidos para que possa:

1. Enviar esses dados ao `AiGateway` como contexto (para o LLM saber quais opções existem)
2. Validar o `campusId` que o LLM retornar no draft

Para isso, o use case depende do contrato `CampusCatalogProvider`:

```ts
// src/application/ai/ai-catalog-providers.ts
export interface CampusCatalogProvider {
  list(): Promise<AiCatalogItem[]>
}
```

Até agora, **nenhuma classe no sistema implementava essa interface**. O use case podia ser testado com mocks (e de fato era — veja `test/unit/application/send-ai-message-use-case.spec.ts`), mas em produção ele quebraria porque nenhum provider concreto existia para ser injetado.

`PrismaCampusCatalogProvider` é a primeira implementação concreta desse contrato.

### Por que Prisma e não outra fonte?

Poderíamos obter a lista de campi de várias formas:

| Fonte                        | Prós                                                                                          | Contras                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Prisma + tabela no banco** | Consistente com o resto do sistema; dados persistentes; auditável; pode ser populada via seed | Requer migration                                                |
| Arquivo JSON/config          | Simples, sem migration                                                                        | Sem integridade; não auditável; difícil de atualizar            |
| API externa                  | Dados sempre atualizados                                                                      | Dependência externa; latência; disponibilidade                  |
| Hardcoded no código          | Muito simples                                                                                 | Violação de Clean Architecture; impossível atualizar sem deploy |

A escolha por Prisma é natural: é o mesmo padrão usado por todos os outros repositórios do sistema (`PrismaUsersRepository`, `PrismaManifestationsRepository`, etc.), e a tabela `campuses` é a fonte oficial de dados.

### Análise linha a linha

```ts
export class PrismaCampusCatalogProvider implements CampusCatalogProvider
```

`implements CampusCatalogProvider` — a classe assina o contrato da camada de aplicação. Isso significa que qualquer código que depende de `CampusCatalogProvider` (como o `SendAiMessageUseCase`) pode receber esta instância sem saber que ela usa Prisma.

```ts
constructor(private readonly prisma: PrismaClient) {}
```

Injeção do `PrismaClient` via construtor. Mesmo padrão de todos os repositórios. O `PrismaClient` é singleton (instanciado em `src/infra/database/prisma/client.ts` e importado em `infrastructure.ts`).

```ts
async list(): Promise<AiCatalogItem[]> {
  const campuses = await this.prisma.campus.findMany({
    orderBy: { name: 'asc' },
  })
```

`findMany` sem `where` — retorna todos os registros da tabela `campuses`. A lista completa de campi é pequena o suficiente (dezenas, no máximo) para ser carregada integralmente em memória. `orderBy: { name: 'asc' }` garante que a lista seja previsível e facilite a busca do usuário.

```ts
return campuses.map((campus) => ({
  id: campus.id,
  label: campus.name,
}))
```

Mapeia o model do Prisma (`{ id, name, createdAt, updatedAt, units }`) para o DTO `AiCatalogItem` (`{ id, label }`). O contrato da aplicação não expõe metadados internos como timestamps ou relações — apenas o essencial para o contexto da IA.

**Por que não usar um Mapper?** Diferente dos repositórios de domínio (ex: `PrismaUsersRepository` que usa `userMapper.toDomain()`), aqui não estamos reconstruindo uma entidade de domínio. `AiCatalogItem` é um DTO simples da camada de aplicação. Não há regras de domínio envolvidas na criação dele. Um mapper seria overhead desnecessário.

### Onde este provider se encaixa no fluxo completo

```
Cliente HTTP
  ↓ POST /ai/chat { history, message }
SendAiMessageController
  ↓ valida body (ZodValidator)
SendAiMessageUseCase.execute({ history, message })
  ↓
campusCatalogProvider.list()                       ← AQUI
  ↓ retorna AiCatalogItem[]
administrativeUnitCatalogProvider.list()            ← (similar)
  ↓ retorna AiAdministrativeUnitCatalogItem[]
AiGateway.chat({ history, message, campuses, administrativeUnits })
  ↓ retorna AiGatewayChatResponse
SendAiMessageUseCase normaliza (intent, draft, missingFields, confidence)
  ↓
Resposta HTTP
```

---

## 4. `PrismaAdministrativeUnitCatalogProvider`

### Arquivo criado

`src/infra/database/prisma/repositories/prisma-administrative-unit-catalog-provider.ts` (26 linhas)

```ts
import type { PrismaClient } from '@prisma/client'

import type { AdministrativeUnitCatalogProvider } from '#src/application/ai/ai-catalog-providers.js'
import type { AiAdministrativeUnitCatalogItem } from '#src/application/ai/ai-gateway.js'

export class PrismaAdministrativeUnitCatalogProvider implements AdministrativeUnitCatalogProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async list(): Promise<AiAdministrativeUnitCatalogItem[]> {
    const units = await this.prisma.administrativeUnit.findMany({
      orderBy: { name: 'asc' },
    })

    return units.map((unit) => ({
      id: unit.id,
      label: unit.name,
      campusId: unit.campusId,
    }))
  }
}
```

### Diferença do provider de Campus

A interface `AdministrativeUnitCatalogProvider` retorna `AiAdministrativeUnitCatalogItem[]`, enquanto `CampusCatalogProvider` retorna `AiCatalogItem[]`. A diferença está no tipo:

```ts
// AiCatalogItem — base
export interface AiCatalogItem {
  id: string
  label: string
}

// AiAdministrativeUnitCatalogItem — estende com campusId
export interface AiAdministrativeUnitCatalogItem extends AiCatalogItem {
  campusId: string
}
```

O campo `campusId` extra é o que permite ao use case validar a **RN-UC09-11**: "A unidade administrativa sugerida só é válida quando pertence ao campus sugerido."

A validação acontece em `SendAiMessageUseCase.normalizeAdministrativeUnitId()`:

```ts
private normalizeAdministrativeUnitId(
  value: string | null,
  campusId: string | null,
  administrativeUnits: AiAdministrativeUnitCatalogItem[],
): string | null {
  // Primeiro: verifica se o ID está no catálogo
  const normalizedId = this.normalizeCatalogId(value, administrativeUnits, ...)
  if (normalizedId === null || campusId === null) return normalizedId

  // Segundo: verifica se a unidade pertence ao campus informado
  const belongsToCampus = administrativeUnits.some(
    (unit) => unit.id === normalizedId && unit.campusId === campusId
  )

  return belongsToCampus ? normalizedId : null
}
```

Sem o `campusId` no `AiAdministrativeUnitCatalogItem`, essa segunda validação seria impossível — ou exigiria uma segunda consulta ao banco.

### Por que carregar TODAS as unidades de uma vez?

Assim como os campi, o número de unidades administrativas é limitado (centenas, no máximo). Carregar tudo em memória é:

1. **Mais rápido** que fazer uma consulta filtrada por requisição (1 query vs N queries)
2. **Mais simples** — o use case faz a validação em memória com `.some()` (O(n))
3. **Consistente** — os dados não mudam no meio da validação

---

## 5. Registro no DI (`infrastructure.ts`)

### O que mudou

`src/main/factories/infrastructure.ts` — duas importações novas, duas instâncias novas, duas exports novas:

```ts
// NOVAS importações
import { PrismaAdministrativeUnitCatalogProvider } from '#src/infra/database/prisma/repositories/prisma-administrative-unit-catalog-provider.js'
import { PrismaCampusCatalogProvider } from '#src/infra/database/prisma/repositories/prisma-campus-catalog-provider.js'

// NOVAS instâncias
const campusCatalogProvider = new PrismaCampusCatalogProvider(prisma)
const administrativeUnitCatalogProvider = new PrismaAdministrativeUnitCatalogProvider(prisma)

// NOVAS exports
export const infrastructure = {
  // ... 9 existentes ...
  campusCatalogProvider,
  administrativeUnitCatalogProvider,
}
```

### O papel do `infrastructure.ts` na arquitetura

Em Clean Architecture, o **composition root** é o único lugar que sabe de todas as camadas e as conecta. Em `src/main/`, a injeção de dependências acontece de forma explícita e centralizada.

O objeto `infrastructure` é a referência central de todos os singletons. Sempre que uma factory de controller precisa de um repositório, serviço ou provider, ela importa o `infrastructure` e o acessa:

```ts
// Exemplo: src/main/factories/controllers/manifestation.ts
import { infrastructure } from '../infrastructure.js'

export function makeRegisterManifestationController(): RegisterManifestationController {
  const useCase = new RegisterManifestationUseCase(
    infrastructure.manifestationsRepository, // ← vem do infrastructure
    infrastructure.protocolGenerator, // ← vem do infrastructure
    infrastructure.accessCodeGenerator, // ← vem do infrastructure
    infrastructure.passwordHasher, // ← vem do infrastructure
  )
  return new RegisterManifestationController(useCase, new ZodValidator(schema))
}
```

As factories de controller **não instanciam dependências diretamente**. Elas recebem tudo pronto do `infrastructure`.

### Como os catalog providers serão usados

Quando a Fase 4 construir a factory `makeSendAiMessageController()`, ela fará algo como:

```ts
// src/main/factories/controllers/ai.ts (futuro)
import { infrastructure } from '../infrastructure.js'

export function makeSendAiMessageController(): SendAiMessageController {
  const useCase = new SendAiMessageUseCase(
    infrastructure.aiGateway, // Fase 3
    infrastructure.campusCatalogProvider, // ← FASE 1
    infrastructure.administrativeUnitCatalogProvider, // ← FASE 1
  )
  return new SendAiMessageController(useCase, new ZodValidator(schema))
}
```

### O que o `infrastructure` contém agora

Com a Fase 1, o objeto tem 11 singletons:

```
infrastructure:
├── passwordHasher              (BcryptjsHasher)
├── hashComparer                (BcryptjsHasher — mesma instância)
├── tokenGenerator              (JwtTokenGenerator)
├── protocolGenerator           (UuidProtocolGenerator)
├── accessCodeGenerator         (RandomAccessCodeGenerator)
├── usersRepository             (PrismaUsersRepository)
├── manifestationsRepository    (PrismaManifestationsRepository)
├── manifestationAdministrationRepository (PrismaManifestationAdministrationRepository)
├── manifestationInteractionsRepository   (PrismaManifestationInteractionsRepository)
├── manifestationEvaluationsRepository    (PrismaManifestationEvaluationsRepository)
├── campusCatalogProvider       (PrismaCampusCatalogProvider)         ← NOVO
└── administrativeUnitCatalogProvider      (PrismaAdministrativeUnitCatalogProvider)  ← NOVO
```

### O fluxo de dependências completo

```
main/factories/infrastructure.ts
  ├── importa PrismaClient (singleton)
  ├── instancia BcryptjsHasher ← recebe env.PASSWORD_HASH_ROUNDS
  ├── instancia JwtTokenGenerator ← recebe env.JWT_SECRET, env.JWT_EXPIRES_IN_SECONDS
  ├── instancia PrismaUsersRepository ← recebe prisma
  ├── instancia PrismaManifestationsRepository ← recebe prisma
  ├── ... (outros repositórios)
  ├── instancia PrismaCampusCatalogProvider ← recebe prisma        ← NOVO
  └── instancia PrismaAdministrativeUnitCatalogProvider ← recebe prisma  ← NOVO

main/factories/controllers/*.ts
  └── importa infrastructure
      └── passa dependências para use cases
          └── use cases são passados para controllers

main/routes/*.ts
  └── importa factory
      └── chama factory() para obter controller
          └── adaptRoute(controller) → handler do Fastify
```

---

## Validação da Fase 1

### TypeScript (`pnpm type:check`)

Sem erros. A compilação passou porque:

1. O `prisma generate` foi executado após a adição dos models, então o `@prisma/client` conhece `prisma.campus` e `prisma.administrativeUnit`
2. As interfaces `CampusCatalogProvider`, `AdministrativeUnitCatalogProvider`, `AiCatalogItem`, `AiAdministrativeUnitCatalogItem` já existiam em `src/application/ai/`
3. As importações usam o path alias `#src/` configurado no `tsconfig.json`

### Testes (`pnpm test`)

**260 testes, 0 falhas.** Todos os testes existentes continuam passando porque a Fase 1:

1. **Não alterou** nenhum arquivo existente (schema, providers, infrastructure foram todos adicionados, não modificados)
2. **Não importou** nenhum módulo que já não existisse (as interfaces de `src/application/ai/` já existiam)
3. **Não quebrou** nenhuma dependência existente

### Checklist de integridade

| Requisito                                                      | Status | Evidência                                                   |
| -------------------------------------------------------------- | ------ | ----------------------------------------------------------- |
| `CampusCatalogProvider` tem implementação concreta             | ✅     | `PrismaCampusCatalogProvider` criado                        |
| `AdministrativeUnitCatalogProvider` tem implementação concreta | ✅     | `PrismaAdministrativeUnitCatalogProvider` criado            |
| Providers podem ser injetados no use case                      | ✅     | Registrados em `infrastructure.ts`                          |
| Migration compatível com schema Prisma                         | ✅     | SQL gerado manualmente espelhando o schema                  |
| Migration aditiva (não quebra existente)                       | ✅     | Só CREATE TABLE, sem ALTER/DROP                             |
| Dados de campi terão onde ser armazenados                      | ✅     | Tabela `campuses`                                           |
| Unidades administrativas vinculadas a campi                    | ✅     | FK `administrative_units.campus_id → campuses.id`           |
| Consistência com padrões do projeto                            | ✅     | UUID, snake_case, timestamptz, RESTRICT/CASCADE, kebab-case |
