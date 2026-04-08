export function getVimeoEmbedUrl(url?: string | null): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)

    if (parsed.hostname.includes('player.vimeo.com')) {
      const embed = new URL(parsed.toString())

      if (!embed.searchParams.has('playsinline')) {
        embed.searchParams.set('playsinline', '1')
      }
      if (!embed.searchParams.has('title')) {
        embed.searchParams.set('title', '0')
      }
      if (!embed.searchParams.has('byline')) {
        embed.searchParams.set('byline', '0')
      }
      if (!embed.searchParams.has('portrait')) {
        embed.searchParams.set('portrait', '0')
      }

      return embed.toString()
    }

    if (parsed.hostname.includes('vimeo.com')) {
      const pathParts = parsed.pathname.split('/').filter(Boolean)
      const videoId = pathParts[pathParts.length - 1]

      if (!videoId || !/^\d+$/.test(videoId)) return null

      const embed = new URL(`https://player.vimeo.com/video/${videoId}`)

      const h = parsed.searchParams.get('h')
      if (h) {
        embed.searchParams.set('h', h)
      }

      embed.searchParams.set('playsinline', '1')
      embed.searchParams.set('title', '0')
      embed.searchParams.set('byline', '0')
      embed.searchParams.set('portrait', '0')

      return embed.toString()
    }

    return null
  } catch {
    return null
  }
}