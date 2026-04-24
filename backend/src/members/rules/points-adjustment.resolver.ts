import type { MemberPointsMutationType } from '../../generated/prisma/client';
import { applyPointsMutation } from './points-rule.engine';
import { evaluateTierForBalance } from './tier-rule.engine';

type TierInput = {
  id: string;
  rank: number;
  min_points: number;
};

type ResolvePointsAdjustmentInput = {
  type: MemberPointsMutationType;
  points: number;
  currentBalance: number;
  currentTierId: string | null;
  tiers: TierInput[];
};

export function resolvePointsAdjustment(input: ResolvePointsAdjustmentInput) {
  const currentRank = input.tiers.find((tier) => tier.id === input.currentTierId)?.rank ?? 0;
  const { delta, nextBalance } = applyPointsMutation({
    currentBalance: input.currentBalance,
    type: input.type as 'earn' | 'redeem' | 'adjust',
    points: input.points,
  });
  const tierEval = evaluateTierForBalance({
    currentTierId: input.currentTierId,
    currentRank,
    currentBalance: input.currentBalance,
    nextBalance,
    tiers: input.tiers,
  });

  return {
    delta,
    nextBalance,
    nextTierId: tierEval.nextTierId,
    tierTransition: {
      upgraded: tierEval.upgraded,
      downgraded: tierEval.downgraded,
    },
  };
}
