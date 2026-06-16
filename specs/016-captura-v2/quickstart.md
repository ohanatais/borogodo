# Quickstart — validação manual da Captura v2

**Feature**: `016-captura-v2` | **Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

Passo a passo de validação por user story (os **checkpoints** do plano). Use a **conta QA**
(Mailinator descartável + cookie de sessão — ver memória `borogodo-qa-test-user`). Cada US é validável
de forma independente; não emende a próxima sem o checkpoint anterior verde.

## Pré-requisitos

```bash
cd /Users/ohanatais/Documents/borogodo-016
npm run dev        # app local
npm run test       # Vitest — módulos novos ≥ 80%
```

Banco: usar o `borogodo-dev`. Migration `011` (se a US2 escolher a Opção A) deve estar aplicada **no dev**
antes de validar a US2; **prod fica para antes do deploy**, como nas migrations anteriores.

## US1 — Colar artefato vira entradas (P1)

1. No ponto de captura, colar uma **transcrição de reunião com 2–3 conquistas distintas**.
2. **Esperado:** o resumo **"criei N entradas"** aparece, com **desfazer**; as N entradas aparecem no
   histórico, ancoradas no texto colado (`raw_content` preservado), sem fato inventado (SC-002).
3. Tocar **desfazer** → o lote some do histórico.
4. Colar um texto **sem conquista** (ex.: um "ok, obrigado") → estado honesto, **nenhuma** entrada
   fabricada (FR-004).
5. Colar um texto **acima do limite** → aviso claro de limite, sem truncar nem erro opaco (FR-005).
6. Conferir o **aviso leve de privacidade** no campo de colar (FR-019).

**Verde quando:** colar gera entradas fiéis salvas na hora + desfazer remove o lote + estados honestos.

## US2 — Ressurgimento por delta (P1)

1. **Ramo "tem novidade":** adicionar ≥1 entrada nova e **reabrir** o app.
   - **Esperado:** destaque "tem novidade" ancorado nas entradas novas, **sem** linguagem de cobrança.
   - O **aha de força** ("reforça sua força em Y") só aparece **se o espelho regenerou** (a cada ~5
     entradas); com entrada nova sem regeneração, mostra a novidade **sem** afirmar força nova (FR-007).
2. **Ramo "sem novidade":** reabrir **sem** nenhuma entrada nova.
   - **Esperado:** ressurgimento de uma **vitória antiga** + convite leve a registrar; **nenhuma**
     análise nova fabricada (FR-008).
3. Tocar no **convite** → cair direto num ponto de captura (FR-009).
4. **Banco vazio (1ª sessão):** convite de boas-vindas, nunca página em branco.

**Verde quando:** os dois ramos do delta se comportam, sem cobrança e sem análise inventada (SC-003).

## US3 — Áudio in-app (P2)

1. **Chrome/desktop:** tocar o microfone, narrar uma conquista, **parar** → a transcrição aparece no
   campo, editável; seguir para a extração (US1).
2. **Cancelar no meio** → nada fica, UI volta ao estado inicial (FR-012a).
3. **Regravar** → a transcrição anterior é descartada, começa do zero (FR-012a).
4. Operar parar/cancelar/regravar **só por teclado** (Tab/Enter) e conferir labels no leitor de tela
   (FR-012b).
5. **Safari/iPhone:** a UI sinaliza a limitação com honestidade e o **caminho de texto continua 100%
   funcional** (FR-013, SC-004).

**Verde quando:** ciclo gravar/parar/cancelar/regravar funciona onde há suporte e degrada com
honestidade onde não há — áudio nunca bloqueia a captura por texto.

## US4 — Pergunta cirúrgica assíncrona (P3)

1. Capturar uma entrada **deliberadamente magra** (sem número/impacto) e **não** enriquecer na hora.
2. Depois (fora do momento da captura), no painel: **ressurge uma única** pergunta cirúrgica ("teve
   algum número ou prazo nisso?") — nunca uma enxurrada (SC-005).
3. **Responder** → a resposta entra na entrada existente (não cria entrada nova) e a pergunta **não
   reaparece** (FR-015).
4. **Ignorar/dispensar** → o fluxo segue normal, a entrada continua válida.

**Verde quando:** no máximo uma pergunta por vez, fora da captura; responder enriquece e fecha; ignorar
não quebra nada.

## Fechamento (antes do PR)

- `npm run test` verde, cobertura ≥ 80% nos módulos novos (SC-006).
- `npm run lint` + `tsc` sem erro; zero string hardcoded (i18n `capture.*` / `panel.*` espelhada em `en.json`).
- `/impeccable audit` + `web-design-guidelines` (a11y da gravação e do ressurgimento).
- `/security-review` (isolamento RLS do texto de terceiros, sanitização pré-LLM) + `/pr-review`.
- **Validação da Ohana (SC-007):** colar uma transcrição real produz entradas que ela reconhece como
  fiéis; reabrir o app "sentindo vivo" nos dois ramos do delta.
