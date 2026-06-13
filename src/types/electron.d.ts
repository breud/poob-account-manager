import type { Account } from './index';

interface LaunchGameOptions {
  accountId?: number;
  cookie: string;
  placeId?: string;
  jobId?: string;
  fpsLimit?: number;
}

interface LaunchGameResult {
  ok: boolean;
  error?: string;
}

interface RobloxLoginResult {
  username: string;
  cookie: string;
  userId: string | null;
  avatarUrl: string | null;
}

interface PresenceAcct {
  robloxUserId: string;
  cookie: string;
}

interface RobloxStats {
  robux:    number | null;
  joinDate: string | null; // ISO date string e.g. "2019-01-15T00:00:00.000Z"
  friends:  number | null;
  followers: number | null;
}

interface SystemStats {
  cpu: number;      // 0–100
  ramUsed: number;  // bytes
  ramTotal: number; // bytes
}

interface RobloxProcess {
  pid: number;
  name: string;
  cpu: number;  // 0–100
  ram: number;  // bytes
}

interface ElectronAPI {
  loginWithRoblox:  () => Promise<RobloxLoginResult | null>;
  launchGame:       (opts: LaunchGameOptions) => Promise<LaunchGameResult>;
  loadAccounts:     () => Promise<Account[]>;
  saveAccounts:     (accounts: Account[]) => Promise<boolean>;
  getPresence:      (accts: PresenceAcct[]) => Promise<Record<string, RobloxPresence>>;
  getMultiInstance:    () => Promise<boolean>;
  setMultiInstance:    (enabled: boolean) => Promise<boolean>;
  getRobloxStats:      (accts: PresenceAcct[]) => Promise<Record<string, RobloxStats>>;
  getPasswordSettings: () => Promise<{ enabled: boolean; hasPassword: boolean }>;
  setPassword:         (password: string) => Promise<boolean>;
  verifyPassword:      (password: string) => Promise<boolean>;
  setPasswordEnabled:  (enabled: boolean) => Promise<boolean>;
  checkRobloxRunning:  () => Promise<boolean>;
  getSystemStats:      () => Promise<SystemStats>;
  getRobloxProcesses:  () => Promise<RobloxProcess[]>;
  getFpsCap:           () => Promise<number>;
  setFpsCap:           (fps: number) => Promise<boolean>;
  getAccountPid:       (accountId: number) => Promise<number | null>;
  killRobloxPid:       (pid: number) => Promise<boolean>;
  killAllRoblox:       () => Promise<boolean>;
  openLog:             () => Promise<void>;
  patchFpsLive:        (fps: number, prevFps?: number) => Promise<string>;
  getFpsPaths:         () => Promise<Array<{ path: string; exists: boolean; fpsCap: number | null }>>;
}

interface RobloxPresence {
  userPresenceType: number; // 0=offline 1=online 2=inGame 3=inStudio
  lastLocation: string;
  placeId: number | null;
  rootPlaceId: number | null;
  gameId: string | null;
  universeId: number | null;
  userId: number;
  lastOnline: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
