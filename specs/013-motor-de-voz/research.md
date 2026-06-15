# Research: Motor de Voz + Geração (013)

Fonte primária: `docs/conteudo-plano-de-acao.md` (epic plan, 15/jun/2026) e a pesquisa de produto
que o ancora. Este documento fecha as decisões técnicas antes do `data-model` e dos `contracts`.

## Decisão 1 — Post primeiro, não artigo longo

**Decisão**: O formato âncora é o **post de LinkedIn** (texto curto), com o **resumo de impacto** como
segundo formato no mesmo motor.

**Rationale**: Só 12% dos brasileiros publicam semanalmente e 32% nunca publicaram (Opinion Box 2025);
o post tem a menor barreira de entrada e é o gesto que a LP promete. O resumo de impacto serve o wedge
episódico (review, entrevista, promoção), que é o gatilho de retorno do produto.

**Alternativas rejeitadas**: Artigo longo (alta barreira, baixo retorno episódico); thread/carrossel
(exige imagem, fora do v1 texto-puro).

## Decisão 2 — Calibração de voz híbrida (inferida + amostras)

**Decisão**: `buildVoiceProfile` infere uma base da voz a partir do `raw_content` das capturas e
funde com 1–2 amostras explícitas coladas pelo usuário. A calibração explícita é **refino opcional**,
nunca um gate.

**Rationale**: A crítica nº1 aos concorrentes (Taplio) é soar genérico por partir de template e de um
prompt vazio. Partir do trabalho real já estruturado (capturas) é o diferencial. Exigir amostra antes
de gerar criaria a página em branco que o produto existe para evitar.

**Alternativas rejeitadas**: Só amostras explícitas (cria fricção e página em branco); só inferência
(perde o ajuste fino que o usuário quer dar à própria voz).

## Decisão 3 — Herança literal da disciplina anti-IA do espelho

**Decisão**: Os prompts (`prompts/post.ts`, `prompts/impactSummary.ts`) herdam **integralmente** as
regras de `MIRROR_SYSTEM_PROMPT` (`src/lib/ai/mirror/prompts/firstMirror.ts`): sem travessão, sem
antítese, sem advérbio de ênfase vazio, sem jargão de IA/LinkedIn, brasilidade como substância,
número com janela de tempo, métrica como convite, proibição de inventar fato. A validação
determinística espelha `validateMirrorRuleset` (`validateRuleset.ts`) num novo `validateContentRuleset`.

**Rationale**: A voz do produto já está codificada e validada no espelho. Reescrever a disciplina abriria
divergência de marca entre as superfícies. O ruleset determinístico torna "anti-IA" uma propriedade
verificável em CI, não uma esperança a cada chamada do LLM.

**Alternativas rejeitadas**: Prompt novo "do zero" (risco de drift de voz); confiar só no LLM sem
ruleset (qualidade refém do humor do modelo, sem teste barato).

## Decisão 4 — `drafts` é tabela própria; `voice_profile` é JSONB em `profiles`

**Decisão**: `drafts` é uma **tabela** (lifecycle de rascunho exige linhas com status e histórico);
`voice_profile` é **JSONB em `profiles`** (um registro por usuário, blob de settings).

**Rationale**: Rascunhos têm cardinalidade N por usuário, status que evolui e precisam de query/listagem
(que a 014 vai usar) — isso é uma tabela com RLS, igual a `entries`/`mirror_snapshots`. O perfil de voz
é 1:1 com o usuário e se comporta como preferência; JSONB evita uma tabela e um join para um único
registro. (Confirmado no kickoff.)

**Alternativas rejeitadas**: `drafts` em JSONB (não suporta lifecycle/listagem bem); `voice_profile`
como tabela própria (peso e join desnecessários para 1 linha por usuário).

## Decisão 5 — Reuso do orquestrador entre formatos

**Decisão**: Um único `generateDraft` orquestra os dois formatos, parametrizado por `format`; cada
formato injeta seu prompt e seu schema Zod. A validação anti-IA e o caminho de regeneração são
compartilhados.

**Rationale**: Prova, já na 013, que a fundação serve mais de um formato — pré-requisito para a 015
adicionar mini-bio sem nova superfície. Reduz divergência e duplicação (DRY).

**Alternativas rejeitadas**: Um gerador por formato (duplica validação e caminho de erro; drift entre
formatos).

## Decisão 6 — Modelo e custo

**Decisão**: `claude-sonnet-4-6` para geração (constituição III), via `src/lib/ai/client.ts`. A
inferência de voz (`buildVoiceProfile`) pode usar Sonnet uma vez e **cachear** o `inferred_summary` no
`voice_profile` para não reprocessar o `raw_content` a cada geração.

**Rationale**: Sonnet é o modelo de geração por constituição. Cachear a síntese de voz evita chamadas
repetidas e bilháveis sobre o mesmo `raw_content` (constituição III: cachear structuring).

**Alternativas rejeitadas**: Haiku para geração (constituição reserva Haiku para extração); reprocessar
voz a cada geração (custo redundante).

## Decisão 7 — Golden set como harness existencial

**Decisão**: 10–15 casos reais (seed + voice_profile → output esperado) vivem em
`src/lib/ai/content/__tests__/` com fixtures. As asserções de regra rodam **sem IA** (sobre o ruleset);
a verificação de "cita evidência real" checa que `entry_ids`/referências do output batem com o seed.

**Rationale**: É o que trava regressão de voz quando qualquer prompt do bloco mudar (e os elos 014/015
mexem em prompt). Espelha o que os testes do espelho já fazem com fixtures boas e ruins.

**Alternativas rejeitadas**: Sem golden set (regressão de voz invisível até produção); golden set só na
015 (deixa a 013 e a 014 sem rede ao mexer em prompt).

## Decisão 8 — Pontos de entrada mínimos na 013

**Decisão**: A 013 adiciona apenas o botão "Usar" (a) num tema do espelho e (b) numa entrada. A rota
`/presenca`, o hub, a lista de rascunhos e o nudge são da 014.

**Rationale**: Mantém a primeira entrega focada na **barra de qualidade dos dois formatos âncora**
(o risco de produto), sem dispersar em superfície de navegação. Evita conflito com a nav e com a barra
de captura da 012-chat — que a 014 vai costurar com calma.

**Alternativas rejeitadas**: Entregar o hub na 013 (incha o ciclo além do teto de ~35–45 tasks; mistura
o risco de qualidade com o risco de navegação).

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Voz inferida soa genérica com poucas capturas | Tom neutro-brasileiro padrão + convite explícito a colar amostra; nunca inventar fato |
| LLM viola regra anti-IA | Ruleset determinístico + uma regeneração com feedback + estado de erro honesto |
| Número inventado (alucinação) | Regra herdada do espelho: métrica é convite, sem número → afirma pela evidência qualitativa; ruleset checa janela de tempo |
| Drift de voz entre espelho e conteúdo | Herança literal do `MIRROR_SYSTEM_PROMPT` + golden set compartilhado |
| Custo de IA por geração | Cachear `inferred_summary`; 2 variações numa só chamada quando possível |
