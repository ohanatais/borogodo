# /reset-user — Reset de conta para testes (onboarding do zero)

Reseta **todos os dados** de uma conta de usuário para o estado de recém-cadastrado,
sem excluir o usuário do auth. Usado para testes manuais e QA.

**Usuário alvo:** $ARGUMENTS

Se `$ARGUMENTS` estiver vazio, usar a conta QA padrão:
- Email: `borogodo.qa.verify@mailinator.com`
- User ID: `8faa0e71-0fba-4844-847a-4fe7689395b9`

**Ambiente alvo:** dev (`tsxvlxszlynwmmlskugg`) por padrão.
Se `$ARGUMENTS` contiver "prod", usar prod (`hzuogqfodjuvkoxugifx`) — pedir confirmação explícita antes.

---

## O que fazer

### Passo 1 — Resolver o user_id

Se o argumento for um email (contém `@`):
```sql
SELECT id, email FROM auth.users WHERE email = '<EMAIL>';
```
Confirmar o resultado com a Ohana antes de continuar.

Se o argumento já for um UUID, usar diretamente.

---

### Passo 2 — Executar o reset (nessa ordem)

```sql
-- 1. Apagar rascunhos de conteúdo
DELETE FROM public.drafts WHERE user_id = '<USER_ID>';

-- 2. Apagar entradas (e embeddings/evidências junto, são colunas da mesma tabela)
DELETE FROM public.entries WHERE user_id = '<USER_ID>';

-- 3. Apagar snapshots do espelho
DELETE FROM public.mirror_snapshots WHERE user_id = '<USER_ID>';

-- 4. Apagar insights proativos
DELETE FROM public.proactive_insights WHERE user_id = '<USER_ID>';

-- 5. Resetar perfil para estado pós-cadastro
UPDATE public.profiles
SET
  onboarding_completed = false,
  voice_profile        = null,
  linkedin_url         = null,
  github_url           = null,
  current_title        = null,
  area                 = null
WHERE id = '<USER_ID>';
```

---

### Passo 3 — Verificar

```sql
SELECT
  p.onboarding_completed,
  p.voice_profile,
  p.linkedin_url,
  p.current_title,
  p.area,
  (SELECT COUNT(*) FROM public.entries          WHERE user_id = p.id) AS entries,
  (SELECT COUNT(*) FROM public.mirror_snapshots WHERE user_id = p.id) AS mirrors,
  (SELECT COUNT(*) FROM public.proactive_insights WHERE user_id = p.id) AS insights,
  (SELECT COUNT(*) FROM public.drafts           WHERE user_id = p.id) AS drafts
FROM public.profiles p
WHERE p.id = '<USER_ID>';
```

Resultado esperado: `onboarding_completed = false`, todos os counts = 0.

---

### Passo 4 — Reportar

Ao terminar, informar:
- Qual usuário foi resetado (email + user_id)
- Qual ambiente (dev / prod)
- Counts antes e depois de cada tabela
- Se houve erro em alguma etapa

**Nunca** excluir o registro em `auth.users` nem alterar `name`, `email` ou `avatar_url` do perfil.
