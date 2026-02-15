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
- Card 1 category_rewards: 5
- Card 2 category_rewards: 5
**Decision**: Keep Card 2 (equal rewards, newer update: 2026-02-14T03:11:19.283035+00:00)
- Keeping: aaefe5d8-5080-4dc9-b04b-32f0b8783533
- Deleting: b8030dfc-953c-443d-831a-2d7438c0429b

### Deleting category_rewards for b8030dfc-953c-443d-831a-2d7438c0429b...
Result: 

### Deleting card b8030dfc-953c-443d-831a-2d7438c0429b...
Result: 

✅ Completed processing for: American Express Cobalt Card
---

## Processing: American Express Gold Rewards Card
**Time**: 2026-02-15 16:16:55 UTC

Found 2 card(s) with name: American Express Gold Rewards Card
- Card 1: 7fbc0986-67c0-4280-9463-f3b4ee967fb9 (updated: 2026-02-12T01:50:39.206617+00:00)
- Card 2: b0504d3a-7110-45bf-be28-d69077b1436d (updated: 2026-02-14T03:11:18.680889+00:00)
- Card 1 category_rewards: 3
- Card 2 category_rewards: 5
**Decision**: Keep Card 2 (5 > 3 category_rewards)
- Keeping: b0504d3a-7110-45bf-be28-d69077b1436d
- Deleting: 7fbc0986-67c0-4280-9463-f3b4ee967fb9

### Deleting category_rewards for 7fbc0986-67c0-4280-9463-f3b4ee967fb9...
Result: 

### Deleting card 7fbc0986-67c0-4280-9463-f3b4ee967fb9...
Result: 

✅ Completed processing for: American Express Gold Rewards Card
---

## Processing: American Express Green Card
**Time**: 2026-02-15 16:16:56 UTC

Found 3 card(s) with name: American Express Green Card
- Card 1: 7e70904d-3c89-471e-b3d5-250fcbb97550 (updated: 2026-02-12T01:50:39.206617+00:00)
- Card 2: 7e759b90-59ff-4f19-95ac-82aec604100a (updated: 2026-02-14T03:11:22.59459+00:00)
- Card 1 category_rewards: 2
- Card 2 category_rewards: 1
**Decision**: Keep Card 1 (2 > 1 category_rewards)
- Keeping: 7e70904d-3c89-471e-b3d5-250fcbb97550
- Deleting: 7e759b90-59ff-4f19-95ac-82aec604100a

### Deleting category_rewards for 7e759b90-59ff-4f19-95ac-82aec604100a...
Result: 

### Deleting card 7e759b90-59ff-4f19-95ac-82aec604100a...
Result: 

✅ Completed processing for: American Express Green Card
---

## Processing: BMO Air Miles World Elite Mastercard
**Time**: 2026-02-15 16:16:57 UTC

Found 1 card(s) with name: BMO Air Miles World Elite Mastercard
⚠️  Only found 1 card - skipping

## Processing: BMO AIR MILES World Elite Mastercard
**Time**: 2026-02-15 16:16:58 UTC

Found 1 card(s) with name: BMO AIR MILES World Elite Mastercard
⚠️  Only found 1 card - skipping

## Processing: BMO CashBack Mastercard
**Time**: 2026-02-15 16:16:59 UTC

Found 2 card(s) with name: BMO CashBack Mastercard
- Card 1: ddc5b715-e4a9-47be-8aae-fbd480e78fc9 (updated: 2026-02-12T01:50:38.88331+00:00)
- Card 2: 3491dd78-8d8a-4a03-a47c-3e2b1fadfb32 (updated: 2026-02-14T03:11:09.46705+00:00)
- Card 1 category_rewards: 1
- Card 2 category_rewards: 3
**Decision**: Keep Card 2 (3 > 1 category_rewards)
- Keeping: 3491dd78-8d8a-4a03-a47c-3e2b1fadfb32
- Deleting: ddc5b715-e4a9-47be-8aae-fbd480e78fc9

### Deleting category_rewards for ddc5b715-e4a9-47be-8aae-fbd480e78fc9...
Result: 

### Deleting card ddc5b715-e4a9-47be-8aae-fbd480e78fc9...
Result: 

✅ Completed processing for: BMO CashBack Mastercard
---

## Processing: Brim Mastercard
**Time**: 2026-02-15 16:17:00 UTC

Found 2 card(s) with name: Brim Mastercard
- Card 1: c6c26c6d-0604-451f-a8fb-cf122b022207 (updated: 2026-02-12T01:50:38.88331+00:00)
- Card 2: 25967e28-e931-415e-8cbb-5d5bd61e764c (updated: 2026-02-14T02:52:21.876161+00:00)
- Card 1 category_rewards: 1
- Card 2 category_rewards: 1
**Decision**: Keep Card 2 (equal rewards, newer update: 2026-02-14T02:52:21.876161+00:00)
- Keeping: 25967e28-e931-415e-8cbb-5d5bd61e764c
- Deleting: c6c26c6d-0604-451f-a8fb-cf122b022207

