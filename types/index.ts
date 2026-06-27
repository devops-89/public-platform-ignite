export interface FormField {
  id: string;
  label: string;
  type?: string;
  [key: string]: unknown;
}

export interface EntryItem {
  id: string;
  contest_id?: string;
  contest?: {
    id: string;
    name?: string;
    entryLevelTemplate?: { schema?: { fields?: FormField[] } };
    entry_level_template?: { schema?: { fields?: FormField[] } };
    userLevelTemplate?: { schema?: { fields?: FormField[] } };
    user_level_template?: { schema?: { fields?: FormField[] } };
  };
  submission?: { data: Record<string, string> };
  participant?: {
    submission?: { data: { data?: Record<string, string> } | Record<string, string> };
    data?: Record<string, string>;
    participant_profile_data?: Record<string, string>;
    user?: { name?: string };
    name?: string;
  };
  author?: { data?: Record<string, string> };
  user?: { data?: Record<string, string>; name?: string };
  author_name?: string;
  participant_name?: string;
  voteCount?: number;
  status?: string;
  score?: number;
  [key: string]: unknown;
}

export type LooseObject = Record<string, unknown>;
