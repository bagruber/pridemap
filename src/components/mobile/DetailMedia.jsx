import { useLang } from '../../contexts/LangContext.jsx'

/**
 * One photo or one short video per Pride, directly under the title.
 *
 * Fixed aspect so nothing jumps while it loads, and the average colour of the
 * image as the placeholder underneath. A video is muted, looped and inline,
 * and it does not autoplay when the visitor asked for less motion or less
 * data — then it stays on its poster.
 *
 * There is no gallery and no lightbox on purpose: one picture says "this is
 * what it looks like", a carousel asks to be worked through.
 */
export default function DetailMedia({ media, name }) {
  const { lang } = useLang()
  const alt = media.alt?.[lang] ?? media.alt?.en ?? name

  const quiet = typeof window !== 'undefined' && (
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
    navigator.connection?.saveData
  )

  return (
    <figure className="detail-media" style={{ background: media.placeholder ?? 'var(--surface2)' }}>
      {media.type === 'video' && !quiet ? (
        <video
          src={media.src}
          poster={media.poster}
          muted
          loop
          playsInline
          autoPlay
          aria-label={alt}
        />
      ) : (
        <img
          src={media.type === 'video' ? media.poster : media.src}
          srcSet={media.srcSet}
          sizes="(max-width: 767px) 100vw, 380px"
          alt={alt}
          loading="lazy"
          decoding="async"
        />
      )}
      {media.credit && <figcaption>{media.credit}</figcaption>}
    </figure>
  )
}
