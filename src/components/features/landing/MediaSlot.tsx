import Image from 'next/image'

type MediaKind = 'placeholder' | 'image' | 'video'

interface MediaSlotProps {
  /** Proporção fixa reservada (ex.: "16/9", "4/3"). Âncora que evita shift de layout na troca. */
  aspect: string
  kind: MediaKind
  /** Descrição acessível do que o slot mostra (alt/aria). */
  label: string
  /** Nota visível enquanto o slot está em placeholder (ex.: "Em breve, o vídeo real..."). */
  note?: string
  /** Conteúdo do placeholder (ilustração/visual). Usado quando kind = 'placeholder'. */
  children?: React.ReactNode
  /** Fonte da mídia real (image ou video). */
  src?: string
  /** Poster estático de fallback para vídeo (obrigatório quando kind = 'video'). */
  poster?: string
}

/**
 * Slot de mídia da landing (feature 022). A caixa de proporção fixa é a âncora: trocar o
 * `kind` de placeholder para image/video não altera o layout ao redor (SC-008). A mídia real
 * entra depois sem retrabalho.
 */
export function MediaSlot({
  aspect,
  kind,
  label,
  note,
  children,
  src,
  poster,
}: MediaSlotProps) {
  if (kind === 'video' && !poster) {
    throw new Error('MediaSlot: kind="video" exige um poster de fallback (FR-017).')
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{
        aspectRatio: aspect,
        background: 'oklch(21% 0.24 325)',
        boxShadow: '0 28px 72px oklch(18% 0.22 320 / 0.4)',
      }}
    >
      {kind === 'image' && src && (
        <Image src={src} alt={label} fill className="object-cover" sizes="(max-width: 768px) 100vw, 480px" />
      )}

      {kind === 'video' && src && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          aria-label={label}
        />
      )}

      {kind === 'placeholder' && (
        <div className="absolute inset-0 flex flex-col" role="img" aria-label={label}>
          <div className="flex-1">{children}</div>
          {note && (
            <p
              className="px-5 pb-4 text-xs"
              style={{ color: 'oklch(68% 0.06 320)' }}
            >
              {note}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
