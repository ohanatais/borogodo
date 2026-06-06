# Plano de Ação — Borogodó

**Versão:** 2.1 (detalhado, pronto para handoff de código)
**Data:** 5 de junho de 2026
**Autora:** Ohana
**Contexto:** primeiro produto solo, full-code AI-assisted, ~10h/semana, foco em aprender e shipar rápido.

---

## 0. Como usar este documento

Este doc é auto-suficiente: dá pra abrir um novo chat de código (com skills de dev) e tocar a construção a partir daqui. Ordem de leitura para começar a codar: seção 1 (decisões travadas) → 6 (arquitetura) → 7 (repo + CLAUDE.md) → 8 (prompt de kickoff) → 5 (Fase 0 passo a passo). O resto é contexto e roadmap.

Há um **prompt de kickoff pronto pra colar** num agente de código na seção 8.

---

## 1. Decisões travadas

1. **Nome:** Borogodó (provisório, mas adotado). Domínio alvo: **borogodo.io** (disponível em 05/jun) + borogodo.app. Não usar "borodogo".
2. **O que é:** camada de **memória e inteligência de carreira**. A pessoa alimenta o trabalho real (texto, áudio, arquivos) e recebe (a) um **espelho** das suas forças/lacunas com evidência e (b) **conteúdo** na voz dela quando quiser. Tese: "o produto revela o seu borogodó profissional".
3. **Core duplo, peso igual:** espelho (inteligência) + conteúdo (presença). O espelho é construído primeiro na engenharia porque é o que torna o conteúdo bom.
4. **Público:** white-collar brasileiro amplo (tech, vendas, finanças, admin, marketing, RH). Beachhead: quem já registra trabalho / está em comunidades.
5. **Forma:** app web (destino). Sem mobile dedicado no v1.
6. **Captura:** multimodal — upload de arquivos, áudio+transcrição, texto rápido. MCP é experimento paralelo, não dependência.
7. **Stack:** TypeScript + Next.js (App Router) + Supabase (Postgres + Auth + Storage + pgvector) + Drizzle ORM + LLM via API (abstraído) + API de transcrição + Vercel + PostHog + Sentry.
8. **Objetivo nº1:** aprender + portfólio + audiência. Receita relevante é bônus (ver mercado.md).

---

## 2. Roadmap por fases (~10h/semana)

| Fase | Resultado que destrava | Duração-alvo |
|---|---|---|
| 0 | Fundação: repo + deploy vazio no ar + login | ~1 sem |
| 1 | Captura multimodal → estruturação (arquivo+áudio+texto vira entradas) | ~2–3 sem |
| 2 | **Espelho** (timeline + temas/forças/lacunas + busca em linguagem natural) | ~3 sem |
| 3 | **Conteúdo na voz** (entrada → rascunho bom de verdade) | ~2 sem |
| 4 | Loop fechado + dogfooding diário + recorrência | ~2 sem |
| 5 | Landing + soft launch (3–5 betas) | ~2 sem |
| — | Trilha paralela: experimento de MCP de captura | quando der |

Até um beta usável por terceiros: ~12–15 semanas de 10h (≈ 3–4 meses). Você usa (dogfood) bem antes — fim da Fase 2.

---

## 3. Princípios de execução

1. Fatie fino, end-to-end, desde o dia 1 (walking skeleton). Nunca construir um módulo inteiro antes de tocar o próximo.
2. Dogfooding é o programa de pesquisa: toda semana, gere algo real sobre o seu próprio trabalho.
3. Escopo é inimigo: tudo fora do caminho capturar→espelho→conteúdo é "depois".
4. Decisões reversíveis (nome, cor, copy): decida rápido. Irreversíveis (banco, modelo de dados): já decididas aqui.
5. Commits pequenos e frequentes. Cada fatia que funciona = 1 commit.
6. Build in public com 1 semana de atraso: documente o que já funciona.

---

## 4. Definition of Done por fase (critérios de aceite)

- **Fase 0:** você loga no domínio público e vê uma tela protegida vazia.
- **Fase 1:** você fala um áudio de 1 min (ou sobe um .md) e vê virar entradas estruturadas editáveis.
- **Fase 2:** você olha o espelho e (a) reconhece como trabalha e (b) descobre ≥1 coisa que não tinha percebido; busca "o que entreguei no Q1?" funciona.
- **Fase 3:** você publica de verdade um conteúdo gerado e sente orgulho.
- **Fase 4:** 2 semanas seguidas usando sem cair pra fora da ferramenta.
- **Fase 5:** ≥1 beta além de você publica algo gerado e te dá feedback.