### Deleting category_rewards for c6c26c6d-0604-451f-a8fb-cf122b022207...
Result: 

### Deleting card c6c26c6d-0604-451f-a8fb-cf122b022207...
Result: 

✅ Completed processing for: Brim Mastercard
---

## Processing: Capital One Aspire Cash Platinum Mastercard
**Time**: 2026-02-15 16:17:01 UTC

Found 2 card(s) with name: Capital One Aspire Cash Platinum Mastercard
- Card 1: 7b6cc64f-afab-42e4-a504-e70c8ccf7ed9 (updated: 2026-02-12T01:50:39.206617+00:00)
- Card 2: 7f268528-2e16-4892-ac00-47128b011334 (updated: 2026-02-14T03:11:44.543967+00:00)
- Card 1 category_rewards: 1
- Card 2 category_rewards: 1
**Decision**: Keep Card 2 (equal rewards, newer update: 2026-02-14T03:11:44.543967+00:00)
- Keeping: 7f268528-2e16-4892-ac00-47128b011334
- Deleting: 7b6cc64f-afab-42e4-a504-e70c8ccf7ed9

### Deleting category_rewards for 7b6cc64f-afab-42e4-a504-e70c8ccf7ed9...
Result: 

### Deleting card 7b6cc64f-afab-42e4-a504-e70c8ccf7ed9...
Result: 

✅ Completed processing for: Capital One Aspire Cash Platinum Mastercard
---

## Processing: CIBC Dividend Visa Card for Students
**Time**: 2026-02-15 16:17:03 UTC

Found 2 card(s) with name: CIBC Dividend Visa Card for Students
- Card 1: e20ce1dd-a90d-4d02-99c8-016a24370685 (updated: 2026-02-12T01:50:38.88331+00:00)
- Card 2: bbfe2ae9-634b-4444-89a1-bb7d59fe8f32 (updated: 2026-02-14T03:11:46.555977+00:00)
- Card 1 category_rewards: 2
- Card 2 category_rewards: 3
**Decision**: Keep Card 2 (3 > 2 category_rewards)
- Keeping: bbfe2ae9-634b-4444-89a1-bb7d59fe8f32
- Deleting: e20ce1dd-a90d-4d02-99c8-016a24370685

### Deleting category_rewards for e20ce1dd-a90d-4d02-99c8-016a24370685...
Result: 

### Deleting card e20ce1dd-a90d-4d02-99c8-016a24370685...
Result: 

✅ Completed processing for: CIBC Dividend Visa Card for Students
---

## Processing: MBNA True Line Mastercard
**Time**: 2026-02-15 16:17:04 UTC

Found 2 card(s) with name: MBNA True Line Mastercard
- Card 1: 4df0d99d-1014-4a7c-9039-9592d25619bf (updated: 2026-02-12T01:50:38.88331+00:00)
- Card 2: e072e1a9-5dba-4bed-9e48-c4563e45d310 (updated: 2026-02-14T03:11:48.299696+00:00)
- Card 1 category_rewards: 0
- Card 2 category_rewards: 0
**Decision**: Keep Card 2 (equal rewards, newer update: 2026-02-14T03:11:48.299696+00:00)
- Keeping: e072e1a9-5dba-4bed-9e48-c4563e45d310
- Deleting: 4df0d99d-1014-4a7c-9039-9592d25619bf

### Deleting category_rewards for 4df0d99d-1014-4a7c-9039-9592d25619bf...
Result: 

### Deleting card 4df0d99d-1014-4a7c-9039-9592d25619bf...
Result: 

✅ Completed processing for: MBNA True Line Mastercard
---

## Processing: Neo Mastercard
**Time**: 2026-02-15 16:17:06 UTC

Found 2 card(s) with name: Neo Mastercard
- Card 1: f08bd943-0641-4c0d-ac45-2cfb8ab26288 (updated: 2026-02-12T01:50:38.88331+00:00)
- Card 2: f174dd42-dc83-465f-9da5-869376456871 (updated: 2026-02-14T03:11:28.075976+00:00)
- Card 1 category_rewards: 1
- Card 2 category_rewards: 2
**Decision**: Keep Card 2 (2 > 1 category_rewards)
- Keeping: f174dd42-dc83-465f-9da5-869376456871
- Deleting: f08bd943-0641-4c0d-ac45-2cfb8ab26288

### Deleting category_rewards for f08bd943-0641-4c0d-ac45-2cfb8ab26288...
Result: 

### Deleting card f08bd943-0641-4c0d-ac45-2cfb8ab26288...
Result: 

