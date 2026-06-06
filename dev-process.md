# Processo de Desenvolvimento — Borogodó

> Guia de referência do zero ao deploy. Atualizar conforme o produto evolui.

---

## 1. Varredura de segurança dos repos externos

### spec-kit (github/spec-kit) — ✅ SEGURO para usar

- **O que é:** CLI Python (`specify-cli`) + templates de comandos para agentes de IA. Metodologia de Spec-Driven Development: constitution → specify → clarify → plan → tasks → implement.
- **Licença:** MIT — repositório da organização oficial do GitHub.
- **Risco:** baixo. Os scripts bash criam pastas e arquivos de template. Nenhum hook de sessão. Origem: GitHub Inc.
- **Como usar:** `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git`, depois `specify init . --ai claude` na raiz do projeto.
- **Comandos principais:** `/speckit.constitution` (princípios), `/speckit.specify` (o quê/por quê), `/speckit.clarify` (fechar ambiguidades), `/speckit.plan` (stack técnica), `/speckit.tasks` (breakdown), `/speckit.implement` (execução)

### impeccable (pbakaus/impeccable) — ✅ SEGURO para usar

- **O que é:** arquivos `.md` de skill + CLI npm (JS puro). Nenhum hook, nenhum script que rode automaticamente.
- **Licença:** Apache 2.0
- **Sinais de confiança:** 28k stars, mantenedor ativo (Paul Bakaus, ex-Google), código todo legível e auditável.
- **Risco:** quase nulo. São instruções de texto que ensinam o modelo sobre design.
- **Como usar com segurança:** copiar apenas `.claude/skills/impeccable` para o projeto. Não é necessário instalar CLI global.

### ECC (affaan-m/ECC) — ⚠️ USAR COM SELETIVIDADE

- **O que é:** sistema completo de agente — skills, agents, commands, **hooks**, rules, MCP configs.
- **Licença:** MIT, 205k stars, ativo, próprio autor escreveu o guia de segurança de agentes.
- **Risco real:** os **hooks** rodam automaticamente a cada sessão do Claude Code. O próprio ECC adverte que hooks são superfície de ataque. A Snyk ToxicSkills (Fev 2026) escaneou 3.984 skills públicas e encontrou 36% com prompt injection — ECC não é citado como malicioso, mas a regra se aplica a qualquer supply chain.
- **O que usar com segurança:** apenas `rules/common` + `rules/typescript` (são arquivos `.md` de regras, sem código que execute). Não instalar hooks-runtime agora.
- **O que não instalar agora:** hooks, MCP configs, o plugin completo via `/plugin install`.
- **Como instalar as rules com segurança:**
  ```bash
  # Revisar antes de copiar
  git clone --depth=1 https://github.com/affaan-m/ECC.git /tmp/ecc-review
  # Ler rules/common e rules/typescript antes de copiar
  mkdir -p .claude/rules/ecc
  cp -r /tmp/ecc-review/rules/common .claude/rules/ecc/
  cp -r /tmp/ecc-review/rules/typescript .claude/rules/ecc/
  rm -rf /tmp/ecc-review
  ```

---

## 2. O que aproveitar de cada repo

### De spec-kit → processo de desenvolvimento feature por feature

Substitui o passo "planejar antes de codar" por um fluxo estruturado e reproduzível. Funciona junto com impeccable.

**Fluxo por feature:**
1. `/speckit.specify` — descrever o quê e por quê (sem stack, só comportamento)
2. `/speckit.clarify` — fechar ambiguidades antes de planejar
3. `/speckit.plan` — definir stack e arquitetura técnica
4. `/speckit.tasks` — breakdown de tarefas com dependências
5. `/impeccable shape` — planejar UX/UI antes de implementar
6. `/speckit.implement` — executar

**O `/speckit.constitution` é feito uma vez** para o projeto inteiro — define os princípios do Borogodó que guiam todas as decisões técnicas (equivalente ao CLAUDE.md, mas mais estruturado para o fluxo spec-driven).

### De impeccable → UI/UX e qualidade visual

Instalar a skill no projeto garante que o Claude não caia nos clichês de IA (Inter everywhere, gradiente roxo-azul, cards dentro de cards). Para um produto com identidade brasileira forte, isso é crítico.

**O que usar:**
- `.claude/skills/impeccable` — skill com 7 referências de design (typography, color, spatial, motion, interaction, responsive, ux-writing)
- Comandos no Claude Code: `/impeccable audit`, `/impeccable critique`, `/impeccable polish`, `/impeccable shape` (antes de codar uma tela nova)
- `npx impeccable detect src/` — scanner de anti-padrões no CI (sem LLM, sem custo de token)

