export interface PainPoint {
  title: string
  description: string
}

export interface HowItWorksStep {
  number: string
  title: string
  description: string
}

export interface MirrorInsightFixture {
  pattern: string
  evidence: string[]
  insight: string
}

export interface CareerSkillCluster {
  label: string
  skills: string[]
}

export interface CareerMapFixture {
  profileLabel: string
  clusters: CareerSkillCluster[]
  timeline: Array<{ year: string; label: string }>
}

export interface PostComparisonFixture {
  real: string
  generic: string
}
