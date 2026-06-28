import { redirect } from 'next/navigation'

// A Linha do Tempo foi absorvida pelo Espelho como a vista "Trajetória" (021). A rota
// permanece viva e nunca 404 (FR-006/007): redireciona para a nova casa. Os componentes
// continuam em `historico/` e são reusados pela vista de Trajetória.
export default async function HistoricoPage() {
  redirect('/espelho?vista=trajetoria')
}
