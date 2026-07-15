# Design Brief: Registro como Depósito (fundação)

Gerado via `/impeccable shape`. Fonte primária: `spec.md` (validada em 3 rodadas com a Ohana) +
código real do protótipo Claude Design (projeto `9ea601ed-9460-4619-86e7-b45ddd818362`,
`rd-drawer.jsx`/`rd-ui.jsx`/`home-app.jsx`/`painel-home.html`, puxado via DesignSync). A maior
parte das decisões de UX já está fechada; este brief documenta a tradução para produção e as
poucas lacunas restantes (já resolvidas com a Ohana abaixo).

## 1. Feature Summary

Substituir a captura atual (que rejeita/reroteia por tamanho de texto e bloqueia no IA) por um
drawer bloco-de-notas que sempre salva, com anexo de imagem/link de primeira classe, confirmação
editável, e campos manuais opcionais — acompanhado de um Painel e navegação reformulados. Serve
principalmente a própria Ohana em dogfooding diário: registrar o que fez sem fricção, sem espera,
sem rejeição.

## 2. Primary User Action

Escrever (ou colar/gravar) o que fez e clicar "Registrar" — deve parecer tão fácil quanto mandar
uma mensagem pra um amigo, nunca como preencher um formulário.

## 3. Design Direction

- **Color strategy**: Restrained (padrão `product` do PRODUCT.md) — roxo-jambo como cor de marca
  em navegação/estado ativo, coral-faísca reservado a pontuação (borda do gatilho de Registro,
  FAB, botão primário "Registrar") — nunca >10% da tela.
- **Theme scene sentence**: profissional brasileira registrando o que fez entre uma reunião e
  outra — de dia no notebook do trabalho (claro), à noite no celular no sofá revisando o dia
  (escuro). Ambos os temas são primeira classe, não um "modo extra".
- **Anchor references**: os próprios protótipos já validados (`rd-drawer.jsx` pro comportamento,
  `home-app.jsx`/`painel-home.html` pro layout+tokens) — não há necessidade de referência externa
  nova, a direção já está pinada.
- Nenhum probe visual gerado — a direção não é nova/ambígua, está fixada pelo protótipo já
  aprovado pela Ohana (condição de skip do Phase 1.5 do shape).

## 4. Scope

- **Fidelity**: produção-pronta (não é sketch nem mid-fi) — confirmado por `tasks.md` já cobrir
  todas as 7 user stories com testes.
- **Breadth**: superfície inteira — Drawer (desktop lateral + mobile bottom sheet), Painel
  (layout novo), navegação (sidebar agrupada + tab bar), dark mode.
- **Interactivity**: componente com qualidade de produção (drag/drop, paste, teclado, dark mode
  reativo), não protótipo estático.
- **Time intent**: polir até publicar — é a feature que destrava o dogfooding da fundadora.

## 5. Layout Strategy

**Drawer** (fonte: `rd-drawer.jsx`, comportamento; `home-app.jsx`, "sensação de espaço"):
cabeçalho com ícone caneta em círculo coral-wash + "Registrar" + fechar; bloco-de-notas (textarea
grande, sem borda visível pesada, fundo levemente tintado) ocupa a maior parte do espaço vertical
— ênfase máxima no ato de escrever; anexos abaixo como tiles horizontais com scroll/wrap; seção
"+ adicionar detalhes" colapsada por padrão (baixa ênfase, não compete com o texto); rodapé fixo
com dica de atalho + botão "Registrar" sempre visível. **Removido do protótipo**: bloco "Organizar"
(botão + skeleton fields + selo IA), banner de detecção multi-evento, `DestinoChip` — nenhum desses
existe nesta feature (fora de escopo, ver spec).

**Painel** (fonte: `home-app.jsx` `HomeScreen`): coluna única, max-width ~720px — saudação
(Fraunces, peso 600) → gatilho único de Registro (borda coral 1.5px, ícone lápis, seta de envio) →
"Suas forças" (texto inline sublinhado, não badges/chips, separado por "·") → "Registros recentes"
(até 3, cards discretos com métrica em coral-deep + data + empresa). Modo "novo": mesmo gatilho em
destaque, sem "Suas forças"/"Registros recentes", cartão de progresso 0/3.

**Navegação** (fonte: `home-app.jsx` `Sidebar`/`TabBar`): sidebar desktop com "Painel"/"Registrar"
soltos no topo, depois dois grupos com label pequeno maiúsculo (`GroupLabel`, 10px, tracking largo,
`text-muted`) — "Meu espelho" (Perfil/Trajetória/Registros) e "Usar" (Gerar conteúdo/Me
preparar/Perguntar); item ativo com fundo `nav-active-bg` + texto `nav-active-text` + peso 600. Tab
bar mobile: 4 ícones + FAB coral central flutuante (−14px acima da barra, sombra tingida de coral).

## 6. Key States

