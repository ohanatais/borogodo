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
    <div className="max-w-[980px] mx-auto px-6 pt-2 pb-8">
      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        O fio da{' '}
        <em className="italic font-normal">sua carreira</em>
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--muted-foreground)' }}>
        Cada passo, com a evidência que ficou.
      </p>

      {isEmpty ? (
        <div className="flex flex-col items-center py-16 gap-5">
          {/* Visual: fio vazio com nó no topo */}
          <div className="flex flex-col items-center gap-0">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: 'var(--color-primary)' }}
            />
            <div
              className="w-px h-16"
              style={{ borderLeft: '2px dotted var(--border)' }}
            />
          </div>
          <div className="text-center max-w-xs">
            <p className="text-base font-medium mb-1" style={{ color: 'var(--foreground)' }}>
              Seu fio ainda está em branco.
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
              Conte uma história com seu cargo e empresa — ela aparece aqui como o primeiro nó da sua trajetória.
            </p>
            <button
              type="button"
              onClick={() => document.querySelector('textarea')?.focus()}
              className="text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
              style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
            >
              Registrar agora
            </button>
          </div>
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
