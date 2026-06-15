# Quickstart: Validar o Motor de Voz + Geração (013)

Validação end-to-end do elo 013, conforme a seção "Verificação por elo" do epic plan. Usa a conta QA
de teste (Mailinator + cookie de sessão) já documentada na memória do projeto.

## Pré-requisitos

- Branch `013-motor-de-voz` rodando local (`npm run dev`).
- Conta QA com **espelho gerado** e **algumas entradas** com impacto/empresa.
- Migration `009` aplicada (local ou no projeto Supabase de dev).
- `ANTHROPIC_API_KEY` configurada no ambiente.

## Roteiro de validação

### 1. Voz híbrida + post a partir de um tema (US1)
1. Abrir `/espelho` e escolher um **tema de força** (ex: "produto 0→1").
2. Clicar **"Usar"** no tema → a tela de geração abre **já com a evidência carregada** (nunca página
   em branco).
3. Conferir os **2 rascunhos de post**: cada afirmação cita evidência real das entradas; nenhum tem
   travessão, antítese, jargão de LinkedIn ou número inventado.
4. Colar 1 amostra de voz em "afinar voz" e **regerar** → confirmar que o tom dos novos rascunhos
   reflete a amostra e que o `voice_profile` foi salvo.

### 2. Resumo de impacto a partir de uma entrada (US2)
1. Abrir uma **entrada** com impacto no histórico.
2. Clicar **"Usar"** → escolher **"Resumo de impacto"**.
3. Conferir as **2 versões**: factuais, ancoradas na entrada, sem inventar métrica ausente.

### 3. Editar, ajustar, copiar (US3)
1. Escolher um rascunho e **editar o texto** inline.
2. Aplicar o chip **"tira o jargão"** → o texto regera mantendo a evidência e passa nas regras anti-IA.
3. Aplicar **"mais curto"** → o texto encurta sem perder o fato.
4. Clicar **"Copiar"** → confirmar que foi pra área de transferência (e o fallback funciona se o
   navegador bloquear clipboard).

### 4. Persistir + "soa como você?" (US4)
1. Após copiar, recarregar e confirmar (via estado/UI) que o rascunho **persistiu** com o status certo.
2. Responder **"soa como você? → não soa"** → confirmar que salvou e **não** regerou (v1).

### 5. Harness de qualidade (golden set)
```bash
npm run test -- src/lib/ai/content
```
- Todos os casos do golden set passam: zero violações anti-IA e evidência real citada.
- Fixtures ruins (travessão, antítese, número inventado, jargão) retornam a violação esperada por
  `assert`.

## Critério de aceite manual (Ohana)

> **"Você publicaria isso com orgulho?"** — em ao menos um **post** e um **resumo de impacto** gerados
> a partir de evidência real. Se a resposta for "não", o problema é de prompt/voz, não de UI: ajustar
> antes do PR.

## Checklist de saída
- [ ] Nenhum ponto de entrada mostra página em branco (sempre chega com evidência).
- [ ] 100% dos rascunhos exibidos passam no ruleset anti-IA (após ≤ 1 regeneração).
- [ ] Nenhum número inventado; métrica ausente vira afirmação qualitativa.
- [ ] `drafts` e `voice_profile` protegidos por RLS (testar com 2 usuários).
- [ ] Cobertura ≥ 80% no módulo `src/lib/ai/content/`.
- [ ] 375px revisado; toques 48px; foco visível; contraste AA; zero string hardcoded.
- [ ] `/impeccable audit` + `/security-review` + `/pr-review` rodados antes do PR.
