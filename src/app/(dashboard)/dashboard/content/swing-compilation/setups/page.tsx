export default function ContentShellPage() {
  return (
    <main className="mx-auto max-w-5xl text-white">
      <section className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
          Content
        </p>
        <h1 className="mt-3 text-4xl font-extrabold">Setups</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          This is the shell page for this content branch. Real content will be populated next.
        </p>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
        <p className="text-lg font-semibold text-white">MVP shell active</p>
        <p className="mt-2 text-sm text-zinc-400">
          This branch is ready for real content cards in the next step.
        </p>
      </section>
    </main>
  );
}