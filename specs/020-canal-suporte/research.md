# Research — Canal de contato/suporte

## R1. Copiar-para-clipboard vs `mailto:`
**Decisão:** gesto principal é "copiar e-mail" (Clipboard API); `mailto:` é descartado como gesto
principal. **Por quê:** `mailto:` delega ao handler de e-mail padrão do SO, abrindo apps que o
usuário pode não usar (dor explícita da fundadora; experiência imprevisível). Copiar mantém o
controle com o usuário e não dispara app nativo. **Alternativa considerada:** `mailto:` simples
(custo zero) — rejeitada pela UX; pode entrar futuramente como link secundário opcional.

## R2. Clipboard API + fallback
**Decisão:** usar `navigator.clipboard.writeText` num componente client (`CopyButton`), com estado
de feedback ("copiado!") via `aria-live` para anúncio a leitores de tela. **Fallback:** se a API
não existir ou a permissão for negada, o e-mail permanece como texto real selecionável e o botão
informa que a cópia não funcionou (sem travar a tela). Atende FR-002 e FR-009.

## R3. URL do LinkedIn com caractere acentuado
A URL fornecida é `https://www.linkedin.com/in/ohana-taís/`. O `í` deve ser percent-encoded para
um `href` robusto: `https://www.linkedin.com/in/ohana-ta%C3%ADs/`. **Decisão:** armazenar a forma
encodada em `lib/support/channels.ts` para evitar links quebrados em alguns navegadores/crawlers.
Abrir em nova aba com `rel="noopener noreferrer"`. Atende FR-005.

## R4. Onde colocar o rodapé na LP
A landing page (`src/app/[locale]/page.tsx`) **não tem rodapé** hoje — termina no `CtaSection`.
**Decisão:** criar um componente novo `Footer` (em `components/features/landing/`) que renderiza o
`ContactCard` mais créditos mínimos, e adicioná-lo ao fim da página. Reaproveita o padrão de
seções existentes e o i18n. Atende FR-004 (entrada pela LP).

## R5. Entrada pela Central de Configurações
`/configuracoes` já usa um grid de cards (`IdentityCard`, `LinksCard`). **Decisão:** adicionar o
`ContactCard` à grade, seguindo o mesmo padrão visual de card. Atende FR-004 (entrada pelo app).

## R6. Reuso do ContactCard
**Decisão:** um único componente `ContactCard` (Server Component) é consumido tanto pelo `Footer`
da LP quanto pela página de Configurações — evita divergência de conteúdo/SLA entre os dois locais
(DRY). O conteúdo (e-mail, LinkedIn) vem de `lib/support/channels.ts`.
