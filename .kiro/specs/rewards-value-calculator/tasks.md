# Implementation Plan: Rewards Value Calculator

## Overview

This plan implements a simplified rewards calculator for the HomeScreen, replacing the complex recommendation engine with a focused tool that calculates and compares rewards across all portfolio cards for a specific purchase.

## Git Workflow

Each task group follows this workflow:
1. Pull latest from main: `git checkout main && git pull origin main`
2. Create feature branch: `git checkout -b feature/<branch-name>`
3. Implement task
4. Commit changes: `git add . && git commit -m "<message>"`
5. Push to GitHub: `git push origin feature/<branch-name>`
6. Create PR or merge to main

## Tasks

- [x] 1. Create RewardsCalculatorService
  - [x] 1.0 Git setup for calculator service
    - Run: `git checkout main && git pull origin main`
    - Run: `git checkout -b feature/rewards-calculator-service`

  - [x] 1.1 Create RewardsCalculatorService with core types and interfaces
    - Create `src/services/RewardsCalculatorService.ts`
    - Define `RewardCalculationResult`, `CalculatorInput`, `CalculatorOutput` interfaces
    - Implement `getApplicableMultiplier(card, category)` function
    - Implement `pointsToCad(points, pointValuation)` function
    - _Requirements: 4.2, 4.4_

  - [x] 1.2 Write property test for multiplier selection
    - **Property 8: Correct Multiplier Selection**
    - **Validates: Requirements 4.2**

  - [x] 1.3 Implement calculateRewards function
    - Implement main `calculateRewards(input)` function
    - Calculate points_earned = amount × multiplier for each card
    - Calculate cad_value = points × (point_valuation / 100)
    - Sort results by cad_value descending
    - Identify bestCard as first result
    - _Requirements: 4.1, 4.3, 4.4, 4.5_

  - [x] 1.4 Write property test for points calculation
    - **Property 9: Points Calculation Correctness**
    - **Validates: Requirements 4.3**

  - [x] 1.5 Write property test for CAD value calculation
    - **Property 10: CAD Value Calculation Correctness**
    - **Validates: Requirements 4.4**

  - [x] 1.6 Write property test for sorting and completeness
    - **Property 7: Complete Portfolio Processing with Sorting**
    - **Validates: Requirements 4.1, 4.5**

  - [x] 1.7 Push calculator service to GitHub
    - Run: `git add . && git commit -m "feat: add RewardsCalculatorService with property tests"`
    - Run: `git push origin feature/rewards-calculator-service`

- [x] 2. Checkpoint - Ensure calculator service tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Merge to main: `git checkout main && git merge feature/rewards-calculator-service && git push origin main`

- [x] 3. Create Amount Input Utilities
  - [x] 3.0 Git setup for amount utilities
    - Run: `git checkout main && git pull origin main`
    - Run: `git checkout -b feature/amount-utilities`

  - [x] 3.1 Create amount validation and formatting utilities
    - Create `src/utils/amountUtils.ts`
    - Implement `validateAmount(input)` returning validation result
    - Implement `formatCurrency(amount)` returning "$X.XX" format
    - Implement `formatCadValue(amount)` returning "$X.XX CAD" format
    - _Requirements: 3.1, 3.2, 3.3, 5.3_

  - [x] 3.2 Write property test for valid amount acceptance
    - **Property 4: Valid Amount Acceptance**
    - **Validates: Requirements 3.1**

  - [x] 3.3 Write property test for invalid amount rejection
    - **Property 6: Invalid Amount Rejection**
    - **Validates: Requirements 3.3**

  - [x] 3.4 Write property test for currency formatting
    - **Property 5: Currency Formatting**
    - **Validates: Requirements 3.2**

  - [x] 3.5 Write property test for CAD value formatting
    - **Property 13: CAD Value Formatting**
    - **Validates: Requirements 5.3**

  - [x] 3.6 Push amount utilities to GitHub
    - Run: `git add . && git commit -m "feat: add amount validation and formatting utilities"`
    - Run: `git push origin feature/amount-utilities`

- [x] 4. Create Reward Formatting Utilities
  - [x] 4.0 Git setup for reward formatting
    - Run: `git checkout main && git pull origin main`
    - Run: `git checkout -b feature/reward-formatting`

  - [x] 4.1 Create reward display formatting utilities
    - Create `src/utils/rewardFormatUtils.ts`
    - Implement `formatRewardEarned(amount, rewardType)` returning "[amount] [type]"
    - Implement `formatAnnualFee(fee)` returning "Annual fee: $X" or "No annual fee"
    - Define REWARD_TYPE_LABELS and REWARD_TYPE_ICONS mappings
    - _Requirements: 5.2, 6.1, 6.2_

  - [x] 4.2 Write property test for reward amount formatting
    - **Property 12: Reward Amount Formatting**
    - **Validates: Requirements 5.2**

  - [x] 4.3 Write property test for annual fee display
    - **Property 15: Annual Fee Display**
    - **Validates: Requirements 6.1**

  - [x] 4.4 Push reward formatting to GitHub
    - Run: `git add . && git commit -m "feat: add reward formatting utilities"`
    - Run: `git push origin feature/reward-formatting`

