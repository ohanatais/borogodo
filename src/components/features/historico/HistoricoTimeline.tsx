import type { HistoricoData, HistoricoProject } from '@/lib/historico/getHistoricoData'
import { CompanyTimelineItem } from './CompanyTimelineItem'
import { ProjectDetailPanel } from './ProjectDetailPanel'

interface HistoricoTimelineProps {
  data: HistoricoData
  activeProject: { company: string; project: HistoricoProject } | null
  onSelectProject: (company: string, project: HistoricoProject) => void
  onCloseProject: () => void
  onStartCapture: () => void
}

export function HistoricoTimeline({
  data,
  activeProject,
  onSelectProject,
  onCloseProject,
  onStartCapture,
}: HistoricoTimelineProps) {
  const isEmpty = data.companies.length === 0

  return (
    <div className="max-w-[980px] mx-auto px-5 lg:px-9 pt-2 pb-8">
      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        O fio da{' '}
        <em className="italic font-normal">sua carreira</em>
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--muted-foreground)' }}>
        Cada passo, com a evidência que ficou.
      </p>

      {isEmpty ? (
        <div className="text-center py-16">
          <p className="text-base mb-2" style={{ color: 'var(--foreground)' }}>
            Nenhuma entrada com cargo e empresa ainda.
          </p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Conte histórias com seu cargo e empresa e elas aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="flex gap-6 items-start">
          {/* Timeline column */}
          <div className={`relative ${activeProject ? 'flex-[55]' : 'flex-1'} min-w-0 transition-all duration-300`}>
            {/* Vertical dotted connector */}
            <div
              className="absolute top-0 bottom-0"
              style={{
                left: '43px',
                borderLeft: '2px dotted var(--border)',
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            />
            <div>
              {data.companies.map((company, i) => (
                <CompanyTimelineItem
                  key={company.company}
                  company={company}
                  activeProjectName={
                    activeProject?.company === company.company
                      ? activeProject.project.name
                      : null
                  }
                  onSelectProject={(project) => onSelectProject(company.company, project)}
                  isLast={i === data.companies.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Project detail panel */}
          {activeProject && (
            <div className="flex-[45] min-w-0 hidden md:block">
              <ProjectDetailPanel
                project={activeProject.project}
                company={activeProject.company}
                onClose={onCloseProject}
                onStartCapture={onStartCapture}
              />
            </div>
          )}
        </div>
      )}

      {/* Mobile: panel below timeline */}
      {activeProject && (
        <div className="mt-4 md:hidden">
          <ProjectDetailPanel
            project={activeProject.project}
            company={activeProject.company}
            onClose={onCloseProject}
            onStartCapture={onStartCapture}
          />
        </div>
      )}
    </div>
  )
}
