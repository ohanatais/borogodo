/** Vista ativa do Espelho. Vive na URL (`?vista=`), não no banco. */
export type EspelhoVista = 'forcas' | 'trajetoria'

/** Normaliza o `?vista` cru: ausente ou inválido → 'forcas' (default). */
export function parseVista(raw: string | string[] | undefined): EspelhoVista {
  return raw === 'trajetoria' ? 'trajetoria' : 'forcas'
}
