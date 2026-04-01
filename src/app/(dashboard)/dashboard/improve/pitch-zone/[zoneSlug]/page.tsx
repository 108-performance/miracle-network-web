import SimpleOptionPage from '@/components/dashboard/SimpleOptionPage';

function formatTitle(slug: string) {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function PitchZoneIssuePage({
  params,
}: {
  params: Promise<{ zoneSlug: string }>;
}) {
  const { zoneSlug } = await params;
  const zoneTitle = formatTitle(zoneSlug);

  return (
    <SimpleOptionPage
      eyebrow={`Improve / Pitch Zone / ${zoneTitle}`}
      title={zoneTitle}
      description="This is the shell for the pitch-zone improvement path. Next we will connect zone-specific drill recommendations and correction sessions."
      options={[
        {
          title: 'Recommended Drill Path A',
          href: '#',
          description: 'Primary correction path for this zone issue.',
        },
        {
          title: 'Recommended Drill Path B',
          href: '#',
          description: 'Secondary correction path for this zone issue.',
        },
      ]}
      columns="2"
    />
  );
}