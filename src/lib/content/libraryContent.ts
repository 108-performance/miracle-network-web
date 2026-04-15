export type LibraryCategoryKey =
  | 'education'
  | 'swing-compilation'
  | 'athlete-specific';

export type LibrarySubcategoryKey =
  | 'latest'
  | 'skill'
  | 'in-game'
  | 'team'
  | 'mental-skills'
  | 'setups'
  | 'finishes'
  | 'types';

export type LibraryContentMapItem = {
  slug: string;
  category: LibraryCategoryKey;
  subcategory: LibrarySubcategoryKey;
  matchTitleIncludes: string[];
};

export const LIBRARY_CONTENT_MAP: LibraryContentMapItem[] = [
  {
    slug: 'skill-1',
    category: 'education',
    subcategory: 'skill',
    matchTitleIncludes: ['skill', 'mechanic', 'fundamental'],
  },
  {
    slug: 'in-game-1',
    category: 'education',
    subcategory: 'in-game',
    matchTitleIncludes: ['game', 'in game', 'competition'],
  },
  {
    slug: 'team-1',
    category: 'education',
    subcategory: 'team',
    matchTitleIncludes: ['team', 'communication', 'system'],
  },
  {
    slug: 'mental-1',
    category: 'education',
    subcategory: 'mental-skills',
    matchTitleIncludes: ['mental', 'mindset', 'confidence', 'focus'],
  },
  {
    slug: 'setups-1',
    category: 'swing-compilation',
    subcategory: 'setups',
    matchTitleIncludes: ['setup', 'stance', 'load'],
  },
  {
    slug: 'finishes-1',
    category: 'swing-compilation',
    subcategory: 'finishes',
    matchTitleIncludes: ['finish', 'extension', 'through contact'],
  },
  {
    slug: 'types-1',
    category: 'swing-compilation',
    subcategory: 'types',
    matchTitleIncludes: ['swing', 'pattern', 'type'],
  },
];

export type LibraryContentItem = {
  id: string;
  title: string;
  description: string | null;
  short_text: string | null;
  content_type: string | null;
  external_url: string | null;
  file_url: string | null;
  created_at: string | null;
};

export function matchesMappedContent(
  title: string | null,
  matchers: string[]
): boolean {
  if (!title) return false;

  const normalized = title.toLowerCase();

  return matchers.some((matcher) => normalized.includes(matcher.toLowerCase()));
}