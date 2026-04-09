import { redirect } from 'next/navigation';

type WorkoutEntryPageProps = {
  params: Promise<{
    workoutId: string;
  }>;
};

export default async function WorkoutEntryPage({
  params,
}: WorkoutEntryPageProps) {
  const resolvedParams = await params;
  const workoutId = resolvedParams?.workoutId;

  if (!workoutId || workoutId === 'undefined') {
    redirect('/dashboard');
  }

  redirect(`/dashboard/training/${workoutId}/intel`);
}