import { evaluateTierForBalance } from './tier-rule.engine';

const tiers = [
  { id: 'tier-bronze', rank: 1, min_points: 0 },
  { id: 'tier-silver', rank: 2, min_points: 1000 },
  { id: 'tier-gold', rank: 3, min_points: 5000 },
];

describe('evaluateTierForBalance', () => {
  it('upgrades when crossing threshold', () => {
    const result = evaluateTierForBalance({
      currentTierId: 'tier-bronze',
      currentRank: 1,
      currentBalance: 500,
      nextBalance: 1200,
      tiers,
    });
    expect(result).toEqual({ nextTierId: 'tier-silver', upgraded: true, downgraded: false });
  });

  it('downgrades when dropping threshold', () => {
    const result = evaluateTierForBalance({
      currentTierId: 'tier-gold',
      currentRank: 3,
      currentBalance: 5200,
      nextBalance: 900,
      tiers,
    });
    expect(result).toEqual({ nextTierId: 'tier-bronze', upgraded: false, downgraded: true });
  });
});