| Estado | O que a pessoa vê/sente |
|---|---|
| Drawer vazio | Textarea com placeholder convidativo (copy ajustada, ver §8); se vazio há tempo, duas perguntas-gatilho aparecem abaixo ("O que tomou mais do seu tempo esta semana?" etc.) — só quando `!text && att.length === 0` |
| Drawer digitando | Contador/sinal "fonte completa preservada" aparece só acima de ~200 chars (FR-017) |
| Drawer arrastando arquivo | Destaque visual só durante `dragover` ativo — invisível em repouso (FR-005a) |
| Drawer salvando | Sub-segundo — não há estado de loading visível para o texto em si (síncrono); anexos pendentes sobem em paralelo/depois, com indicador por tile se algum falhar |
| SavedPanel | Check verde, "Registrado. Já está nos seus Registros." + título editável em input com ícone lápis + métrica (se houver) — **sem** o aviso "Organizando o resto em segundo plano" (é do fluxo de Organizar, fora de escopo) |
| Erro de rede ao salvar | Card coral-wash com ícone alerta, "Não foi possível salvar agora. Seu texto está salvo aqui." + botão "Tentar de novo" — texto nunca se perde |
| Painel modo "novo" | Gatilho em destaque + botão Importar (visual, sem ação) + cartão de progresso 0/3 |
| Painel com dados | Saudação + gatilho + Suas forças + Registros recentes, sem barra fixa nem cartão de Espelho pesado |
| Dark mode | Toggle no rodapé da sidebar/menu mobile; todas as superfícies tocadas legíveis nos dois temas |
| Mobile bottom sheet | Sobe da base, alça de arrastar no topo, rodapé de ação sempre acessível mesmo com teclado aberto |

## 7. Interaction Model

- Clique no gatilho do Painel ou toque no FAB → drawer abre (lateral desktop / bottom sheet
  mobile), foco automático no textarea (~30ms de delay, igual ao protótipo).
- Digitar/colar direto no gatilho do Painel (antes do drawer abrir) → abre o drawer já preenchido
  (FR-012a), sem perder conteúdo.
- `Esc` fecha o drawer (descarta se não salvo); `Cmd/Ctrl+Enter` registra — atalhos já definidos no
  protótipo, portar como estão.
- Colar imagem (`onPaste`) com foco no textarea → vira anexo, não polui o texto.
- Arrastar arquivo sobre qualquer área do drawer → destaque visual, solta → anexo.
- Clique "Imagem"/"Link" → fluxos dedicados (input file / input URL) — sem detecção automática de
  URL solta no texto livre.
- Clique "Registrar" (desabilitado até `hasContent`) → salva texto+campos manuais imediato →
  `SavedPanel` → anexos pendentes sobem em sequência.
- Editar título no `SavedPanel` → persiste ao digitar/blur, sem botão "salvar" extra — só "Concluir"
  fecha o drawer.
- Sidebar: clique em item de grupo navega; clique em "Perguntar" abre `ChatSheet` overlay sem sair
  da página atual.
- Toggle de tema: clique alterna instantâneo (sem reload), persiste via `next-themes`.

## 8. Content Requirements

Copy-base portada do protótipo (voz já validada pela Ohana), com os ajustes abaixo:

- **Placeholder do textarea** (ajustado — remove a promessa de "Organizar", fora de escopo):
  `"Cole uma transcrição, um e-mail ou um documento. Ou escreva — fica salvo do jeito que está."`
- **Sinal de preservação** (>200 chars, portar como está): `"Fonte completa preservada. Guardo o
  texto inteiro."` (cortar o final "...e destaco os momentos", que referencia Organizar).
- **Perguntas-gatilho de campo vazio** (portar como está): "O que tomou mais do seu tempo esta
  semana?" / "O que só você conseguiu resolver?"
- **Confirmação**: "Registrado. Já está nos seus Registros." / label "Título" / dica "O título é
  seu. Ajuste como quiser." / botão "Concluir" — portar como está.
- **Erro de salvar**: "Não foi possível salvar agora. Seu texto está salvo aqui." + "Tentar de
  novo" — portar como está.
- **Saudação do Painel**: "Bom dia/Boa tarde/Boa noite, {nome}." + "Cada registro de hoje afina o
  seu Espelho." — portar como está (usa nome real do usuário via `AppShell`, já disponível).
- **Gatilho de Registro**: "Registrar o que você fez" — portar como está.
- **Seções**: "Suas forças" / "Ver espelho" / "Registros recentes" / "Ver todos" — portar como
  está.
- **Botão Importar (não-funcional)**: "Importar currículo ou LinkedIn" (já definido na spec,
  FR-021).
- Todo o texto acima entra via `next-intl`, namespaces `registro`/`appNav`/painel (ver
  `research.md` §11) — nada hardcoded em componente.
- Nenhum asset de imagem/ilustração novo necessário — thumbnails são as próprias imagens
  anexadas pela pessoa (preview real, não ícone genérico).

## 9. Mapeamento de tokens (protótipo → sistema real do produto)

O protótipo usa nomes de token que **não existem** em `src/app/globals.css`. Conforme decidido em
`research.md` §10, não criamos um segundo sistema — traduzimos direto para os tokens canônicos:

