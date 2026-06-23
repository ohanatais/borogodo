/**
 * Canais de contato/suporte do Borogodó (feature 020).
 *
 * Fonte única de verdade consumida pelo `ContactCard` (rodapé da LP e Central de
 * Configurações) — evita divergência de conteúdo entre as duas superfícies.
 */

/** E-mail de suporte exibido como texto copiável (sem `mailto:` forçado, FR-001/FR-002). */
export const SUPPORT_EMAIL: string = 'admin@borogodo.ai'

/**
 * Perfil de LinkedIn da fundadora (canal secundário, FR-005).
 *
 * O `í` de "ohana-taís" vai percent-encoded (`%C3%AD`) para um `href` robusto em
 * navegadores/crawlers que não lidam bem com caractere acentuado na URL (ver research R3).
 * Vazio desativa o link (o `ContactCard` o omite em vez de renderizar link quebrado).
 */
export const LINKEDIN_URL: string = 'https://www.linkedin.com/in/ohana-ta%C3%ADs/'
