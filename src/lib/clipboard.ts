/**
 * Copia texto para a área de transferência com fallback robusto.
 *
 * Tenta a Clipboard API (`navigator.clipboard.writeText`); em contexto não-seguro ou
 * navegador antigo onde ela não existe/é negada, cai para um `<textarea>` oculto + `execCommand`.
 * Retorna `false` só quando nem o fallback funciona — quem chama mostra a instrução de seleção
 * manual sem travar a tela.
 */
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // segue para o fallback
    }
  }

  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}