| Token do protótipo | Token real do produto | Observação |
|---|---|---|
| `--surface-0` (mesa/fundo do frame) | `--muted` (claro) / ajustar `.dark` se necessário | só relevante fora do app real (era o "fundo do dispositivo" no mock) — **não precisa existir em produção** |
| `--surface-1` (base do app) | `--background` | já existe, já tem par light/dark |
| `--surface-2` (elevado: cards/sidebar) | `--card` | já existe, já tem par light/dark |
| `--text-primary` | `--foreground` | já existe |
| `--text-secondary` | `--muted-foreground` (ajustar lightness se contraste ficar abaixo de 4.5:1) | conferir em `/impeccable audit` |
| `--text-muted` | `--muted-foreground` em opacidade reduzida, ou novo passo mais claro — decidir durante craft se `--text-secondary` e `--text-muted` do protótipo (dois níveis) precisam de dois tokens reais ou se um só (`--muted-foreground`) basta | **abrir durante o craft**, não bloqueia o brief |
| `--voice` / `--roxo` | `--color-primary` | idêntico em intenção (roxo-jambo) |
| `--accent` | `--color-accent` | idêntico (coral-faísca) |
| `--accent-deep` | `--color-accent-text` | já existe especificamente para "coral sobre fundo claro, texto acessível" — mesmo papel |
| `--underline` (sublinhado de "Suas forças") | derivar de `--color-lilas-nevoa` ou `--border`, decidir visualmente durante craft | não existe hoje um token de "sublinhado sutil" — criar um novo token nomeado (ex.: `--color-lilas-linha`) só se necessário, seguindo a Regra da Paleta Proprietária do DESIGN.md |
| `--nav-active-bg` / `--nav-active-text` | `--secondary` / `--secondary-foreground`, ou novo par se o contraste não bater | já existem candidatos próximos — testar antes de criar tokens novos |
| `--hair` (borda muito sutil) | `--border` em opacidade reduzida, ou manter `--border` mesmo (já é bem sutil: `oklch(90% 0.01 260)`) | avaliar durante craft |
| `--fab-shadow` | sombra tingida de coral já é o padrão do DESIGN.md ("Warm Shadow Rule") — usar `oklch(62% 0.22 28 / 0.30)` direto, sem token novo | — |

**Regra geral**: preferir reusar os 12 tokens já nomeados no DESIGN.md antes de inventar um novo;
só criar token novo quando genuinamente não houver equivalente (ex.: talvez `--color-lilas-linha`
para o sublinhado de "Suas forças") — e aí, nome brasileiro, documentado, seguindo a Regra da
Paleta Proprietária.

## 10. Recommended References

- `reference/interaction-design.md` (se existir) ou seção de Interação do impeccable — drawer tem
  paste/drag/drop/atalhos de teclado, superfície rica de interação.
- `reference/animate.md` — transição do drawer (`translateX`/`translateY` com
  `cubic-bezier(0.22,0.61,0.36,1)`, 240-300ms, já validada no protótipo — portar a curva exata).
- `reference/adapt.md` — bottom sheet mobile vs painel lateral desktop é uma adaptação estrutural,
  não só fluida.
- `reference/harden.md` — antes do PR: estados de erro, i18n completo, edge cases da spec.
- Princípios do produto register já lidos (`product.md`): motion 150-250ms, sem coreografia de
  page-load, empty states que ensinam.

## 11. Open Questions — já resolvidas

1. ~~Copy que promete "Organizar"~~ → **Resolvido**: remover a promessa, copy ajustada acima (§8).
2. ~~Onde fica o toggle de tema~~ → **Resolvido**: rodapé da sidebar/menu, perto do avatar.
3. Ícones: protótipo usa Tabler icon font (`ti ti-*`); constituição exige Lucide React
   (Princípio VII/produto). **Decisão assumida, sem pergunta**: mapear 1:1 pro equivalente Lucide
   mais próximo durante o craft (pencil→PenLine, arrow-up→ArrowUp, home→Home,
   user-star→UserCheck/Award, timeline→GitCommitHorizontal ou History, list-details→ListChecks,
   wand→Wand2, target→Target, message-circle→MessageCircle, sparkles→Sparkles, dots→MoreHorizontal,
   chevron-right→ChevronRight, x→X, paperclip→Paperclip, photo→Image, microphone→Mic) — nenhuma
   dessas trocas muda a intenção visual.
4. "Espaço reservado" (bloco futuro de "pontos de ganho") do protótipo `home-app.jsx` **não entra**
   nesta feature — não está em nenhum FR da spec, é scaffolding do mock pra uma ideia futura não
   especificada. Excluído por padrão.
5. Anexo de áudio como tile decorativo (`addAudio`/`IMG_POOL` mock do protótipo) **não entra** —
   áudio já é tratado via `AudioButton`/`AudioRecorder` existentes, que entram como **texto
   transcrito** no próprio bloco-de-notas, não como um tipo de anexo (`evidences`) novo. Confirma
   decisão já registrada em `research.md` §7.

---

Brief confirmado pela Ohana em duas perguntas de direção (copy + toggle de tema); os itens
restantes ficam resolvidos por padrão do próprio protótipo/spec/constituição. Pronto para
`/speckit-implement`.
