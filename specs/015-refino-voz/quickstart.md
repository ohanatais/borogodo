# Quickstart: Validar Refino de Voz e Qualidade Contínua (015)

Validação end-to-end do último elo. **Pré-requisito**: 013 e 014 implementadas. Usa a conta QA.

## Pré-requisitos
- Branch da 015 rodando local; migrations `009` e `010` aplicadas.
- Conta QA com rascunhos acumulados (013/014), alguns marcados "não soa".

## Roteiro

### 1. Recalibração de voz (US1)
1. Acumular feedback "não soa" em alguns rascunhos.
2. Confirmar que surge a sugestão **"vi que alguns rascunhos não soaram como você; quer afinar?"**
   (não muda nada ainda).
3. **Aceitar** → confirmar que o `voice_profile` evolui (comparar `inferred_summary`/`updated_at`
   antes/depois) e que as **amostras explícitas continuam intactas**.
4. Gerar de novo → o output reflete a voz ajustada e passa no ruleset.
5. Repetir sem aceitar → confirmar que a voz **não** muda.

### 2. Golden set como gate de CI (US2)
1. Abrir um PR que degrade um prompt de propósito (introduz travessão ou clichê de bio).
2. Confirmar que o job do golden set **falha** e bloqueia o merge, apontando o `assert`.
3. Reverter → CI passa. Conferir que o golden set roda **sem** chamada real de IA (determinístico).

### 3. Mini-bio (US3)
1. No `GenerateSheet`, escolher **"mini-bio"**.
2. Conferir 2 versões curtas, factuais, na voz da pessoa, **sem clichê de bio** ("apaixonado por
   tecnologia" e afins) e sem jargão.
3. Persistir → confirmar uma linha em `drafts` com `format='mini_bio'`.

## Critério de aceite manual (Ohana)
> A voz recalibrada soa **mais** como você do que antes? A mini-bio você usaria de verdade no topo do
> seu LinkedIn? Se "não", é prompt/voz — ajustar antes do PR.

## Checklist de saída
- [ ] Voz só muda com consentimento; amostras explícitas preservadas.
- [ ] Golden set bloqueia regressão no CI, sem custo de IA, sem flakiness.
- [ ] Mini-bio: 2 versões factuais, sem clichê, persistidas com `format='mini_bio'`.
- [ ] `/impeccable audit` + `/security-review` + `/pr-review` antes do PR; cobertura ≥ 80%.
- [ ] Bloco de Geração de Conteúdo fechado (013 + 014 + 015).
