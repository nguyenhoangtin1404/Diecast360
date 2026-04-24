export type MemberPointsMutationType = 'earn' | 'redeem' | 'adjust';

export type MemberTier = {
  id: string;
  name: string;
  rank: number;
  min_points: number;
};

export type Member = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  points_balance: number;
  tier_id: string | null;
  tier?: MemberTier | null;
  created_at: string;
};

export type MemberLedgerEntry = {
  id: string;
  type: MemberPointsMutationType;
  points: number;
  delta: number;
  balance_after: number;
  reason: string;
  note: string | null;
  created_at: string;
};

export type Pagination = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type TierTransition = {
  upgraded: boolean;
  downgraded: boolean;
};

export type AdjustPointsResult = {
  member: Member;
  ledger: MemberLedgerEntry;
  tier_transition: TierTransition;
};
