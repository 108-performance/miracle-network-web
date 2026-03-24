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
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Edit Program</h1>

      <form action={updateProgram} className="space-y-4">
        <input type="hidden" name="id" value={program.id} />

        <input
          name="title"
          defaultValue={program.title ?? ''}
          placeholder="Program Title"
          className="w-full border p-2 rounded"
          required
        />

        <textarea
          name="description"
          defaultValue={program.description ?? ''}
          placeholder="Description"
          className="w-full border p-2 rounded"
          rows={4}
        />

        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}