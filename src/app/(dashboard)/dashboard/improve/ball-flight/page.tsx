import Link from 'next/link';

const ballFlights = [
  {
    title: 'Trouble Elevating',
    href: '/dashboard/improve/ball-flight/trouble-elevating',
  },
  {
    title: 'Trouble Pull',
    href: '/dashboard/improve/ball-flight/trouble-pull',
  },
  {
    title: 'Trouble Going Oppo',
    href: '/dashboard/improve/ball-flight/trouble-going-oppo',
  },
  {
    title: 'Trouble On Ground',
    href: '/dashboard/improve/ball-flight/trouble-on-ground',
  },
];

export default function BallFlightPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-zinc-400">
          Improve / Ball Flight
        </p>
        <h1 className="text-4xl font-bold">Ball Flight</h1>
        <p className="mt-3 max-w-2xl text-zinc-300">
          Choose the ball-flight pattern you want to improve.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ballFlights.map((item) => (
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