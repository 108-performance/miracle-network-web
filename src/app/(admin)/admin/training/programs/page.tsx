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
      <div className="flex justify-between items-center mb-6">
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
            <div
              key={program.id}
              className="border p-4 rounded flex justify-between"
            >
              <div>
                <p className="font-semibold">{program.title}</p>
                <p className="text-sm text-gray-500">
                  {program.description || 'No description'}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500">No programs yet</div>
        )}
      </div>
    </div>
  );
}