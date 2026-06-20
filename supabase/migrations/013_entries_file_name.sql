-- 042: rastreabilidade do arquivo de origem (PDF) no registro
-- Guarda o nome do arquivo de onde a entrada foi extraída (ex: currículo PDF).
-- Aditiva e nullable — zero risco para linhas existentes; texto vivo só em
-- capturas via arquivo (source = 'linkedin_pdf'), null para as demais.
alter table public.entries
  add column if not exists file_name text;
