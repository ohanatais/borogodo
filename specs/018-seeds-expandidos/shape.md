# Shape Brief — AngleSelector · OpinionPanel · CaptureOffer (018)

> Produzido pelo /impeccable shape em 2026-06-16. Confirmar antes de implementar.

## Feature Summary

Três novos estados dentro do `GenerateSheet` existente (não são telas novas). Antes de gerar, o usuário escolhe um ângulo (Relato / Estudo / Opinião). Opinião abre um painel inline de tese + lastro. Após geração com vivência dita na hora, um banner convida a salvar como entrada.

**Ação primária**: escolher ângulo → [se opinião: preencher tese + lastro] → "Gerar" → ver 2 posts.

## Design Direction

- **Register**: product
- **Color strategy**: Restrained — herda exatamente o vocabulário do GenerateSheet existente
- **Cena**: pessoa no desk ou celular, momento de criação focado e tranquilo
- Novos estados herdam `var(--color-creme)` de fundo, chips iguais ao seletor de formato atual, nenhuma cor ou padrão novo

## Decisões confirmadas (via AskUserQuestion)

| Ponto | Decisão |
|-------|---------|
| Seletor de ângulo | Leve e rápido — 3 chips simples, sem sub-labels, seleção dispara geração imediata |
| Lastro "escrever agora" | Expandir como card inline (título + textarea, border + muted bg) |
| CaptureOffer | Banner discreto no rodapé — linha única acima da borda do footer |

## Componentes

### 1. AngleSelector

- Row com 3 chips: **"Relato"** / **"Estudo"** / **"Opinião"**
- Visual: ativo = `var(--color-primary)` fill + `var(--color-primary-fg)` text; inativo = `var(--muted)` + `var(--muted-foreground)` (mesmo padrão do seletor de formato)
- Sem label acima — os chips se explicam sozinhos
- Relato e Estudo: seleção → imediato `'generating'`
- Opinião: seleção → expansão do OpinionPanel abaixo (não troca de tela, não fecha o sheet)
- `role="group"`, `aria-label` ("Escolha o ângulo do post"), touch target ≥ 48px

### 2. OpinionPanel

Empilhado na área de conteúdo do sheet:

**A. Thesis textarea**
- Label: `"Sua tese"` (14px, label style)
- Placeholder: `"Uma afirmação que você quer defender..."`
- Max 500 chars, contador `N/500` canto inferior direito (cinza-mudo)
- Borda 1px `var(--border)`, 8px radius, foco com 2px ring roxo-jambo

**B. Seção Lastro**
- Label: `"Lastro"` (14px, label style)
- Dois radio-style options (não `<input type="radio">` nativo — botões visuais com estado):
  - `"Usar entrada registrada"` → lista das entradas recentes (compact, max 4 visíveis, scroll); item selecionado: leve tint roxo-jambo + check icon
  - `"Escrever agora"` → expande um card com `border + var(--muted)` bg, 8px radius:
    - Título: `"✍ Registre o que aconteceu"` (14px medium)
    - Textarea: placeholder `"O que aconteceu? Seja específico — isso vira evidência real."`
    - Expansão: height 0→auto, 200ms ease-out

**C. Botão "Gerar"**
- Primário, full width
- Desabilitado (`opacity 50%, pointer-events none`) enquanto `thesis.trim() === ''`
- Erro `opinion_needs_lastro`: texto inline abaixo do botão em `var(--destructive)` — sem modal

### 3. CaptureOffer

Banner de linha única **entre a área de scroll e a borda do rodapé** (acima de VoiceCalibration/Regenerate):

```
┌───────────────────────────────────────────────┐
│  [BookmarkPlus 14px]  Salvar esta vivência?  [Salvar]  ✕  │
└───────────────────────────────────────────────┘
```

- Background: `var(--muted)`, padding 12px 16px
- "Salvar": botão ghost pequeno
- ✕: `aria-label="Dispensar"`, 48×48px touch target
- Saving: spinner inline no lugar do botão "Salvar"
- Saved: texto `"Vivência salva!"` por 2s → some com fade
- Dismiss: `opacity 0 + height 0`, 150ms ease-out (o footer sobe)

## Estados obrigatórios

| Componente | Estados |
|---|---|
| AngleSelector | chip hover, chip ativo |
| OpinionPanel thesis | vazia (Gerar disabled), preenchida (Gerar ativo) |
| OpinionPanel lastro | nenhum selecionado, entrada selecionada, "escrever agora" collapsed, expanded |
| OpinionPanel submit | idle, error opinion_needs_lastro |
| CaptureOffer | default, saving, saved, dismissed |

## Strings i18n (todas em pt-BR.json)

```
presenca.angles.label        → (não usado visualmente, só aria-label)
presenca.angles.relato       → "Relato"
presenca.angles.study        → "Estudo"
presenca.angles.opinion      → "Opinião"
presenca.opinion.thesisLabel         → "Sua tese"
presenca.opinion.thesisPlaceholder   → "Uma afirmação que você quer defender..."
presenca.opinion.lastroLabel         → "Lastro"
presenca.opinion.fromEntry           → "Usar entrada registrada"
presenca.opinion.writeNow            → "Escrever agora"
presenca.opinion.writeNowTitle       → "Registre o que aconteceu"
presenca.opinion.writeNowPlaceholder → "O que aconteceu? Seja específico — isso vira evidência real."
presenca.opinion.generateBtn         → "Gerar"
presenca.opinion.needsLastroError    → "Adicione um lastro: selecione uma entrada ou descreva a vivência aqui."
presenca.captureOffer.question       → "Salvar esta vivência?"
presenca.captureOffer.save           → "Salvar"
presenca.captureOffer.dismiss        → "Dispensar"
presenca.captureOffer.saved          → "Vivência salva!"
```

## Scope

Produção direta — 3 componentes integrados como estados do `GenerateSheet`. Sem tela nova, sem rota nova.

## Referências para implementação

- `harden.md` — estados de erro, loading, edge cases
- `layout.md` — form layout em espaço compacto (sheet 560px / 88dvh)
