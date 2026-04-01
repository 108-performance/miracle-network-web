import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updateProgram } from '../../actions';

type EditProgramPageProps = {
  params: Promise<{
    programId: string;
  }>;
};

export default async function EditProgramPage({
  params,
}: EditProgramPageProps) {
  const { programId } = await params;
  const supabase = await createClient();

  const { data: program, error } = await supabase
    .from('training_programs')
    .select('*')
    .eq('id', programId)
    .maybeSingle();

  if (error) {
    console.error(error);
  }

  if (!program) {
    notFound();
  }

  return (
    <div className="max-w-xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Program</h1>
        <Link
          href="/training/programs"
          className="rounded border px-4 py-2 text-sm"
        >
          Back to Programs
        </Link>
      </div>

      <form action={updateProgram} className="space-y-4">
        <input type="hidden" name="id" value={program.id} />

        <input
          name="title"
          defaultValue={program.title ?? ''}
          placeholder="Program Title"
          className="w-full rounded border p-2"
          required
        />

        <textarea
          name="description"
          defaultValue={program.description ?? ''}
          placeholder="Description"
          className="w-full rounded border p-2"
          rows={4}
        />

        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}