'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    Vimeo?: {
      Player: new (
        element: HTMLIFrameElement | string,
        options?: Record<string, unknown>
      ) => {
        on: (event: string, callback: () => void) => void;
        off: (event: string, callback: () => void) => void;
        destroy: () => Promise<void>;
      };
    };
  }
}

function loadVimeoPlayerSdk() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not available.'));
      return;
    }

    if (window.Vimeo?.Player) {
      resolve();
      return;
    }

    const existingScript = document.querySelector(
      'script[data-vimeo-player-sdk="true"]'
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Failed to load Vimeo SDK.')),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    script.async = true;
    script.dataset.vimeoPlayerSdk = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Vimeo SDK.'));
    document.body.appendChild(script);
  });
}

export default function AthleteIntelPlayer({
  workoutId,
  embedUrl,
}: {
  workoutId: string;
  embedUrl: string;
}) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const sdkEmbedUrl = useMemo(() => {
    const url = new URL(embedUrl);
    url.searchParams.set('autoplay', '0');
    url.searchParams.set('muted', '0');
    url.searchParams.set('controls', '1');
    return url.toString();
  }, [embedUrl]);

  useEffect(() => {
    let mounted = true;
    let player:
      | {
          on: (event: string, callback: () => void) => void;
          off: (event: string, callback: () => void) => void;
          destroy: () => Promise<void>;
        }
      | null = null;

    const handleEnded = () => {
      if (!mounted) return;
      router.push(`/dashboard/training/${workoutId}/run`);
    };

    async function setup() {
      try {
        await loadVimeoPlayerSdk();

        if (!mounted || !iframeRef.current || !window.Vimeo?.Player) return;

        player = new window.Vimeo.Player(iframeRef.current);
        player.on('ended', handleEnded);
      } catch (error) {
        console.error('Failed to initialize Vimeo player:', error);
      }
    }

    setup();

    return () => {
      mounted = false;

      if (player) {
        try {
          player.off('ended', handleEnded);
          void player.destroy();
        } catch (error) {
          console.error('Failed to clean up Vimeo player:', error);
        }
      }
    };
  }, [router, workoutId]);

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[760px] flex-col justify-center">
        <div className="rounded-[32px] border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-zinc-500">
            Athlete Intel
          </p>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_0_20px_rgba(255,255,255,0.03)]">
            <div className="relative mx-auto w-full max-w-[640px]">
              <div className="relative w-full pt-[177.78%]">
                <iframe
                  ref={iframeRef}
                  src={sdkEmbedUrl}
                  title="Athlete Intel"
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>

          <div className="mt-5">
            <Link
              href={`/dashboard/training/${workoutId}/run`}
              className="block w-full rounded-2xl border border-zinc-700 py-4 text-center text-lg font-semibold text-zinc-300"
            >
              Skip
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}