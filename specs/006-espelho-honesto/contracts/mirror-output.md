# Contrato: Saída do Espelho + Validador

## Contrato de saída (JSON do Sonnet → Mirror)

```json
{
  "intro": "string — 1 linha, com o primeiro nome da pessoa",
  "primary_strength": { "headline": "string", "evidence": "string (2–3 linhas, exemplos reais)" },
  "invisible_skill":  { "headline": "string", "evidence": "string" },
  "context_pattern":  { "headline": "string", "evidence": "string" },
  "closing": "string — afirmação honesta, SEM '?'",
  "strength_themes": ["string", "..."]
}
```

**Proibido na saída**: campo `closing_question` (legado). Use `closing`.

## Contrato do validador determinístico

```
validateMirrorRuleset(mirror: Mirror): RulesetViolation[]
```

- **Entrada**: um `Mirror` (pode estar malformado — o validador é resiliente).
- **Saída**: array de `{ assert, field, message }`. Vazio = espelho válido.
- **Garantias**: sem chamada de IA; puramente determinístico; não lança exceção para campos ausentes.

### Violações por assert (contrato de teste)

| assert | Dispara quando |
|---|---|
| 1 | qualquer campo de texto contém `—` |
| 2 | qualquer campo contém buzzword banida |
| 3 | qualquer campo contém `●` ou `○` |
| 4 | `closing` contém `?` |
| 5 | qualquer campo contém padrão de antítese |
| 6 | qualquer campo contém gíria de elogio banida |
| 7 | total de convites de métrica > 1 |
| 8 | todos os 3 headlines de card começam com "Você" |
| 9 | `closing` vazio/ausente **ou** `closing_question` presente |

## Contrato de UI

- **`/espelho`** (Server Component): renderiza intro + 3 cards (headline+evidence) + closing.
- **Feedback** (Server Action): registra ressonância `Sim, faz sentido` / `Nem tanto`; **não** regenera o espelho no v1.
