# Quickstart: Pipeline de Captura

**Feature**: `003-capture-pipeline`

## Pré-requisitos (ações manuais)

1. **Variáveis de ambiente** em `.env.local`:
   - `ANTHROPIC_API_KEY` (server-side; nunca `NEXT_PUBLIC_`)
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
# esperado: 400 "Conta um pouco mais — não consegui captar."

curl -X POST .../api/capture -F kind=audio
# esperado: 501 "Captura por áudio/imagem chega em breve."
```

### US3 — enrich
```bash
curl -X PATCH http://localhost:3000/api/entries/<ENTRY_ID>/enrich \
  -H 'Content-Type: application/json' \
  -d '{"answer":"Reduziu deploy em 40%","field":"metric"}'
# esperado: 200 { ok:true }; nenhuma chamada de IA
```

## Testes

```bash
npm run test          # Vitest
npm run test -- --coverage   # cobertura ≥ 80% nos módulos de extração/validação/rota
```

## Checklist de saída (Definition of Done)

- [ ] Migration `entries` aplicada.
- [ ] `/api/capture` cobre texto + arquivo; áudio/imagem → 501.
- [ ] Toda saída de LLM validada por Zod antes de persistir.
- [ ] `extractFromLinkedIn` retorna entradas válidas (testado).
- [ ] `/enrich` respeita RLS (teste multiusuário).
- [ ] Jobs `triggerProactiveInsight` / `maybeRegenerateMirror` são stubs com log de erro.
- [ ] Cobertura ≥ 80%; sem `any`; funções ≤ 40 linhas; sem catch vazio.