✅ Completed processing for: Neo Mastercard
---

## Processing: PC Financial Mastercard
**Time**: 2026-02-15 16:17:07 UTC

Found 2 card(s) with name: PC Financial Mastercard
- Card 1: 3a78de56-32d5-445b-988a-f26b33af88d8 (updated: 2026-02-12T01:50:38.88331+00:00)
- Card 2: fa1a746e-5acb-4935-96e3-61381e2cdb05 (updated: 2026-02-14T03:11:25.826228+00:00)
- Card 1 category_rewards: 2
- Card 2 category_rewards: 2
**Decision**: Keep Card 2 (equal rewards, newer update: 2026-02-14T03:11:25.826228+00:00)
- Keeping: fa1a746e-5acb-4935-96e3-61381e2cdb05
- Deleting: 3a78de56-32d5-445b-988a-f26b33af88d8

### Deleting category_rewards for 3a78de56-32d5-445b-988a-f26b33af88d8...
Result: 

### Deleting card 3a78de56-32d5-445b-988a-f26b33af88d8...
Result: 

✅ Completed processing for: PC Financial Mastercard
---

## Processing: PC Financial World Elite Mastercard
**Time**: 2026-02-15 16:17:09 UTC

Found 2 card(s) with name: PC Financial World Elite Mastercard
- Card 1: 09f7d37f-c648-4580-9beb-de6623e83d8f (updated: 2026-02-12T01:50:38.88331+00:00)
- Card 2: 42346f99-1a05-448c-a6ca-e819f4b67123 (updated: 2026-02-14T03:11:24.869388+00:00)
- Card 1 category_rewards: 2
- Card 2 category_rewards: 4
**Decision**: Keep Card 2 (4 > 2 category_rewards)
- Keeping: 42346f99-1a05-448c-a6ca-e819f4b67123
- Deleting: 09f7d37f-c648-4580-9beb-de6623e83d8f

### Deleting category_rewards for 09f7d37f-c648-4580-9beb-de6623e83d8f...
Result: 

### Deleting card 09f7d37f-c648-4580-9beb-de6623e83d8f...
Result: 

✅ Completed processing for: PC Financial World Elite Mastercard
---

## Processing: PC Financial World Mastercard
**Time**: 2026-02-15 16:17:10 UTC

Found 2 card(s) with name: PC Financial World Mastercard
- Card 1: 40c94f3a-f24e-4d8c-9c4b-42fd2de5cafb (updated: 2026-02-14T02:52:21.141189+00:00)
- Card 2: 06c9313b-240b-4c2b-be29-051267efff49 (updated: 2026-02-14T03:11:25.343981+00:00)
- Card 1 category_rewards: 2
- Card 2 category_rewards: 4
**Decision**: Keep Card 2 (4 > 2 category_rewards)
- Keeping: 06c9313b-240b-4c2b-be29-051267efff49
- Deleting: 40c94f3a-f24e-4d8c-9c4b-42fd2de5cafb

### Deleting category_rewards for 40c94f3a-f24e-4d8c-9c4b-42fd2de5cafb...
Result: 

### Deleting card 40c94f3a-f24e-4d8c-9c4b-42fd2de5cafb...
Result: 

✅ Completed processing for: PC Financial World Mastercard
---

## Processing: RBC Cash Back Preferred World Elite Mastercard
**Time**: 2026-02-15 16:17:11 UTC

Found 2 card(s) with name: RBC Cash Back Preferred World Elite Mastercard
- Card 1: 2cf284f6-534d-487f-8f61-24ad15623d6c (updated: 2026-02-12T01:50:38.88331+00:00)
- Card 2: db751ab1-2d94-4eb7-89a8-b85aa34a81a5 (updated: 2026-02-14T03:11:02.170892+00:00)
- Card 1 category_rewards: 1
- Card 2 category_rewards: 3
**Decision**: Keep Card 2 (3 > 1 category_rewards)
- Keeping: db751ab1-2d94-4eb7-89a8-b85aa34a81a5
- Deleting: 2cf284f6-534d-487f-8f61-24ad15623d6c

### Deleting category_rewards for 2cf284f6-534d-487f-8f61-24ad15623d6c...
Result: 

### Deleting card 2cf284f6-534d-487f-8f61-24ad15623d6c...
Result: 

✅ Completed processing for: RBC Cash Back Preferred World Elite Mastercard
---

## Processing: Rogers Platinum Mastercard
**Time**: 2026-02-15 16:17:13 UTC

Found 2 card(s) with name: Rogers Platinum Mastercard
- Card 1: 764fc19c-3268-4b34-873f-4333c331ecb0 (updated: 2026-02-14T02:52:20.806092+00:00)
- Card 2: 2744931f-fc21-491c-893a-0f0919ff22e6 (updated: 2026-02-14T03:11:27.019499+00:00)
- Card 1 category_rewards: 1
- Card 2 category_rewards: 2
**Decision**: Keep Card 2 (2 > 1 category_rewards)
- Keeping: 2744931f-fc21-491c-893a-0f0919ff22e6
- Deleting: 764fc19c-3268-4b34-873f-4333c331ecb0