**Quando usar:**
- `/impeccable shape [tela]` antes de implementar qualquer tela nova
- `/impeccable audit` antes de cada PR de frontend
- `npx impeccable detect` no CI como lint de design

### De ECC → qualidade de código e segurança

As rules de TypeScript e common do ECC são o melhor conjunto gratuito de regras para Claude Code que existe. Cobrem: naming, tratamento de erro, padrões de teste, segurança, performance.

**O que usar:**
- `rules/common` — regras gerais (segurança, qualidade, observabilidade)
- `rules/typescript` — padrões TypeScript (tipos, async/await, tratamento de erro)
- O guia de segurança como referência para arquitetura (seção 3 abaixo)

---

## 3. Stack recomendada

| Camada | Escolha | Por quê |
|--------|---------|---------|
| Frontend | Next.js 15 (App Router) | SSR para SEO, Server Actions simplificam AI calls, comunidade enorme |
| Design system | shadcn/ui + Radix UI | Componentes no seu código (não dependência), Radix dá acessibilidade nativa, totalmente customizável para a identidade visual |
| Animações | Framer Motion | Motion design proposital (impeccable tem referência dedicada) |
| Ícones | Lucide React | Padrão do shadcn, consistente |
| Styling | Tailwind CSS | Tokens via CSS variables; shadcn depende dele |
| Auth | Supabase Auth | Embutido, gratuito na tier inicial, Row Level Security nativo |
| Banco | PostgreSQL via Supabase | RLS para isolar dados por usuário (LGPD crítico), storage para áudio/arquivos |
| AI estruturação | Claude API (claude-haiku-4-5 para extração, claude-sonnet-4-6 para espelho/geração) | Haiku é 5-10x mais barato para extração, Sonnet para outputs de qualidade |
| Transcrição | Whisper API (OpenAI) ou Groq Whisper | Áudio → texto |
| Deploy | Vercel | Integração nativa Next.js, preview deployments por PR |
| Linting | ESLint + Prettier | Biome é alternativa mais rápida se quiser |
| Testes | Vitest + Testing Library | Unit/integration. Playwright para fluxos críticos (captura, geração) |
| CI | GitHub Actions | Gratuito, integração com Vercel |

**Modelo de custo no v1:**
- Supabase free tier: 500MB DB, 1GB storage, 50k auth users
- Vercel hobby: ilimitado para projetos pessoais
- Anthropic: pague por uso. Haiku para extração (~$0.001/entrada), Sonnet para espelho/geração (~$0.01/consulta)
- Evite: qualquer LLM call desnecessária. Cachear resultados de estruturação.

---

## 4. Estrutura do projeto

```
borogodo/
├── .claude/
│   ├── CLAUDE.md              # Regras do projeto para o Claude (ver seção 5)
│   ├── settings.json          # Permissões do Claude Code
│   ├── skills/
│   │   └── impeccable/        # Skill de design (copiar do repo)
│   └── rules/
│       └── ecc/
│           ├── common/        # Rules gerais do ECC
│           └── typescript/    # Rules TypeScript do ECC
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Rotas de auth
│   │   ├── (app)/             # Rotas protegidas
│   │   │   ├── captura/       # Captura multimodal
│   │   │   ├── espelho/       # Inteligência de carreira
│   │   │   └── conteudo/      # Geração de conteúdo
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── ui/                # Componentes base (sem lógica de negócio)
│   │   └── features/          # Componentes por feature
│   ├── lib/
│   │   ├── ai/                # Wrappers da Anthropic API
│   │   ├── db/                # Supabase client, queries tipadas
│   │   └── utils/
│   └── types/                 # Types globais TypeScript
├── tests/
│   ├── unit/
│   └── e2e/                   # Só flows críticos
├── .env.example               # Template sem valores reais
├── .env.local                 # NUNCA commitar
├── .gitignore
└── package.json
```

---

## 5. CLAUDE.md — template para o projeto

Criar em `.claude/CLAUDE.md`. Este arquivo define como o Claude trabalha neste projeto.