- [-] 5. Checkpoint - Ensure utility tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Merge branches: `git checkout main && git merge feature/amount-utilities && git merge feature/reward-formatting && git push origin main`

- [ ] 6. Create UI Components
  - [ ] 6.0 Git setup for UI components
    - Run: `git checkout main && git pull origin main`
    - Run: `git checkout -b feature/calculator-ui-components`

  - [ ] 6.1 Create AmountInput component
    - Create `src/components/AmountInput.tsx`
    - Implement numeric input with currency formatting
    - Display validation errors
    - Handle onChange with debouncing
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 6.2 Create StoreSelector component
    - Create `src/components/StoreSelector.tsx`
    - Implement searchable dropdown using existing SearchInput
    - Display store suggestions from StoreDataService
    - Show selected store name and category
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 6.3 Create CategoryPicker component
    - Create `src/components/CategoryPicker.tsx`
    - Display all spending categories with icons
    - Handle category selection
    - _Requirements: 2.1, 2.3_

  - [ ] 6.4 Create CardRewardItem component
    - Create `src/components/CardRewardItem.tsx`
    - Display card name, issuer, reward earned, CAD value
    - Show reward type icon
    - Show "Best Value" badge when applicable
    - Show annual fee
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2_

  - [ ] 6.5 Create RewardsDisplay component
    - Create `src/components/RewardsDisplay.tsx`
    - Render list of CardRewardItem components
    - Handle empty state when no cards in portfolio
    - Show loading state during calculation
    - _Requirements: 5.1, 5.6_

  - [ ] 6.6 Write property test for reward display fields
    - **Property 11: Reward Display Contains Required Fields**
    - **Validates: Requirements 5.1**

  - [ ] 6.7 Write property test for best value badge
    - **Property 14: Best Value Badge Assignment**
    - **Validates: Requirements 5.5**

  - [ ] 6.8 Push UI components to GitHub
    - Run: `git add . && git commit -m "feat: add calculator UI components"`
    - Run: `git push origin feature/calculator-ui-components`

- [ ] 7. Checkpoint - Ensure component tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Merge to main: `git checkout main && git merge feature/calculator-ui-components && git push origin main`

- [ ] 8. Refactor HomeScreen
  - [ ] 8.0 Git setup for HomeScreen refactor
    - Run: `git checkout main && git pull origin main`
    - Run: `git checkout -b feature/simplified-homescreen`

  - [ ] 8.1 Simplify HomeScreen to calculator-only view
    - Remove complex recommendation engine imports and logic
    - Add calculator state management (store, category, amount, results)
    - Integrate StoreSelector, AmountInput, RewardsDisplay components
    - Wire up calculation flow: store/category + amount → calculateRewards
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 8.2 Add manual category fallback
    - Show CategoryPicker when store not found
    - Allow switching between store and manual category modes
    - _Requirements: 1.5, 2.1, 2.2_

  - [ ] 8.3 Write property test for store search results
    - **Property 1: Store Search Returns Matching Results**
    - **Validates: Requirements 1.2**

  - [ ] 8.4 Write property test for store category retrieval
    - **Property 2: Store Selection Yields Correct Category**
    - **Validates: Requirements 1.3**

  - [ ] 8.5 Write property test for manual category in calculations
    - **Property 3: Manual Category Selection Used in Calculations**
    - **Validates: Requirements 2.2**

  - [ ] 8.6 Push HomeScreen refactor to GitHub
    - Run: `git add . && git commit -m "feat: simplify HomeScreen to rewards calculator"`
    - Run: `git push origin feature/simplified-homescreen`

- [ ] 9. Update Component Exports
  - [ ] 9.0 Git setup for exports update
    - Run: `git checkout main && git pull origin main`
    - Run: `git checkout -b feature/update-exports`

  - [ ] 9.1 Update component index exports
    - Add new components to `src/components/index.ts`
    - Add new utils to `src/utils/index.ts` (create if needed)
    - Ensure all new components are properly exported
    - _Requirements: N/A (housekeeping)_

  - [ ] 9.2 Push exports update to GitHub
    - Run: `git add . && git commit -m "chore: update component and utility exports"`
    - Run: `git push origin feature/update-exports`

- [ ] 10. Final Checkpoint - Full integration test
  - Ensure all tests pass, ask the user if questions arise.
  - Merge remaining branches: `git checkout main && git merge feature/simplified-homescreen && git merge feature/update-exports && git push origin main`
  - Tag release: `git tag v2.0.0-calculator && git push origin v2.0.0-calculator`

## Notes

- All tasks including property tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- Existing services (CardDataService, CardPortfolioManager, StoreDataService) are reused
- Caching is already handled by CardDataService (24-hour TTL)
- Git workflow ensures clean history and easy rollback if needed
