# Requirements Document

## Introduction

The Rewards Value Calculator is a simplified main page feature for the Rewards Optimizer app that allows users to quickly calculate and compare the rewards value across all their credit cards for a specific purchase. Users select a store (which determines the spending category), enter a purchase amount in CAD, and see a breakdown of rewards earned on each card in their portfolio, sorted by best value.

## Glossary

- **Calculator**: The main rewards value calculation component that processes user inputs and displays results
- **Store_Selector**: The UI component for selecting or searching for a store
- **Amount_Input**: The UI component for entering the purchase amount in CAD
- **Rewards_Display**: The UI component showing the calculated rewards for each card
- **Card_Portfolio**: The user's collection of credit cards stored locally in AsyncStorage
- **Point_Valuation**: The value of one reward point/mile in CAD cents (stored in the cards table)
- **Category_Multiplier**: The reward rate multiplier for a specific spending category (from category_rewards table)
- **Base_Reward_Rate**: The default reward rate when no category bonus applies
- **CAD_Value**: The calculated dollar value of rewards earned

## Requirements

### Requirement 1: Store Selection

**User Story:** As a user, I want to select a store from a searchable list, so that the app can determine the correct spending category for my purchase.

#### Acceptance Criteria

1. WHEN the Calculator loads, THE Store_Selector SHALL display a searchable dropdown/input field
2. WHEN a user types in the Store_Selector, THE Calculator SHALL filter and display matching stores from the stores database
3. WHEN a user selects a store, THE Calculator SHALL retrieve the associated spending category
4. WHEN a store is selected, THE Store_Selector SHALL display the store name and category
5. IF a user searches for a store that does not exist, THEN THE Calculator SHALL offer manual category selection as a fallback

### Requirement 2: Manual Category Selection

**User Story:** As a user, I want to manually select a spending category when my store is not found, so that I can still calculate rewards for any purchase.

#### Acceptance Criteria

1. WHEN a store is not found, THE Calculator SHALL display a category picker with all available spending categories
2. WHEN a user selects a manual category, THE Calculator SHALL use that category for reward calculations
3. THE Category_Picker SHALL display category names with icons for easy identification

### Requirement 3: Purchase Amount Entry

**User Story:** As a user, I want to enter my purchase amount in CAD, so that the app can calculate the exact rewards I will earn.

#### Acceptance Criteria

1. THE Amount_Input SHALL accept numeric values representing CAD dollars
2. WHEN a user enters an amount, THE Amount_Input SHALL format it as currency (e.g., "$100.00")
3. IF a user enters an invalid amount (non-numeric, negative, or zero), THEN THE Calculator SHALL display a validation error
4. WHEN a valid amount is entered, THE Calculator SHALL trigger reward calculations

### Requirement 4: Rewards Calculation

**User Story:** As a user, I want to see the calculated rewards for each card in my portfolio, so that I can choose the best card for my purchase.

#### Acceptance Criteria

1. WHEN a store/category and amount are provided, THE Calculator SHALL calculate rewards for each card in the Card_Portfolio
2. FOR each card, THE Calculator SHALL determine the applicable reward rate (category multiplier or base_reward_rate)
3. THE Calculator SHALL compute points_earned as: purchase_amount × multiplier
4. THE Calculator SHALL compute cad_value as: points_earned × (point_valuation / 100)
5. THE Calculator SHALL sort results by cad_value in descending order (best value first)

### Requirement 5: Rewards Display

**User Story:** As a user, I want to see a clear breakdown of rewards for each card, so that I can easily compare my options.

#### Acceptance Criteria

1. THE Rewards_Display SHALL show for each card: card name, issuer, reward earned (with unit), and CAD value
2. THE Rewards_Display SHALL format reward earned as "[amount] [reward_type]" (e.g., "150 Aeroplan Miles")
3. THE Rewards_Display SHALL format CAD value as "$X.XX CAD"
4. THE Rewards_Display SHALL show a reward type icon (cashback/points/miles/hotel) for each card
5. THE Rewards_Display SHALL display a "Best Value" badge on the top-ranked card
6. WHEN the Card_Portfolio is empty, THE Rewards_Display SHALL show an empty state prompting the user to add cards

### Requirement 6: Annual Fee Context

**User Story:** As a user, I want to see annual fee information alongside rewards, so that I can make informed decisions about card value.

#### Acceptance Criteria

1. THE Rewards_Display SHALL show the annual fee for each card (e.g., "Annual fee: $120")
2. WHEN a card has no annual fee, THE Rewards_Display SHALL display "No annual fee"

### Requirement 7: Data Caching

**User Story:** As a user, I want the app to work offline with cached data, so that I can calculate rewards without an internet connection.

#### Acceptance Criteria

1. THE Calculator SHALL cache point valuations from the database for offline use
2. WHEN offline, THE Calculator SHALL use cached point valuations for calculations
3. WHEN online, THE Calculator SHALL refresh cached data if stale (older than 24 hours)

### Requirement 8: Simplified Home Screen

**User Story:** As a user, I want a focused calculator experience on the home screen, so that I can quickly find the best card without distractions.

#### Acceptance Criteria

1. THE HomeScreen SHALL display only the rewards calculator as its primary function
2. THE HomeScreen SHALL remove the complex recommendation engine logic
3. THE Calculator SHALL reuse existing CardDataService for card data
4. THE Calculator SHALL reuse existing CardPortfolioManager for portfolio management