```markdown
# Borogodó — Instruções para o Claude

## Produto
App web de inteligência de carreira para o white-collar brasileiro.
Core duplo: espelho (forças/lacunas com evidência) + geração de conteúdo na voz da pessoa.
Stack: Next.js 15, TypeScript, Supabase, Anthropic API, Tailwind.

## Regras inegociáveis

### Segurança — não negociável
- NUNCA commitar .env, chaves de API, tokens, secrets de qualquer tipo
- NUNCA logar dados do usuário (entradas de carreira, histórico, conteúdo gerado)
- NUNCA expor IDs internos do banco em respostas de API
- SEMPRE validar e sanitizar inputs antes de qualquer LLM call (prompt injection)
- SEMPRE usar Row Level Security do Supabase — cada query deve ter filtro por user_id
- Qualquer endpoint de API deve verificar autenticação antes de qualquer outra coisa

### Qualidade de código
- TypeScript estrito. Sem `any`. Types explícitos em funções de borda (API routes, DB queries).
- Naming em inglês no código. Strings de UI em português.
- Componentes React: um por arquivo, nome igual ao arquivo.
- Funções: máximo 40 linhas. Se crescer, extrair.
- Tratamento de erro explícito. Sem `.catch(() => {})` vazio.

### AI calls
- Haiku para extração/estruturação (barato, suficiente)
- Sonnet para espelho e geração de conteúdo (qualidade importa)
- SEMPRE validar output do LLM antes de salvar no banco
- Cachear resultados de estruturação (não re-estruturar a mesma entrada)
- Nunca passar dados de outros usuários no contexto de uma chamada

### Performance
- Server Components por padrão. Client Component só quando necessário (interatividade, hooks).
- Lazy load componentes pesados.
- Imagens: next/image sempre.
- Não buscar dados que não serão exibidos.

### Acessibilidade
- Todo elemento interativo precisa de label acessível.
- Hierarquia de headings semântica (h1 → h2 → h3).
- Contraste mínimo WCAG AA.
- Focus visible em todos os elementos interativos.

## Design
Identidade brasileira. Usar `/impeccable shape` antes de implementar telas novas.
Paleta: roxo-jambo + coral-faísca + mel + verde-água + creme.
Tipografia display: Fraunces. Corpo: variável moderna (Inter ou similar).
Anti-padrões proibidos: gradiente roxo-azul genérico, Inter em tudo, cards aninhados.

## Convenções de commit
feat: nova funcionalidade
fix: correção de bug
refactor: refatoração sem mudança de comportamento
test: adição/atualização de testes
chore: infra, deps, config
```

---

## 6. settings.json do Claude Code — permissões seguras

Criar em `.claude/settings.json`:

```json
{
  "permissions": {
    "deny": [
      "Read(~/.ssh/**)",
      "Read(~/.aws/**)",
      "Read(**/.env*)",
      "Write(~/.ssh/**)",
      "Write(~/.aws/**)",
      "Bash(curl * | bash)",
      "Bash(ssh *)"
    ]
  }
}
```

---

## 7. .gitignore essencial

```gitignore
# Env — NUNCA commitar
.env
.env.local
.env.*.local
.env.production

# Dependências
node_modules/
.pnp
.pnp.js

# Build
.next/
out/
dist/
build/

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
*.pem

# Testes
coverage/
playwright-report/

# Supabase local
supabase/.branches
supabase/.temp
```

---

## 8. Processo de desenvolvimento — do zero ao deploy

### Fase 0: Setup (fazer uma vez)

1. Criar repo no GitHub com `.gitignore`, `README.md`, licença
2. Branch protection: `main` protegida. PR obrigatório mesmo solo (boa prática desde o início)
3. Criar `.env.example` com todas as variáveis necessárias (sem valores)
4. Configurar GitHub Secrets para deploy (Vercel token, Supabase keys)
5. Instalar spec-kit: `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git`
6. Inicializar spec-kit no projeto: `specify init . --ai claude`
7. Rodar `/speckit.constitution` para criar os princípios do produto
8. Copiar impeccable skill: `cp -r /tmp/impeccable/.claude/skills/impeccable .claude/skills/`
9. Copiar ECC rules (após revisar): `cp -r /tmp/ecc/rules/common .claude/rules/ecc/ && cp -r /tmp/ecc/rules/typescript .claude/rules/ecc/`
10. Instalar shadcn: `npx shadcn init` (configura tokens de design, tema, Tailwind)
11. Criar `.claude/CLAUDE.md` com o template acima
12. Criar `.claude/settings.json` com permissões

