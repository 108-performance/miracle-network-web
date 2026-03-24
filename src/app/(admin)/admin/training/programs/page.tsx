import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function ProgramsPage() {
  const supabase = await createClient();

  const { data: programs, error } = await supabase
    .from('training_programs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return <div>Error loading programs</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Training Programs</h1>
        <Link
          href="/admin/training/programs/new"
          className="bg-black text-white px-4 py-2 rounded"
        >
          Create Program
        </Link>
      </div>

      <div className="space-y-3">
        {programs && programs.length > 0 ? (
          programs.map((program: any) => (
            <Link
              key={program.id}
              href={`/admin/training/programs/${program.id}/edit`}
              className="block border p-4 rounded hover:bg-zinc-50 no-underline"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-semibold text-black">{program.title}</p>
                  <p className="text-sm text-gray-500">
                    {program.description || 'No description'}
                  </p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-gray-500">No programs yet</div>
        )}
      </div>
    </div>
  );
}