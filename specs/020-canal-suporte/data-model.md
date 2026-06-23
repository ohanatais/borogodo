# Data Model — Canal de contato/suporte

**N/A — esta feature não introduz nenhuma entidade de dados nem migration.**

O canal é estático. O conteúdo configurável (e-mail de suporte e URL do LinkedIn) vive como
constantes em `src/lib/support/channels.ts`, não no banco:

- `SUPPORT_EMAIL = "admin@borogodo.ai"`
- `LINKEDIN_URL = "https://www.linkedin.com/in/ohana-ta%C3%ADs/"`

Não há persistência de mensagens, tickets ou histórico nesta versão (ver Assumptions na spec).
Caso uma versão futura introduza formulário com contexto, o modelo de dados será definido naquele
momento.
