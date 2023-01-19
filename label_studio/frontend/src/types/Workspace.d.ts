// id and title fixed because they'll be always defined in API response
declare type APIWorkspace = {
  id: number;

  /** Workspace name. Must be between 3 and 50 characters long. */
  title: string;

  color?: string | null;
}