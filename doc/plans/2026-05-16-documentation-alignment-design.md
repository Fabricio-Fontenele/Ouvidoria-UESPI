# Design: Alinhamento e Limpeza da Documentação

## Objetivo

Reduzir ambiguidade documental antes da subida da infraestrutura, preservando materiais antigos como legado explícito e alinhando as features e o PRD ao comportamento atual do core.

## Decisões aprovadas

- manter `doc/cockburn/cockburn.md` como fonte canônica dos casos de uso;
- mover `doc/cockburn_project.md` para `doc/legacy/` com aviso de substituição;
- mover os `.drawio` de numeração antiga para `doc/legacy/use-cases/`;
- mover `doc/basic/chatbot.md` para `doc/architecture/ai-chatbot.md`;
- renomear `doc/features/UC1-sing-up.md` para `doc/features/UC1-sign-up.md`;
- alinhar `UC-04` com `accessCode`, `involvedPeople`, `AccessCodeGenerator` e `PasswordHasher`;
- alinhar `UC-06` ao uso de `ManifestationAdministrationRepository.finalizeByAuthor(...)`;
- corrigir a numeração duplicada do PRD.

## Execução

1. Reorganizar caminhos e separar material legado.
2. Atualizar as specs canônicas impactadas.
3. Corrigir referências internas e validar formatação.

## Fora de escopo

- reescrever o conteúdo semântico dos diagramas `.drawio` antigos;
- reconciliar tecnicamente o conteúdo legado com a modelagem atual;
- criar infraestrutura HTTP, banco ou adapters.
