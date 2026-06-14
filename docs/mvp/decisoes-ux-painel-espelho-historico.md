# Decisões de UX — Painel (007), Espelho detalhado (006c) e Histórico
> Origem: iteração sobre os mockups do Claude Design (jun/2026). Vira **input das specs**
> de 007 (painel), 006c (página detalhada do espelho) e da feature de Histórico.

## Princípios transversais (valem pras três telas)
- **Menos scroll, menos texto.** Progressive disclosure onde der. Quanto mais a pessoa
  precisa rolar pra obter valor, pior.
- **Status do espelho** (emergente / tomando forma / consolidado) **nunca como label
  estático de julgamento.** Sempre virado pra frente, como convite ("some 2-3 entradas e
  seu espelho toma forma"). Como rótulo parado soa nota, e pra quem está "emergente" soa
  "você ainda não chegou" — fere o princípio de não fazer a pessoa se sentir menos.
- **Voz nos títulos:** sem gerúndio burocrático ("Estruturação", "Redução") e sem verbo
  genérico repetido ("Montou", "Cortou"). Regra: **genérico → específico**, liderando com
  o resultado/número ou um substantivo concreto (ex: "Função de produto criada do zero ·
  ARR a US$ 400K"; "−50% no tempo de investigação técnica"). Brasilidade com tempero (1
  expressão por bloco), nunca boba.
- **Tier por evidência = pílula COM rótulo de texto** (Emergente / Consistente /
  Comprovada). Nunca barra ou nota (●●●●○).
- **Responsivo estrutural:** o que é aba no desktop vira **accordion** no mobile (5 abas
  não cabem em 375px); a mini linha do tempo colapsa pro fim.

## 007 — Painel
- **Cartão do borogodó** (herói, roxo-jambo): avatar + "O borogodó da [nome]" + nome;
  **especialidades** em chips (domínios: quem você é); **linha de skills destaque** em
  pílulas (3-4 skills "Comprovadas"); 1-2 linhas do padrão de carreira (específicas); link
  "Ver espelho completo →". **Remover** o label estático de status do cartão.
  - *Especialidades ≠ skills destaque:* especialidades = domínios (Produto 0→1, HealthTech);
    skills destaque = top skills evidenciadas. Se ficar redundante, manter só uma linha.
- **Highlights da trajetória:** até 3, **resultado-primeiro**, 1 linha de evidência cada.
- **Mini linha do tempo** na lateral direita (desktop): 3 itens recentes (cargo · empresa ·
  duração), sem descrição, link "ver linha do tempo completa →". Colapsa pro fim no mobile,
  depois do cartão e dos highlights.
- **Estado inicial** (poucas entradas): cartão vira "seu espelho tá se formando"; se não há
  highlights, a seção some (nunca placeholder vazio); mini-timeline curta; convite a capturar.

## 006c — Espelho detalhado
- **Header:** avatar + "O espelho da [nome]"; especialidades em chips; skills destaque em
  pílulas. **Sem** label de status (vira convite no rodapé).
- **Três revelações** com rótulos BR: **"No que você manda bem"** (primary), **"Seu
  borogodó"** (invisible — destaque visual em superfície quente/mel), **"O fio da sua
  carreira"** (pattern). Evidência curta: **máx ~2 linhas** cada.
- **Por categoria = ABAS** (não cards lado a lado): as 5 macro (Execução, Insight/
  Diagnóstico, Estratégia/Visão, Influência/Liderança, Domínio). Cada aba com **indicador de
  quantidade** (ex: "Execução · 2"). Clicar mostra as skills da categoria, cada uma com tier
  por evidência e a evidência (expansível).
- **Ajuste de classificação (decisão travada, escopo 006c+):** dentro de cada skill, o
  usuário pode **corrigir o tier** ou marcar **"não me reconheço nisso"**. Por quê: (a)
  controle e confiança (não é um algoritmo te rotulando, você tem a caneta); (b) vira sinal
  de feedback que melhora o perfil. Requer modelo de **override do usuário** (persistir a
  correção) + UI. *Heads-up:* não é a 006a; entra na 006c ou logo depois.
- **Mobile:** as abas viram **accordion**.
- **Fechamento:** afirmação + convite (status virado pra frente), sem pergunta.

## Histórico (linha do tempo de carreira)
- Mantém o layout aprovado no mockup: **nó com marcador de TEMPO (ano/período)** (não
  número 1/2/3), linha conectora pontilhada, "cargo · empresa", meta em itálico (período/
  duração · contexto), descrição com trechos em negrito **resultado-primeiro**.
- Item **expansível**; reservar espaço discreto "Provas (em breve)" pra 008 (Provar).
- **Versão simples primeiro** (lista cronológica). A mini-versão do painel reusa
  cargo · empresa · duração.
- Depende de **#9** (dedup) pra não exibir duplicata.

## Acessibilidade (as três)
- Abas e accordion navegáveis por teclado, com estado ativo claro.
- Tier comunicado por **texto + cor** (nunca só cor).
- Alvos de toque ≥ 48px; coral-faísca ≤ 10% da tela; sem card dentro de card.
