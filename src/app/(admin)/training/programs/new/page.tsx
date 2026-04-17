import { createProgram } from '../actions';

export default function NewProgramPage() {
  return (
    <div className="max-w-xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Create Program</h1>

      <form action={createProgram} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Program Title
          </label>
          <input
            name="title"
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
            defaultValue="workout"
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
            defaultValue="true"
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
            placeholder="10"
            className="w-full rounded border p-2"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-white"
          >
            Create Program
          </button>

          <a
            href="/training/programs"
            className="rounded border px-4 py-2"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}