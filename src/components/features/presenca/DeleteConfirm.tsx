'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { useTranslations } from 'next-intl'

interface DeleteConfirmProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/**
 * Confirmação da única ação irreversível do hub — a exclusão definitiva (FR-008). Tom sóbrio, não
 * alarme: o destaque é a clareza ("isso não tem volta"), não o medo (shape). Radix Dialog dá foco
 * preso e ESC para cancelar. Arquivar não passa por aqui (é reversível e silencioso).
 */
export function DeleteConfirm({ open, onOpenChange, onConfirm }: DeleteConfirmProps) {
  const t = useTranslations('presenca')

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40"
          style={{ background: 'oklch(18% 0.02 260 / 0.4)', backdropFilter: 'blur(2px)' }}
        />
        <Dialog.Content
          className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,380px)]
            rounded-2xl p-6 flex flex-col gap-5 focus:outline-none"
          style={{ background: 'var(--color-creme)', boxShadow: '0 8px 40px oklch(18% 0.02 260 / 0.25)' }}
        >
          <div className="flex flex-col gap-1.5">
            <Dialog.Title className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
              {t('deleteConfirm.title')}
            </Dialog.Title>
            <Dialog.Description className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {t('deleteConfirm.description')}
            </Dialog.Description>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center text-sm font-medium px-4 py-2 min-h-[48px] rounded-lg transition-opacity hover:opacity-80"
                style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
              >
                {t('deleteConfirm.cancel')}
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center justify-center text-sm font-medium px-4 py-2 min-h-[48px] rounded-lg transition-opacity hover:opacity-90"
              style={{ background: 'var(--destructive)', color: 'var(--color-primary-fg)' }}
            >
              {t('deleteConfirm.confirm')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
