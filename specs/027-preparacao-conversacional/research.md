# Research: Preparação Conversacional

## D1. Entrada direta no chat

**Decision**: clicar no momento abre o chat e mostra uma pergunta inicial local, sem enviar mensagem
à IA automaticamente.

**Rationale**: preserva custo e obriga contexto antes da síntese.

**Alternatives considered**: gerar resumo imediato (rejeitado por baixa assertividade); manter três
starters genéricos (rejeitado porque transfere ao usuário a tarefa de formular o problema).

## D2. Recuperação e citações honestas

**Decision**: a busca usa momento + até três mensagens recentes do usuário + mensagem atual. O bloco
estruturado da resposta inclui `evidenceRefs`; o servidor só devolve cards desses IDs, após validar
que pertencem ao conjunto recuperado.

**Rationale**: a implementação atual devolve chips para todas as cinco entradas recuperadas, mesmo
que a resposta não as use. Isso confunde “contexto disponível” com “evidência citada”.

**Alternatives considered**: mostrar sempre top 5 (rejeitado por desonestidade); inferir citações
por regex no texto (frágil).

## D3. Provas enriquecidas

**Decision**: a projeção de evidência passa a carregar título, métrica, impacto e `evidences`
(URL/imagem). Imagens são miniaturas; URLs usam `noopener noreferrer`; registro abre sua superfície.

**Rationale**: materializa Provar sem duplicar dados.

## D4. Preparação salva, chat efêmero

**Decision**: salvar uma mensagem do assistente cria um artefato `preparation` com texto e IDs das
fontes. Nenhuma mensagem é salva automaticamente e o chat não é retomável.

**Rationale**: entrega continuidade sobre o resultado escolhido sem construir histórico no MVP.

**Alternatives considered**: persistir threads completas (escopo e risco de privacidade altos);
reusar `drafts` (semântica errada e mistura superfícies “pra dentro”/“pra fora”).

## D5. Pesquisa qualitativa e analytics

**Decision**: eventos estruturados têm allowlist de propriedades escalares não textuais. Uma
transcrição só é persistida em `shared_chat_feedback` após confirmação explícita por conversa.

**Rationale**: conversas podem conter salário, avaliações e conflitos. Aprendizado de produto não
justifica vigilância silenciosa.

## D6. Layout do chat

**Decision**: modo preparação usa 100dvh no mobile e 760 px no desktop, com limite responsivo; modo
livre permanece 480 px. Evidências ficam em coluna sob cada resposta.

**Rationale**: 480 px comporta perguntas rápidas, mas não leitura de descrição de vaga + resposta +
provas visuais.

## D7. Banco e RLS

**Decision**: migration aditiva criada via Supabase CLI, RLS habilitada em todas as tabelas, policies
separadas por operação com `(select auth.uid()) = user_id`, e índice em `user_id`.

**Rationale**: segue documentação atual do Supabase e o padrão seguro do projeto. Nenhuma mudança é
aplicada remotamente nesta implementação.
