'use client'

import { useState } from 'react'
import type { HistoricoData, HistoricoProject } from '@/lib/historico/getHistoricoData'
import { HistoricoTimeline } from '@/components/features/historico/HistoricoTimeline'

interface HistoricoPageClientProps {
  data: HistoricoData
}

export function HistoricoPageClient({ data }: HistoricoPageClientProps) {
  const [activeProject, setActiveProject] = useState<{
    company: string
    project: HistoricoProject
  } | null>(null)

  function handleSelectProject(company: string, project: HistoricoProject) {
    setActiveProject((prev) =>
      prev?.company === company && prev.project.name === project.name
        ? null
        : { company, project }
    )
  }

  function handleCloseProject() {
    setActiveProject(null)
  }

  function handleStartCapture() {
    if (!activeProject) return
    window.dispatchEvent(
      new CustomEvent('borogodo:capture-context', {
        detail: { name: activeProject.project.name, company: activeProject.company },
      })
    )
  }

  return (
    <HistoricoTimeline
      data={data}
      activeProject={activeProject}
      onSelectProject={handleSelectProject}
      onCloseProject={handleCloseProject}
      onStartCapture={handleStartCapture}
    />
  )
}
