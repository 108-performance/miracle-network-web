import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AthleteIntelPlayer from '@/components/execution/AthleteIntelPlayer';

function extractVimeoVideoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return match?.[1] ?? null;
}

function getVimeoEmbedUrl(url?: string | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (
      parsed.hostname.includes('player.vimeo.com') &&
      parsed.pathname.includes('/video/')
    ) {
      const embed = new URL(parsed.toString());
      embed.searchParams.set('playsinline', '1');
      embed.searchParams.set('title', '0');
      embed.searchParams.set('byline', '0');
      embed.searchParams.set('portrait', '0');
      embed.searchParams.set('dnt', '1');
      embed.searchParams.set('transparent', '0');
      return embed.toString();
    }

    if (parsed.hostname.includes('vimeo.com')) {
      const videoId = extractVimeoVideoId(url);
      if (!videoId) return null;

      const embed = new URL(`https://player.vimeo.com/video/${videoId}`);
      const h = parsed.searchParams.get('h');

      if (h) {
        embed.searchParams.set('h', h);
      }

      embed.searchParams.set('playsinline', '1');
      embed.searchParams.set('title', '0');
      embed.searchParams.set('byline', '0');
      embed.searchParams.set('portrait', '0');
      embed.searchParams.set('dnt', '1');
      embed.searchParams.set('transparent', '0');

      return embed.toString();
    }

    return null;
  } catch {
    return null;
  }
}

type IntelRow = {
  id: string;
  external_url: string | null;
  file_url: string | null;
  created_at: string | null;
  is_primary: boolean | null;
  sort_order: number | null;
  intel_type: string | null;
};

export default async function AthleteIntelPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;

  if (!workoutId || workoutId === 'undefined') {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  const { data: workout } = await supabase
    .from('workouts')
    .select('id')
    .eq('id', workoutId)
    .maybeSingle();

  if (!workout) {
    redirect('/dashboard');
  }

  const baseQuery = supabase
    .from('content_posts')
    .select(
      'id, external_url, file_url, created_at, is_primary, sort_order, intel_type'
    )
    .eq('workout_id', workoutId)
    .eq('status', 'published')
    .in('audience', ['athletes', 'both'])
    .is('exercise_id', null)
    .order('is_primary', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(1);

  const { data: sessionIntroRows } = await supabase
    .from('content_posts')
    .select(
      'id, external_url, file_url, created_at, is_primary, sort_order, intel_type'
    )
    .eq('workout_id', workoutId)
    .eq('status', 'published')
    .in('audience', ['athletes', 'both'])
    .is('exercise_id', null)
    .eq('intel_type', 'session_intro')
    .order('is_primary', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(1);

  let intel = (sessionIntroRows?.[0] ?? null) as IntelRow | null;

  if (!intel) {
    const { data: fallbackRows } = await baseQuery;
    intel = (fallbackRows?.[0] ?? null) as IntelRow | null;
  }

  const rawUrl = intel?.external_url || intel?.file_url || null;
  const embedUrl = getVimeoEmbedUrl(rawUrl);

  if (!intel || !rawUrl || !embedUrl) {
    redirect(`/dashboard/training/${workoutId}/run`);
  }

  return <AthleteIntelPlayer workoutId={workoutId} embedUrl={embedUrl} />;
}