import SimpleOptionPage from '@/components/dashboard/SimpleOptionPage';

function formatTitle(slug: string) {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function SwingFaultIssuePage({
  params,
}: {
  params: Promise<{ faultSlug: string }>;
}) {
  const { faultSlug } = await params;
  const faultTitle = formatTitle(faultSlug);

  return (
    <SimpleOptionPage
      eyebrow={`Improve / Swing Fault / ${faultTitle}`}
      title={faultTitle}
      description="This is the shell for the swing-fault improvement path. Next we will connect the correction flow and drill recommendations."
      options={[
        {
          title: 'Recommended Drill Path A',
          href: '#',
          description: 'Primary correction path for this swing fault.',
        },
        {
          title: 'Recommended Drill Path B',
          href: '#',
          description: 'Secondary correction path for this swing fault.',
        },
      ]}
      columns="2"
    />
  );
}