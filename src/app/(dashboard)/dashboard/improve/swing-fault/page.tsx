import Link from 'next/link';

const swingFaults = [
  {
    title: 'Stay Back',
    href: '/dashboard/improve/swing-fault/stay-back',
  },
  {
    title: 'Lunge',
    href: '/dashboard/improve/swing-fault/lunge',
  },
  {
    title: 'Over Rotate',
    href: '/dashboard/improve/swing-fault/over-rotate',
  },
  {
    title: 'Under Rotate',
    href: '/dashboard/improve/swing-fault/under-rotate',
  },
];

export default function SwingFaultPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-zinc-400">
          Improve / Swing Fault
        </p>
        <h1 className="text-4xl font-bold">Swing Fault</h1>
        <p className="mt-3 max-w-2xl text-zinc-300">
          Choose the swing fault you want to improve.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {swingFaults.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              <h2 className="text-2xl font-semibold">{item.title}</h2>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}