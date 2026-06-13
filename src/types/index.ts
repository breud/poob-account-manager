export type AccountStatus = 'active' | 'expired' | 'disabled' | 'banned';
export type Page = 'dashboard' | 'accounts' | 'sessions' | 'tags' | 'statistics' | 'settings';

export interface Group {
  id: number;
  name: string;
  color: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface Account {
  id: number;
  username: string;
  displayName?: string;
  robloxUserId?: string;
  avatarUrl?: string;
  avatarColor: string;
  status: AccountStatus;
  isFavorite: boolean;
  notes?: string;
  description?: string;          // long-form account description
  descriptionImages?: string[];  // data URLs embedded in the description
  lastUsedAt?: string;
  lastPlaceId?: string;
  createdAt: string;
  groups: Group[];
  tags: Tag[];
  rawCookie?: string;
  fpsLimit?: number;
}

export interface ActivityPoint {
  day: string;
  sessions: number;
  launches: number;
}

export interface ActivityEvent {
  id: number;
  type: 'launch' | 'validate' | 'add' | 'expired' | 'refresh';
  accountUsername: string;
  timestamp: string;
  success: boolean;
}