---

## 5. Fase 0 — Fundação (passo a passo)

Cada item ≈ uma sessão de ~2h.

1. **Repo:** criar `borogodo` no GitHub (privado), com README (visão em 3 linhas) e licença. Clonar local.
2. **App:** `npx create-next-app@latest` (TypeScript, App Router, Tailwind, ESLint). Rodar local (`npm run dev`).
3. **UI base:** instalar shadcn/ui e configurar tema. Adicionar a paleta da marca (roxo-jambo #46205C, coral #FF5A5F, mel #F2A93B, verde-água #18B79B, creme #F7EFE3) como CSS variables.
4. **Supabase:** criar projeto; pegar URL e chaves. Ligar Auth por magic link (e-mail). Criar tabela `app_user` ligada a `auth.users`.
5. **RLS:** ativar Row Level Security em todas as tabelas desde já (cada usuário só vê o que é seu).
6. **Env/secrets:** `.env.local` (não commitar) com `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LLM_API_KEY`. Espelhar na Vercel.
7. **Deploy:** conectar repo na Vercel; deploy automático por push; apontar domínio (borogodo.io) depois de registrar.
8. **Tela protegida:** rota `/app` que exige login e mostra "Olá, Ohana". Prova o fim-a-fim de auth.

**DoD:** logar no domínio público e ver a tela protegida.

---

## 6. Fase 1 — Captura + estruturação (passo a passo)

1. **Schema** (Drizzle): criar `app_user`, `raw_log`, `entry` (ver modelo na seção 9). Migration aplicada no Supabase.
2. **Upload de arquivos:** tela que aceita .md/.pdf/.docx/.txt → extrai texto → salva em `raw_log` (source=`file`). Para pdf/docx, extrair texto no server.
3. **Áudio → transcrição:** gravar/subir áudio → enviar pra API de transcrição → salvar transcrição em `raw_log` (source=`audio`). **Desbloqueio do público amplo.**
4. **Captura rápida:** input de texto "o que você fez?" → `raw_log` (source=`text`).
5. **Estruturação (LLM):** função `structure(rawLog)` que devolve N `entry` no schema canônico (what_i_did, decision, learning, impact, occurred_on, tags), com **structured output validado por Zod**. Reprocessável.
6. **Timeline:** listar entradas por data, filtro por tag, abrir/editar/corrigir entrada.

**DoD:** áudio de 1 min ou .md real vira entradas estruturadas editáveis.

> Fases 2–5 detalhadas em entregáveis na seção 11 (backlog). Arquitetura e modelo abaixo valem para todas.

---

## 7. Arquitetura técnica

### 7.1 Stack (e o porquê)
| Camada | Escolha | Porquê |
|---|---|---|
| Linguagem | TypeScript | uma só no front e back; tipagem ajuda IA e revisão |
| Framework | Next.js (App Router) | full-stack num projeto; server actions + API routes |
| UI | React + Tailwind + shadcn/ui | componentes prontos, velocidade |
| Banco/Auth/Storage | Supabase (Postgres + pgvector) | Postgres de verdade, auth e storage prontos, free tier |
| ORM | Drizzle | queries tipadas, transparente |
| LLM | API frontier, abstraída | não treinar modelo; trocar provedor sem reescrever |
| Transcrição | API speech-to-text | captura por áudio |
| Deploy | Vercel | push-to-deploy, nativo de Next |
| Produto/erros | PostHog + Sentry | funil de ativação + alertas de erro |

### 7.2 Pipeline central
```
[trabalho real] arquivo / áudio / texto / (MCP)
        │  (1) CAPTURA  → raw_log (imutável)
        ▼
   (2) ESTRUTURAÇÃO (LLM) → entry (+ embedding)
        ▼
 ┌──────┴───────────────────────────┐
(3A) ESPELHO (LLM + busca vetorial)   (3B) CONTEÚDO (LLM + voz)
 temas, forças/lacunas, busca NL       rascunho na voz da pessoa
        ▼                                   ▼
 [autoconhecimento]                   [presença] → feedback alimenta voz/sinal
```
Cada etapa é um módulo isolado com input/output claro → fácil de pedir pra IA implementar uma por vez.

### 7.3 Camada de IA
1. **Estruturação:** modelo barato + structured output (JSON validado por Zod).
2. **Espelho:** embeddings (pgvector) pra busca + LLM bom pra sintetizar forças/lacunas **sempre com evidência** (entradas ligadas). Rubrica de "o que é força/lacuna" escrita por você (PM).
3. **Voz:** modelo melhor + few-shot com 2–3 textos reais da pessoa + `voice_profile` + instruções fortes anti-genérico (sem jargão de LinkedIn batido, sem "no mundo de hoje", sem emoji forçado).
4. **Transversal:** prompts versionados em `/lib/ai/prompts/`; provedor abstraído (`llm.ts`); **golden set** de 10–15 casos seus pra testar regressão de qualidade ao mexer em prompt; logar cada chamada (modelo, custo, latência, output).

### 7.4 Segurança e privacidade (pilar de confiança)
RLS por usuário; secrets fora do código; **exportar tudo** e **apagar conta**; transparência sobre o que vai pro LLM; política de privacidade simples (LGPD) antes do soft launch; cuidado redobrado com dado corporativo no experimento de MCP.

---

## 8. Modelo de dados

```sql
app_user(
  id uuid pk,                 -- = auth.users.id
  email text,
  voice_profile jsonb,        -- tom, comprimento, jargão, exemplos de texto (few-shot)
  created_at timestamptz
)

raw_log(                      -- material bruto, NUNCA destruído (reprocessável)
  id uuid pk,
  user_id uuid fk -> app_user,
  source text,                -- file | audio | text | mcp
  content text,
  filename text,
  created_at timestamptz
)

entry(                        -- unidade de valor: trabalho estruturado
  id uuid pk,
  user_id uuid fk,
  raw_log_id uuid fk -> raw_log null,
  what_i_did text,
  decision text,
  learning text,
  impact text,
  occurred_on date,
  tags text[],
  embedding vector(1536),     -- pgvector, p/ busca em linguagem natural
  signal_score numeric,       -- 0..1
  signal_reason text,
  is_signal boolean,
  user_feedback text,         -- accepted | dismissed | null (ensina o gosto)
  created_at timestamptz, updated_at timestamptz
)

theme(                        -- espelho: forças/lacunas
  id uuid pk, user_id uuid fk,
  name text, kind text,       -- strength | gap
  summary text
)
theme_entry(theme_id uuid fk, entry_id uuid fk)   -- evidência do tema

draft(                        -- conteúdo gerado
  id uuid pk, user_id uuid fk, entry_id uuid fk,
  qa jsonb,                   -- perguntas/respostas que guiaram
  body text, tone text,
  status text,                -- generated | edited | published | discarded
  published_at timestamptz, created_at timestamptz
)
```
Decisões-chave: `raw_log` imutável; `entry` separa estrutura de sinal; `theme` sempre ligado a evidência; `voice_profile` ataca o risco de "soar IA".

---

## 9. Estrutura do repositório + CLAUDE.md

```
borogodo/
  app/
    (marketing)/        landing, waitlist
    (app)/              timeline, entry, espelho, draft
    api/
  lib/
    ai/ prompts/  llm.ts  structure.ts  signal.ts  espelho.ts  generate.ts
    db/ schema.ts  queries.ts
    auth.ts
  components/
  evals/                golden set + script de avaliação de prompts
  docs/decisions/       ADRs (1 parágrafo por decisão técnica)
  CLAUDE.md
  README.md
```

**Conteúdo sugerido do `CLAUDE.md`** (contexto pro agente de código):
```
# Borogodó — contexto do projeto
Produto: camada de memória e inteligência de carreira. Captura trabalho real
(texto/áudio/arquivo) e devolve (1) espelho de forças/lacunas com evidência e
(2) conteúdo na voz da pessoa. Público: white-collar brasileiro. PT-BR.

## Stack
Next.js (App Router) + TypeScript + Tailwind + shadcn/ui. Supabase
(Postgres + Auth + Storage + pgvector). Drizzle ORM. LLM via API abstraída
em lib/ai/llm.ts. Deploy Vercel. PostHog + Sentry.

## Convenções
- Tudo que o LLM retorna é validado com Zod.
- Prompts ficam em lib/ai/prompts/, versionados.
- RLS sempre ligado; cada usuário só vê seus dados.
- Commits pequenos; uma fatia funcional por commit.
- raw_log é imutável; reprocessar é sempre possível.

## Princípios de produto
1. Captura quase invisível e multimodal.
2. Valor = revelar (forças + o que contar), não escrever pela pessoa.
3. Voz sempre da pessoa; nunca soar IA genérica.
```

---

## 10. Prompt de kickoff (colar num chat de código)

> Vou construir o "Borogodó", um app web de inteligência de carreira (PT-BR), sozinha, com sua ajuda, em sessões de ~2h. Stack: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase (Postgres, Auth, Storage, pgvector) + Drizzle + LLM via API abstraída + Vercel. Sou PM, sei ler código e decidir arquitetura, mas quero que você escreva a maior parte e me explique o que eu não entender.
>
> Comece pela Fase 0: (1) me guie pra subir um projeto Next.js + TS + Tailwind + shadcn rodando local; (2) configurar Supabase com Auth por magic link e RLS; (3) criar uma rota /app protegida que exige login; (4) deploy vazio na Vercel. Vá em passos pequenos, um de cada vez, com os comandos exatos, e pare pra eu rodar e confirmar antes de seguir. Quando algo falhar, me ajude a ler o erro. No fim de cada fatia funcional, me diga o que commitar.
>
> Depois seguimos pra Fase 1 (captura multimodal + estruturação com LLM validada por Zod). O modelo de dados e a arquitetura estão num doc que vou colar quando chegarmos lá.

---

## 11. Backlog inicial priorizado (primeiras tarefas)

Fase 0: [0.1] repo+README · [0.2] Next.js+Tailwind+shadcn local · [0.3] Supabase Auth+RLS · [0.4] deploy vazio Vercel · [0.5] rota /app protegida.
Fase 1: [1.1] schema Drizzle (app_user, raw_log, entry) · [1.2] upload de arquivo → raw_log · [1.3] estruturação LLM → entry (Zod) · [1.4] timeline + editar entrada · [1.5] áudio → transcrição → raw_log · [1.6] captura rápida de texto.
Fase 2: [2.1] embeddings em entry (pgvector) · [2.2] busca em linguagem natural · [2.3] clustering em themes (strength/gap) com evidência · [2.4] tela do espelho (forças/lacunas + temas).
Fase 3: [3.1] voice_profile (few-shot) · [3.2] geração de rascunho guiada por 2–3 perguntas · [3.3] variações de tom · [3.4] revisar/copiar/levar pro LinkedIn.

---

## 12. Como trabalhar com IA (loop)

Spec curta da fatia (sua vantagem de PM) → IA implementa → você roda com dados reais → commit pequeno → refatora quando doer. Use a IA como tutora: peça pra explicar o que não entende. Teste automatizado pelo menos no pipeline de IA (dado um raw_log, sai entry válida?). Não deixe a IA escolher arquitetura grande sozinha — já está decidida aqui.

**Currículo mínimo just-in-time:** Fase 0 → Git, deploy, env, cliente/servidor. Fase 1 → banco relacional, queries, fluxo UI↔banco. Fase 2 → chamada de LLM, tokens/custo, structured output, embeddings, engenharia de prompt. Fase 3 → auth/RLS, medir funil.

---

## 13. Métricas

North Star: ações de valor por usuário ativo/mês (insight consultado **ou** conteúdo publicado). Funil: captura → 1ª entrada → 1º insight (ativação A) → 1ª publicação (ativação B) → recorrência semanal (retenção). Para solo, **retenção > aquisição**. Instrumentar com PostHog na Fase 3.

---

## 14. Riscos a validar (ordem)

1. O espelho entrega valor percebido acima de um brag doc comum? (dogfood + 5 entrevistas)
2. A qualidade do conteúdo é boa o bastante pra publicar com orgulho? (você publica de verdade)
3. Áudio/texto livre reduz atrito pra quem não mantém logs?
4. Público white-collar não-tech adota, ou começar mais estreito?
5. Disposição a pagar em real (landing + 1 pergunta; não construir billing no v1).
6. MCP de captura é viável e seguro?

---

## 15. Próximas 2 semanas

**Semana 1 (Fase 0):** repo + Next.js local + Supabase Auth + RLS + deploy vazio + rota /app protegida. Registrar borogodo.io.
**Semana 2 (Fase 1 início):** schema (app_user, raw_log, entry); upload de .md → raw_log; 1ª estruturação LLM (raw_log → entries validadas); timeline básica.
**Paralelo, custo zero:** 1º post de build in public ("vou construir o Borogodó, documentando tudo") + landing de waitlist simples.

> Documento vivo. Revise ao fim de cada fase: o que mudou no entendimento do problema deve mudar o plano.
