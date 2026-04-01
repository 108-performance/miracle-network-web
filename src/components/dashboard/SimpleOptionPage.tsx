import Link from 'next/link';

type OptionItem = {
  title: string;
  href: string;
  description?: string;
};

type SimpleOptionPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  options?: OptionItem[];
  columns?: '2' | '3' | '4' | '5';
};

const gridClassMap = {
  '2': 'md:grid-cols-2',
  '3': 'md:grid-cols-3',
  '4': 'md:grid-cols-2 xl:grid-cols-4',
  '5': 'md:grid-cols-2 xl:grid-cols-5',
};

export default function SimpleOptionPage({
  eyebrow,
  title,
  description,
  options = [],
  columns = '4',
}: SimpleOptionPageProps) {
  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-zinc-400">
          {eyebrow}
        </p>

        <h1 className="text-4xl font-bold">{title}</h1>

        <p className="mt-3 max-w-2xl text-zinc-300">{description}</p>

        {options.length > 0 ? (
          <div className={`mt-8 grid gap-4 ${gridClassMap[columns]}`}>
            {options.map((item) => (
              <Link
                key={`${item.href}-${item.title}`}
                href={item.href}
                className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 transition hover:border-zinc-600 hover:bg-zinc-900"
              >
                <h2 className="text-2xl font-semibold">{item.title}</h2>
                {item.description ? (
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    {item.description}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-zinc-300">
              Content will be connected here next.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}