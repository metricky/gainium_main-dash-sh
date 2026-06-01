import type {
  SubscriptionPlans,
  SubscriptionType,
  UserAlerts,
  UserNotifications,
} from '.';

export type TradingMode = 'live' | 'paper' | 'demo';

export enum ThemeMode {
  Dark = 'dark',
  Light = 'light',
}

export interface User {
  hasExchanges: boolean | null;
  hasPaperExchanges: boolean | null;
  hasLiveExchanges: boolean | null;
  bigAccount: boolean | null;
  email: string | null;
  timezone: string | null;
  id: string | null;
  demo: boolean | null;
  theme: ThemeMode | null;
  weekStart: string | null;
  name: string | null;
  lastName: string | null;
  lastChangeLog?: number | null;
  nickname: string | null;
  picture: string | null;
  balance: number | null;
  credits?: {
    subscription: {
      arrived: Date;
      expired: Date;
      amount: number;
    };
    paid: number;
    blocked?: number;
  } | null;
  subscription: {
    newSubscription?: boolean;
    credits?: {
      balance: number;
      locked: number;
    };
    subscriptionPlanName: SubscriptionPlans | null;
    startDate: string | null;
    automaticCharge: boolean;
    status: string | null;
    type: SubscriptionType | null;
    price: number | null;
    nextPayment: {
      type: SubscriptionType | null;
      subscriptionPlanName: SubscriptionPlans | null;
      date: Date | null;
    } | null;
    charged?: boolean;
    extensions?: {
      type: SubscriptionType;
      subscriptionPlanName: SubscriptionPlans;
      date: Date;
      endDate: Date;
      price: number;
    }[];
  } | null;
  onboardingSteps: {
    signup: boolean | null;
    liveExchange: boolean | null;
    deployLiveBot: boolean | null;
    earnProfit: boolean | null;
  } | null;
  paperContext: boolean | null;
  affiliate: {
    affiliateId: string | null;
    totalBonuses: number | null;
    freezeAmount: number | null;
    affiliateLevel: number | null;
    recentReferrals: number | null;
    walletToWithdraw: string | null;
    walletProtocol: string | null;
    autoWithdraw: boolean | null;
    affiliateValid: Date | null;
    referredPercent?: number | null;
  } | null;
  notifications: UserNotifications | null;
  videos?: { id: string; watch80: boolean; closed: boolean }[];
  groups?: string[] | null;
  importAsPaper?: boolean | null;
  switchPaperIcon?: boolean | null;
  discourseId?: string;
  rewards?: {
    balance?: number;
    count?: number;
    new?: number;
  };
  tg?: {
    id: number;
    username?: string;
  } | null;
  alerts?: UserAlerts;
  // License key shape, populated by the user resolver. Cloud/app
  // returns a bare String (the key); sh/app-sh returns an object with
  // `{ key, isPremium }`. The license adapter (`lib/license/impl/*`)
  // hides the difference from callers — read `useLicense()` instead of
  // touching this field directly.
  licenseKey?:
    | string
    | {
        key?: string | null;
        isPremium?: boolean | null;
      }
    | null;
  // Pending account-delete state. Cloud only — app-sh doesn't expose
  // these fields; populated by cloud's `requestAccountDelete` flow and
  // read by `DeleteAccountSection` / `PendingDeleteBanner`.
  deletedAt?: string | null;
  deletedScheduledAt?: string | null;
}
export interface AuthTokens {
  accessToken: string;
  expiresAt: number;
}

export interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initInProgress?: boolean;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}
