// Compatibilidade para rascunhos antigos gerados antes da remoção do conceito de projeto. Novos
// fluxos não criam esses seeds; mantemos o parser para que rascunhos históricos continuem abrindo.

const PROJECT_SEED_SEPARATOR = ':::'

export function buildProjectSeedRef(company: string, projectName: string): string {
  return `${company}${PROJECT_SEED_SEPARATOR}${projectName}`
}

export function parseProjectSeedRef(seedRef: string): { company: string; projectName: string } | null {
  const i = seedRef.indexOf(PROJECT_SEED_SEPARATOR)
  if (i === -1) return null
  const company = seedRef.slice(0, i)
  const projectName = seedRef.slice(i + PROJECT_SEED_SEPARATOR.length)
  if (!company || !projectName) return null
  return { company, projectName }
}

/** Nome legível do projeto a partir do `seedRef` (degrada para o próprio ref se não decodificar). */
export function projectNameFromSeedRef(seedRef: string): string {
  return parseProjectSeedRef(seedRef)?.projectName ?? seedRef
}
