# Contrato: Saída do LLM + Validador Anti-IA (013)

Espelha o contrato de `006-espelho-honesto/contracts/mirror-output.md`. A saída do Sonnet passa por
**Zod (forma)** e depois **ruleset (conteúdo)** antes de virar `Draft.body`.

## Contrato de saída — `post`

```jsonc
{
  "variants": [
    {
      "angle": "string — o recorte daquela variação (ex: 'o aprendizado', 'quem participou')",
      "body": "string — o post pronto pra colar no LinkedIn, texto puro",
      "evidence_refs": ["E1", "E3"]   // rótulos das entradas/temas que sustentam as afirmações
    },
    { "angle": "...", "body": "...", "evidence_refs": ["E2"] }
  ]
}
```

## Contrato de saída — `impact_summary`

```jsonc
{
  "variants": [
    {
      "angle": "string — o enquadramento (ex: 'pra review', 'pra entrevista')",
      "body": "string — resumo curto, factual, primeira pessoa",
      "evidence_refs": ["E1"]
    },
    { "angle": "...", "body": "...", "evidence_refs": ["E1"] }
  ]
}
```

**Invariantes de forma (Zod, `validateDraftOutput`)**:
- `variants` tem **exatamente 2** itens.
- `body` não-vazio; `evidence_refs` é array (pode ser `[]` se a afirmação é padrão geral, igual ao
  espelho).
- Saída fora desta forma → lança; nada parcial é persistido.

## Contrato do validador determinístico

```
validateContentRuleset(text: string): ContentRulesetViolation[]
```

- **Entrada**: o `body` de uma variante (string; resiliente a vazio).
- **Saída**: array de `{ assert, field, message }`. Vazio = passa.
- **Garantias**: sem chamada de IA; puramente determinístico; não lança para entrada vazia.

### Violações por assert (contrato de teste)

| assert | Dispara quando o `body` |
|---|---|
| 1 | contém travessão `—` |
| 2 | contém buzzword banida (data-driven, proativo, sinergia, jornada vaga…) |
| 3 | contém padrão de antítese ("não é X, é Y" / "deixou de ser X, virou Y" / "mais do que X, é Y") |
| 4 | contém advérbio de ênfase vazio (exatamente, justamente, simplesmente, literalmente) |
| 5 | contém jargão de IA / tradução do inglês (mover a agulha, destravar potencial, no fim das contas, mergulhar fundo) |
| 6 | contém jargão vazio de LinkedIn (humildemente animado, game changer, "comente abaixo", "bora?") |
| 7 | contém número sem janela de tempo, ou número com tom de cobrança |
| 8 | contém gíria de elogio (arrasou, mandou bem, tá voando, fera) |
| 9 | contém brasilidade boba (emoji, diminutivo fofo, metáfora de futebol/samba/carnaval, "jeitinho") |

> A lista de termos banidos é centralizada e compartilhada com o ruleset do espelho onde fizer sentido
> (decidir na implementação: extrair um `bannedTerms` comum vs. manter listas paralelas). O objetivo é
> não divergir a disciplina de voz entre as superfícies.

## Contrato de regeneração

```
generateDraft(input): Promise<{ variants: DraftVariant[] }>
```

- Gera → `validateDraftOutput` (Zod) → `validateContentRuleset` por variante.
- Se **qualquer** variante viola, regera **uma** vez injetando as violações no prompt como feedback.
- Persistindo violação após a 2ª tentativa → lança `GenerationFailedError` (a rota responde 422).
- Nunca retorna uma variante que não passou nas duas validações.

## Contrato do golden set (harness de qualidade)

`src/lib/ai/content/__tests__/goldenSet.test.ts` + fixtures:
- Para cada caso `{ seed, voiceProfile, format }`, a saída esperada (mockada do LLM) **deve**:
  1. passar em `validateContentRuleset` com zero violações;
  2. ter `evidence_refs` ⊆ rótulos do seed (cita evidência real, não inventa);
  3. respeitar `length_pref` quando definido.
- Fixtures **ruins** (com travessão, antítese, número inventado, jargão) **devem** retornar a violação
  esperada por `assert` — provando que o ruleset pega cada classe.
