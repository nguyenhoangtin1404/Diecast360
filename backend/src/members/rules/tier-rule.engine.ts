export type TierRuleInput = {
  currentTierId: string | null;
  currentRank: number;
  currentBalance: number;
  nextBalance: number;
  tiers: Array<{
    id: string;
    rank: number;
    min_points: number;
  }>;
};

export type TierRuleResult = {
  nextTierId: string | null;
  upgraded: boolean;
  downgraded: boolean;
};

export function evaluateTierForBalance(input: TierRuleInput): TierRuleResult {
  const sorted = [...input.tiers].sort((a, b) => a.rank - b.rank);
  const eligible = sorted.filter((tier) => tier.min_points <= input.nextBalance);
  const matched = eligible.length > 0 ? eligible[eligible.length - 1] : undefined;

  if (!matched) {
    return {
      nextTierId: null,
      upgraded: false,
      downgraded: input.currentTierId != null,
    };
  }

  if (matched.id === input.currentTierId) {
    return { nextTierId: matched.id, upgraded: false, downgraded: false };
  }

  return {
    nextTierId: matched.id,
    upgraded: matched.rank > input.currentRank,
    downgraded: matched.rank < input.currentRank,
  };
}
