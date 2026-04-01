import { createProgram } from '../actions';

export default function NewProgramPage() {
  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Create Program</h1>

      <form action={createProgram} className="space-y-4">
        <input
          name="title"
          placeholder="Program Title"
          className="w-full border p-2 rounded"
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          className="w-full border p-2 rounded"
          rows={4}
        />

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded"
          >
            Create Program
          </button>

          <a
            href="/training/programs"
            className="border px-4 py-2 rounded"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}