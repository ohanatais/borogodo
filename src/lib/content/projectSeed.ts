// Codificação da chave de um seed de projeto (014, US3). Um projeto não é uma linha de tabela: é a
// agregação das entradas de uma empresa+projeto montada pelo histórico. Como o `seedRef` é um único
// texto, encodamos `company` + `project_name` aqui — e só aqui — para servidor (loadSeed) e cliente
// (UsarButton/originLabel) compartilharem a mesma forma. Nomes com o separador são improváveis.

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
