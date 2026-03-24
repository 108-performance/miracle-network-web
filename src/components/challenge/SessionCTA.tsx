import Link from 'next/link';
import { SessionCTAProps } from './types';

export default function SessionCTA({
  label,
  href,
  disabled = false,
}: SessionCTAProps) {
  if (disabled) {
    return (
      <div className="w-full rounded-2xl bg-zinc-800 px-5 py-4 text-center font-semibold text-zinc-500">
        {label}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="block w-full rounded-2xl bg-lime-400 px-5 py-4 text-center text-lg font-semibold text-black transition hover:opacity-95"
    >
      {label}
    </Link>
  );
}