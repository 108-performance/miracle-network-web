import { getVimeoEmbedUrl } from '@/lib/video/getVimeoEmbedUrl'

type InlineVideoPlayerProps = {
  url?: string | null
  title?: string
  className?: string
}

export function InlineVideoPlayer({
  url,
  title = 'Workout video',
  className = '',
}: InlineVideoPlayerProps) {
  const embedUrl = getVimeoEmbedUrl(url)

  if (!embedUrl) return null

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/10 bg-black ${className}`}
    >
      <div className="relative w-full pt-[56.25%]">
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  )
}