**Configuração de tokens de design do Borogodó no `globals.css`:**
```css
:root {
  --color-primary:    oklch(48% 0.18 320);  /* roxo-jambo */
  --color-accent:     oklch(65% 0.22 28);   /* coral-faísca */
  --color-warm:       oklch(75% 0.12 75);   /* mel */
  --color-teal:       oklch(72% 0.10 190);  /* verde-água */
  --color-background: oklch(98% 0.01 90);   /* creme */
}
```
Todos os componentes shadcn e custom usam esses tokens — nunca cores hardcoded.

### Fase 1: Feature development (cada feature)

```
1. /speckit.specify [descrever a feature — o quê/por quê, sem stack]
2. /speckit.clarify  ← fechar ambiguidades antes de planejar
3. /speckit.plan     ← definir stack e arquitetura técnica da feature
4. /speckit.tasks    ← breakdown de tarefas com dependências
5. Criar branch: git checkout -b feat/nome-da-feature
6. /impeccable shape [nome da tela]   ← planejar UX antes de codar
7. /speckit.implement ← executar tarefas
8. /impeccable audit  ← checar design antes do PR
9. Rodar testes: npm test
10. Abrir PR → revisão com checklist
11. Merge para develop
```

### Fase 2: PR checklist

Antes de mergear qualquer PR:
- [ ] Nenhuma chave/secret no código
- [ ] RLS verificado para todos os endpoints novos
- [ ] Inputs validados/sanitizados antes de LLM calls
- [ ] Testes passando
- [ ] `npx impeccable detect src/` sem regressão de design
- [ ] Acessibilidade: labels, hierarquia, contraste

### Fase 3: Eval de qualidade (antes de v1 público)

Para o espelho e geração de conteúdo, a qualidade do output é o produto.
Criar um conjunto de entradas de teste representativas (1 por persona: Ana, Bruno, Clara)
e avaliar manualmente a cada iteração do prompt:

```
tests/evals/
├── inputs/
│   ├── ana-pm-tech.md
│   ├── bruno-vendas.md
│   └── clara-financas.md
├── expected/
│   └── [o que uma boa resposta deve conter]
└── run-evals.ts   ← script que roda as entradas e compara
```

Não precisa de LLM judge caro. Um checklist manual por persona já é suficiente no v1:
- O espelho identificou corretamente as forças?
- A lacuna apresentada é específica (não genérica)?
- O conteúdo gerado soa como a persona (não como IA)?

### Fase 4: Deploy

```bash
# Vercel: cada push em main faz deploy automático
# Preview deployments: cada PR ganha uma URL de preview

# Variáveis de ambiente no Vercel dashboard (não no código):
# ANTHROPIC_API_KEY
# NEXT_PUBLIC_SUPABASE_URL
# SUPABASE_SERVICE_ROLE_KEY
# etc.
```

---

## 9. Segurança específica do produto

Por lidar com dados pessoais de carreira (sujeito à LGPD):

### Isolamento de dados por usuário
```sql
-- Todo select deve ter WHERE user_id = auth.uid()
-- Habilitar RLS em todas as tabelas
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can only see own entries"
  ON entries FOR ALL
  USING (user_id = auth.uid());
```

### Sanitização de inputs antes de LLM
```typescript
// Antes de qualquer entrada ir para o contexto do Claude:
function sanitizeUserInput(text: string): string {
  // Remover zero-width chars e bidi overrides
  return text.replace(/[​‌‍⁠﻿‪-‮]/g, '');
}
```

### Nunca armazenar em memória do Claude
- Dados de carreira do usuário ficam no banco, não em arquivos de memória do Claude Code
- O produto em si não deve usar Claude Code como runtime — é um app web normal

### Variáveis de ambiente
- Chaves server-side: `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — nunca com prefixo `NEXT_PUBLIC_`
- Chaves client-side: apenas `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- A anon key do Supabase é pública por design — a segurança real vem do RLS

---

## 10. Comandos de referência rápida

```bash
# Setup inicial do impeccable (uma vez)
git clone --depth=1 https://github.com/pbakaus/impeccable.git /tmp/impeccable
mkdir -p .claude/skills
cp -r /tmp/impeccable/.claude/skills/impeccable .claude/skills/
rm -rf /tmp/impeccable

# Design antes de codar uma tela
# (No Claude Code): /impeccable shape captura

# Audit de design antes do PR
# (No Claude Code): /impeccable audit

# Scanner de anti-padrões no CI
npx impeccable detect src/

# Rodar testes
npm test

# Build local
npm run build

# Verificar variáveis de ambiente (garantir que .env não está no git)
git status | grep -i env
git log --all --full-history -- "**/.env*"
```