### Deleting category_rewards for 764fc19c-3268-4b34-873f-4333c331ecb0...
Result: 

### Deleting card 764fc19c-3268-4b34-873f-4333c331ecb0...
Result: 

✅ Completed processing for: Rogers Platinum Mastercard
---

## Summary
Cleanup completed at 2026-02-15 16:17:14 UTC

### ⚠️ CRITICAL ISSUE: Deletions Failed Due to Permissions

**Problem:** The Supabase anon API key does not have DELETE permissions on the `cards` and `category_rewards` tables. While the DELETE requests returned HTTP 204 (success), they affected 0 rows due to Row Level Security (RLS) policies.

**Verification:** Re-queried "American Express Aeroplan Card" after cleanup - still shows 2 cards present.

**Impact:**
- ✅ Successfully identified all duplicate pairs (16 pairs processed, 2 names had no duplicates found)
- ✅ Determined which card to keep for each pair based on category_rewards count and updated_at
- ✅ Verified user_cards table is empty (no user migrations needed)
- ❌ DELETE operations failed silently due to insufficient permissions

### Cards Identified for Deletion

The following 16 duplicate cards should be deleted (using service_role key or Supabase dashboard):

1. **American Express Aeroplan Card** - DELETE `af10e313-734d-4be4-9175-e36a69c59143`
2. **American Express Aeroplan Reserve Card** - DELETE `4a6224bb-d68d-47eb-94ff-9d8ee771b827`
3. **American Express Cobalt Card** - DELETE `b8030dfc-953c-443d-831a-2d7438c0429b`
4. **American Express Gold Rewards Card** - DELETE `7fbc0986-67c0-4280-9463-f3b4ee967fb9`
5. **American Express Green Card** - DELETE `7e759b90-59ff-4f19-95ac-82aec604100a`
6. **BMO CashBack Mastercard** - DELETE `ddc5b715-e4a9-47be-8aae-fbd480e78fc9`
7. **Brim Mastercard** - DELETE `c6c26c6d-0604-451f-a8fb-cf122b022207`
8. **Capital One Aspire Cash Platinum Mastercard** - DELETE `7b6cc64f-afab-42e4-a504-e70c8ccf7ed9`
9. **CIBC Dividend Visa Card for Students** - DELETE `e20ce1dd-a90d-4d02-99c8-016a24370685`
10. **MBNA True Line Mastercard** - DELETE `4df0d99d-1014-4a7c-9039-9592d25619bf`
11. **Neo Mastercard** - DELETE `f08bd943-0641-4c0d-ac45-2cfb8ab26288`
12. **PC Financial Mastercard** - DELETE `3a78de56-32d5-445b-988a-f26b33af88d8`
13. **PC Financial World Elite Mastercard** - DELETE `09f7d37f-c648-4580-9beb-de6623e83d8f`
14. **PC Financial World Mastercard** - DELETE `40c94f3a-f24e-4d8c-9c4b-42fd2de5cafb`
15. **RBC Cash Back Preferred World Elite Mastercard** - DELETE `2cf284f6-534d-487f-8f61-24ad15623d6c`
16. **Rogers Platinum Mastercard** - DELETE `764fc19c-3268-4b34-873f-4333c331ecb0`

### Next Steps Required

**Option 1: Use service_role key** (has full database access)
```bash
# Update API_KEY in cleanup_duplicates.sh to use service_role key instead of anon key
# Then re-run: ./cleanup_duplicates.sh
```

**Option 2: Manual deletion via Supabase Dashboard**
1. Go to https://zdlozhpmqrtvvhdzbmrv.supabase.co
2. Navigate to Table Editor
3. For each card ID listed above:
   - Delete from `category_rewards` WHERE card_id = [ID]
   - Delete from `cards` WHERE id = [ID]

**Option 3: Update RLS policies** (if you want anon key to have delete access)
```sql
-- Add delete policy to cards table
CREATE POLICY "Enable delete for anon" ON cards
  FOR DELETE
  USING (true);

-- Add delete policy to category_rewards table  
CREATE POLICY "Enable delete for anon" ON category_rewards
  FOR DELETE
  USING (true);
```

### Notes on BMO Air Miles Cards

- "BMO Air Miles World Elite Mastercard" (only 1 found - no duplicate)
- "BMO AIR MILES World Elite Mastercard" (only 1 found - no duplicate)

These were listed as a duplicate pair but have different capitalization in the database. They may actually be the same card with inconsistent naming. Recommend manual review.
