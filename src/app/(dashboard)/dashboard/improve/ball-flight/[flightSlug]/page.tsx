import SimpleOptionPage from '@/components/dashboard/SimpleOptionPage';

function formatTitle(slug: string) {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function BallFlightIssuePage({
  params,
}: {
  params: Promise<{ flightSlug: string }>;
}) {
  const { flightSlug } = await params;
  const flightTitle = formatTitle(flightSlug);

  return (
    <SimpleOptionPage
      eyebrow={`Improve / Ball Flight / ${flightTitle}`}
      title={flightTitle}
      description="This is the shell for the ball-flight improvement path. Next we will connect the drill paths that address this contact outcome."
      options={[
        {
          title: 'Recommended Drill Path A',
          href: '#',
          description: 'Primary correction path for this ball-flight issue.',
        },
        {
          title: 'Recommended Drill Path B',
          href: '#',
          description: 'Secondary correction path for this ball-flight issue.',
        },
      ]}
      columns="2"
    />
  );
}