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

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Program Title
          </label>
          <input
            name="title"
            defaultValue={program.title ?? ''}
            placeholder="Program Title"
            className="w-full rounded border p-2"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Description
          </label>
          <textarea
            name="description"
            defaultValue={program.description ?? ''}
            placeholder="Description"
            className="w-full rounded border p-2"
            rows={4}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            App Lane
          </label>
          <select
            name="app_lane"
            className="w-full rounded border p-2"
            defaultValue={program.app_lane ?? 'workout'}
            required
          >
            <option value="train">Train</option>
            <option value="compete">Compete</option>
            <option value="workout">Workout</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Active Status
          </label>
          <select
            name="is_active"
            className="w-full rounded border p-2"
            defaultValue={program.is_active === false ? 'false' : 'true'}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Sort Order
          </label>
          <input
            name="sort_order"
            type="number"
            defaultValue={program.sort_order ?? ''}
            placeholder="10"
            className="w-full rounded border p-2"
          />
        </div>

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