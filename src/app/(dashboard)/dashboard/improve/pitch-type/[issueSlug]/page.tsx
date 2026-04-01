import SimpleOptionPage from '@/components/dashboard/SimpleOptionPage';

function formatTitle(slug: string) {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function PitchTypeIssuePage({
  params,
}: {
  params: Promise<{ issueSlug: string }>;
}) {
  const { issueSlug } = await params;
  const issueTitle = formatTitle(issueSlug);

  return (
    <SimpleOptionPage
      eyebrow={`Improve / Pitch Type / ${issueTitle}`}
      title={issueTitle}
      description="This is the shell for the pitch-type improvement path. Next we will connect recommended drill paths and the correction session flow."
      options={[
        {
          title: 'Recommended Drill Path A',
          href: '#',
          description: 'Primary correction path for this issue.',
        },
        {
          title: 'Recommended Drill Path B',
          href: '#',
          description: 'Secondary correction path for this issue.',
        },
      ]}
      columns="2"
    />
  );
}