import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { SkillItem } from '@/types/mirror'

vi.mock('../EvidenceText', () => ({
  EvidenceText: ({ evidence }: { evidence: { text: string } }) => <p>{evidence.text}</p>,
}))

import { SkillTierItem } from '../SkillTierItem'

const makeSkill = (tier: SkillItem['tier']): SkillItem => ({
  name: `Skill ${tier}`,
  tier,
  evidence_text: `Evidência de ${tier}.`,
  entry_ids: [],
})

describe('SkillTierItem', () => {
  it('renders skill name and tier pill', () => {
    render(<SkillTierItem skill={makeSkill('Comprovada')} tierLabel="Comprovada" />)
    expect(screen.getByText('Skill Comprovada')).toBeInTheDocument()
    expect(screen.getByText('Comprovada')).toBeInTheDocument()
  })

  it('renders evidence text via EvidenceText', () => {
    render(<SkillTierItem skill={makeSkill('Consistente')} tierLabel="Consistente" />)
    expect(screen.getByText('Evidência de Consistente.')).toBeInTheDocument()
  })

  it('renders Emergente tier with correct pill', () => {
    render(<SkillTierItem skill={makeSkill('Emergente')} tierLabel="Emergente" />)
    expect(screen.getByText('Emergente')).toBeInTheDocument()
  })

  it('does not render EvidenceText when evidence_text is empty', () => {
    const skill: SkillItem = { name: 'Sem evidência', tier: 'Emergente', evidence_text: '', entry_ids: [] }
    render(<SkillTierItem skill={skill} tierLabel="Emergente" />)
    expect(screen.queryByText(/Evidência/)).not.toBeInTheDocument()
  })
})
