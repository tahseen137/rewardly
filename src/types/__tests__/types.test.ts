import {
  RewardType,
  SpendingCategory,
  Card,
  UserCard,
  Store,
  RewardRate,
  CategoryReward,
  UserPreferences,
  RankedCard,
  StoreRecommendation,
  PortfolioError,
  Result,
  success,
  failure,
} from '../index';

describe('Core Types', () => {
  describe('RewardType enum', () => {
    it('should have all expected reward types', () => {
      expect(RewardType.CASHBACK).toBe('cashback');
      expect(RewardType.POINTS).toBe('points');
      expect(RewardType.AIRLINE_MILES).toBe('airline_miles');
      expect(RewardType.HOTEL_POINTS).toBe('hotel_points');
    });
  });

  describe('SpendingCategory enum', () => {
    it('should have all expected spending categories', () => {
      expect(SpendingCategory.GROCERIES).toBe('groceries');
      expect(SpendingCategory.DINING).toBe('dining');
      expect(SpendingCategory.GAS).toBe('gas');
      expect(SpendingCategory.TRAVEL).toBe('travel');
      expect(SpendingCategory.ONLINE_SHOPPING).toBe('online_shopping');
      expect(SpendingCategory.ENTERTAINMENT).toBe('entertainment');
      expect(SpendingCategory.DRUGSTORES).toBe('drugstores');
      expect(SpendingCategory.HOME_IMPROVEMENT).toBe('home_improvement');
      expect(SpendingCategory.OTHER).toBe('other');
    });
  });

  describe('Card interface', () => {
    it('should allow creating a valid card object', () => {
      const card: Card = {
        id: 'chase-sapphire-preferred',
        name: 'Chase Sapphire Preferred',
        issuer: 'Chase',
        rewardProgram: 'Chase Ultimate Rewards',
        baseRewardRate: {
          value: 1,
          type: RewardType.POINTS,
          unit: 'multiplier',
        },
        categoryRewards: [
          {
            category: SpendingCategory.DINING,
            rewardRate: {
              value: 3,
              type: RewardType.POINTS,
              unit: 'multiplier',
            },
          },
        ],
      };

      expect(card.id).toBe('chase-sapphire-preferred');
      expect(card.categoryRewards).toHaveLength(1);
    });
  });

  describe('Result type helpers', () => {
    it('should create a success result', () => {
      const result: Result<string, PortfolioError> = success('test value');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('test value');
      }
    });

    it('should create a failure result', () => {
      const error: PortfolioError = { type: 'DUPLICATE_CARD', cardName: 'Test Card' };
      const result: Result<string, PortfolioError> = failure(error);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('DUPLICATE_CARD');
      }
    });
  });
});
