# Quickstart: Pipeline de Captura

**Feature**: `003-capture-pipeline`

## Pré-requisitos (ações manuais)

1. **Variáveis de ambiente** em `.env.local`:
   - `ANTHROPIC_API_KEY` (server-side; nunca `NEXT_PUBLIC_`)
   - `AI_PROVIDER` (opcional; default `anthropic`). Mantenha `anthropic` no MVP — `deepseek` é só costura (stub).
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (já do 002)
2. **Dependências**:
   ```bash
   npm install @anthropic-ai/sdk zod pdf-parse
   npm install -D @types/pdf-parse
   ```
3. **Migration do Supabase** — abrir o SQL editor do projeto e rodar
   `supabase/migrations/00X_entries.sql` (conteúdo em `data-model.md`).

## Validação rápida (após implementação)

### US1 — captura de texto
```bash
# autenticado (cookie de sessão), via app:
curl -X POST http://localhost:3000/api/capture \
  -F kind=text \
  -F content='Fechei a migração do banco no prazo, foi tenso mas deu certo'
# esperado: 200 { entries:[{id,...}], reflection:{summary,pills,move} }
```
Verifique em `entries` que uma linha foi criada com seu `user_id`.

### Borda
```bash
curl -X POST .../api/capture -F kind=text -F content='ok'
# esperado: 400 "Conta um pouco mais, ainda não consegui captar."

curl -X POST .../api/capture -F kind=audio
# esperado: 501 "Captura por áudio/imagem chega em breve." (costura — ver "Costuras" abaixo)
```

### US2 — import de PDF/LinkedIn
```bash
curl -X POST http://localhost:3000/api/capture \
  -F kind=file \
  -F file=@curriculo.pdf
# esperado: 200 { entries:[{id, source:'linkedin_pdf', ...}], reflection: null }
# (sem reflexo — extração pura; conjunto pode ter 1..N entradas)

curl -X POST .../api/capture -F kind=file -F file=@arquivo.docx
# esperado: 400 "Arquivo inválido" (precisa ser application/pdf)

curl -X POST .../api/capture -F kind=file -F file=@curriculo-grande.pdf  # > 10 MB
# esperado: 400 "Arquivo muito grande (máx 10 MB)"
```

### US3 — enrich
```bash
curl -X PATCH http://localhost:3000/api/entries/<ENTRY_ID>/enrich \
  -H 'Content-Type: application/json' \
  -d '{"answer":"Reduziu deploy em 40%","field":"metric"}'
# esperado: 200 { ok:true, entry:{id, metric:"Reduziu deploy em 40%"} }; nenhuma chamada de IA

curl -X PATCH .../api/entries/<ENTRY_ID>/enrich \
  -H 'Content-Type: application/json' \
  -d '{"answer":"qualquer coisa","field":"titulo"}'
# esperado: 400 "Campo inválido para enriquecimento" (fora de metric|impact|decision|learning)

curl -X PATCH .../api/entries/<ENTRY_ID_DE_OUTRO_USUARIO>/enrich \
  -H 'Content-Type: application/json' \
  -d '{"answer":"qualquer coisa","field":"metric"}'
# esperado: 404 "Entrada não encontrada" (RLS impede o update; nenhuma linha afetada)
```

## Costuras deixadas para 004/005 (não remover)

- **`kind=audio` / `kind=image`** → `501` em `/api/capture` (`ERROR_MESSAGES.comingSoon`). Implementação real (transcrição/visão) é escopo de feature futura; `src/lib/ai/transcribe.ts` é stub documentado.
- **`triggerProactiveInsight`** (`src/lib/ai/extraction/jobs.ts`) → no-op; corpo real chega com a feature **005-panel** (tabela `proactive_insights`).
- **`maybeRegenerateMirror`** (`src/lib/ai/extraction/jobs.ts`) → no-op; corpo real chega com a feature **004-mirror** (tabela `mirror_snapshots`). `buildCaptureContext` já é tolerante a essa tabela ainda não existir.
- **`AI_PROVIDER=deepseek`** (`src/lib/ai/providers/deepseek.ts`) → stub; o default do MVP permanece `anthropic` (Princípio III da constituição).

## Testes

```bash
npm run test          # Vitest
npm run test -- --coverage   # cobertura ≥ 80% nos módulos de extração/validação/rota/db/pdf (medido: ~96%)
```

## Checklist de saída (Definition of Done)

- [x] Migration `entries` aplicada.
- [x] `/api/capture` cobre texto + arquivo; áudio/imagem → 501.
- [x] Toda saída de LLM validada por Zod antes de persistir.
- [x] `extractFromLinkedIn` retorna entradas válidas (testado).
- [x] `/enrich` respeita RLS (teste automatizado simula entrada de outro usuário → 404; recomenda-se também teste manual multiusuário antes do go-live).
- [x] Jobs `triggerProactiveInsight` / `maybeRegenerateMirror` são stubs com log de erro (`fireAndForget` testado).
- [x] Cobertura ≥ 80% nos módulos de extração/validação/rota/db/pdf (96% lines / 93% branches); sem `any`; funções ≤ 40 linhas; sem catch vazio.
