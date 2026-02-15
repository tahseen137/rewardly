# Rewardly Card Duplicate Cleanup Log
**Date**: 2026-02-15
**Task**: Clean up 17 duplicate card pairs in Supabase database

## Process
For each duplicate pair:
1. Query both cards with their category_rewards
2. Keep the one with MORE category_rewards data (more complete)
3. If equal, keep the one with the more recent updated_at
4. Check user_cards table for users with the duplicate card_id
5. Update user_cards to point to the kept card if needed
6. Delete the duplicate's category_rewards
7. Delete the duplicate card

---


## Processing: American Express Aeroplan Card
**Time**: 2026-02-15 16:16:50 UTC

Found 2 card(s) with name: American Express Aeroplan Card
- Card 1: af10e313-734d-4be4-9175-e36a69c59143 (updated: 2026-02-12T01:50:39.206617+00:00)
- Card 2: e824d80d-4695-497f-9632-07b7ece72ab9 (updated: 2026-02-14T03:11:20.360533+00:00)
- Card 1 category_rewards: 1
- Card 2 category_rewards: 4
**Decision**: Keep Card 2 (4 > 1 category_rewards)
- Keeping: e824d80d-4695-497f-9632-07b7ece72ab9
- Deleting: af10e313-734d-4be4-9175-e36a69c59143

### Deleting category_rewards for af10e313-734d-4be4-9175-e36a69c59143...
Result: 

### Deleting card af10e313-734d-4be4-9175-e36a69c59143...
Result: 

✅ Completed processing for: American Express Aeroplan Card
---

## Processing: American Express Aeroplan Reserve Card
**Time**: 2026-02-15 16:16:52 UTC

Found 2 card(s) with name: American Express Aeroplan Reserve Card
- Card 1: 4a6224bb-d68d-47eb-94ff-9d8ee771b827 (updated: 2026-02-12T01:50:39.206617+00:00)
- Card 2: 06d3c581-1889-410c-b140-56baab485c65 (updated: 2026-02-14T03:11:19.848565+00:00)
- Card 1 category_rewards: 2
- Card 2 category_rewards: 4
**Decision**: Keep Card 2 (4 > 2 category_rewards)
- Keeping: 06d3c581-1889-410c-b140-56baab485c65
- Deleting: 4a6224bb-d68d-47eb-94ff-9d8ee771b827

### Deleting category_rewards for 4a6224bb-d68d-47eb-94ff-9d8ee771b827...
Result: 

### Deleting card 4a6224bb-d68d-47eb-94ff-9d8ee771b827...
Result: 

✅ Completed processing for: American Express Aeroplan Reserve Card
---

## Processing: American Express Cobalt Card
**Time**: 2026-02-15 16:16:53 UTC

Found 2 card(s) with name: American Express Cobalt Card
- Card 1: b8030dfc-953c-443d-831a-2d7438c0429b (updated: 2026-02-12T01:50:39.206617+00:00)
- Card 2: aaefe5d8-5080-4dc9-b04b-32f0b8783533 (updated: 2026-02-14T03:11:19.283035+00:00)
