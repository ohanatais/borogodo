-- 016-captura-v2 / US2: marcador de "último retorno" ao painel
-- Opção A escolhida: coluna server-side, cross-device, simples de testar.
-- Aditiva e nullable — zero risco para linhas existentes.
alter table profiles
  add column if not exists last_panel_seen_at timestamptz;
