# Quickstart: Validação da 017 Feed de Registros

## Pré-requisitos

- App rodando localmente (`pnpm dev`)
- Conta QA com ≥ 5 registros (mix de datas, empresas, métricas)
- Migration `01X_entry_title.sql` aplicada (`supabase db push` ou Supabase Studio)
- Variável `ANTHROPIC_API_KEY` configurada

---

## Cenários de Validação

### 1. Feed cru de registros (US1 — P1)

**Setup**: Conta QA com registros.

**Passos**:
1. Abrir `/registros`
2. Verificar que todos os registros aparecem como cards colapsados com título
3. Expandir um card → ver campos estruturados + botão "Usar"
4. Clicar "Usar" → geração de conteúdo abre com o registro carregado

**Aceite**:
- Nenhum card sem título (IA ou fallback)
- "Usar" leva à geração com a evidência certa

---

### 2. Excluir registro (US1 — P1)

**Setup**: Conta QA com um registro duplicado ou descartável.

**Passos**:
1. Expandir o card do registro alvo
2. Clicar "Excluir" → dialog de confirmação aparece
3. Confirmar exclusão
4. Verificar que o item some do feed imediatamente

**Aceite**:
- Registro removido do feed e da grade-faísca após exclusão
- Outros registros não afetados

---

### 3. Dois eixos de tempo (US2 — P1)

**Setup**: Conta QA com registros com datas variadas em `entry_date`.

**Passos**:
1. Abrir `/registros` → eixo padrão "Quando anotei" (`created_at`)
2. Alternar toggle para "Quando aconteceu" → URL muda (`?axis=entry_date`)
3. Verificar que a ordem muda para `entry_date`
4. Copiar a URL e abrir numa aba nova → mesmo eixo

**Aceite**:
- Estado refletido na URL
- URL direta reproduz o eixo correto

---

### 4. Título em captura nova (US3 — P2)

**Setup**: App rodando com `ANTHROPIC_API_KEY`.

**Passos**:
1. Fazer uma captura de texto pelo Painel (ex.: "Lançamos a feature X com 200 usuários na primeira semana")
2. Abrir `/registros`
3. Verificar que o novo registro aparece com um título curto e semântico (não apenas os primeiros chars do texto)

**Aceite**:
- Campo `title` persistido no banco (verificar no Supabase Studio: `SELECT title FROM entries ORDER BY created_at DESC LIMIT 1`)
- Título ≤ 80 chars, semanticamente relevante

---

### 5. Fallback de título em registro antigo (US3 — P2)

**Setup**: Conta QA com registros sem `title` (criados antes da migration).

**Passos**:
1. Abrir `/registros`
2. Verificar que registros antigos têm título (fallback: início de `what_i_did`)

**Aceite**:
- Nenhum card sem título, mesmo para registros antigos

---

### 6. Busca + filtros (US4 — P2)

**Passos**:
1. Em `/registros`, digitar um termo presente em pelo menos uma entrada
2. Verificar que apenas os registros correspondentes aparecem
3. Adicionar filtro "Com métrica" → feed reduz ao subconjunto
4. Limpar filtros → feed volta ao total

**Aceite**:
- Busca sem vazamento de registros de outro usuário (testar com conta secundária se possível)
- Filtros combináveis

---

### 7. Grade-faísca (US5 — P2)

**Setup**: Conta QA com registros distribuídos ao longo de semanas/meses.

**Passos**:
1. Abrir `/registros` → grade aparece no topo
2. Dias com registros têm faíscas; dias sem têm células claras (nunca vermelhas)
3. Clicar em uma faísca → feed filtra pelo período (URL atualiza)
4. Abrir com conta quase vazia → grade oculta ou contida (sem "céu vazio triste")

**Aceite**:
- Threshold de massa crítica funciona
- Clique na faísca filtra o feed

---

### 8. Painel atualizado (US6 — P2)

**Passos**:
1. Abrir `/painel`
2. Verificar que "Seus registros" (5 recentes) substitui `TrajectoryHighlights`
3. `MiniTimeline` ainda aparece
4. Clicar "Ver tudo →" → navega para `/registros`
5. Em `/registros`, usar filtro "Com métrica" → reproduz a lista antiga de destaques

**Aceite**:
- `TrajectoryHighlights` não aparece mais no painel
- Dados de métrica acessíveis via filtro no feed

---

## Verificações de Qualidade

```bash
# Testes
pnpm test

# Build sem erros
pnpm build

# Type check
pnpm tsc --noEmit
```

### RLS (segurança)

Verificar que o endpoint `/api/feed` com a sessão do usuário A não retorna registros
do usuário B. Testar com `curl` ou Postman:

```bash
# Com cookie de sessão do usuário A
curl -H "Cookie: sb-..." "http://localhost:3000/api/feed"
# → só registros do usuário A
```

### SQL Injection

```bash
# Busca com caractere suspeito
curl "http://localhost:3000/api/feed?q='; DROP TABLE entries; --"
# → deve retornar 200 com zero resultados, sem erro 500
```

---

## Referências

- [spec.md](spec.md) — requisitos funcionais completos
- [data-model.md](data-model.md) — types, schema, endpoints
- [contracts/api-feed.md](contracts/api-feed.md) — contrato das APIs
