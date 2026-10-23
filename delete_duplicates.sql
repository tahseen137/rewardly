-- Rewardly Duplicate Card Cleanup SQL Script
-- Generated: 2026-02-15
-- Run this in Supabase SQL Editor to delete duplicate cards

-- This script will:
-- 1. Delete category_rewards for each duplicate card
-- 2. Delete the duplicate cards themselves

-- BACKUP RECOMMENDED BEFORE RUNNING!

BEGIN;

-- 1. American Express Aeroplan Card
DELETE FROM category_rewards WHERE card_id = 'af10e313-734d-4be4-9175-e36a69c59143';
DELETE FROM cards WHERE id = 'af10e313-734d-4be4-9175-e36a69c59143';

-- 2. American Express Aeroplan Reserve Card
DELETE FROM category_rewards WHERE card_id = '4a6224bb-d68d-47eb-94ff-9d8ee771b827';
DELETE FROM cards WHERE id = '4a6224bb-d68d-47eb-94ff-9d8ee771b827';

-- 3. American Express Cobalt Card
DELETE FROM category_rewards WHERE card_id = 'b8030dfc-953c-443d-831a-2d7438c0429b';
DELETE FROM cards WHERE id = 'b8030dfc-953c-443d-831a-2d7438c0429b';

-- 4. American Express Gold Rewards Card
DELETE FROM category_rewards WHERE card_id = '7fbc0986-67c0-4280-9463-f3b4ee967fb9';
DELETE FROM cards WHERE id = '7fbc0986-67c0-4280-9463-f3b4ee967fb9';

-- 5. American Express Green Card
DELETE FROM category_rewards WHERE card_id = '7e759b90-59ff-4f19-95ac-82aec604100a';
DELETE FROM cards WHERE id = '7e759b90-59ff-4f19-95ac-82aec604100a';

-- 6. BMO CashBack Mastercard
DELETE FROM category_rewards WHERE card_id = 'ddc5b715-e4a9-47be-8aae-fbd480e78fc9';
DELETE FROM cards WHERE id = 'ddc5b715-e4a9-47be-8aae-fbd480e78fc9';

-- 7. Brim Mastercard
DELETE FROM category_rewards WHERE card_id = 'c6c26c6d-0604-451f-a8fb-cf122b022207';
DELETE FROM cards WHERE id = 'c6c26c6d-0604-451f-a8fb-cf122b022207';

-- 8. Capital One Aspire Cash Platinum Mastercard
DELETE FROM category_rewards WHERE card_id = '7b6cc64f-afab-42e4-a504-e70c8ccf7ed9';
DELETE FROM cards WHERE id = '7b6cc64f-afab-42e4-a504-e70c8ccf7ed9';

-- 9. CIBC Dividend Visa Card for Students
DELETE FROM category_rewards WHERE card_id = 'e20ce1dd-a90d-4d02-99c8-016a24370685';
DELETE FROM cards WHERE id = 'e20ce1dd-a90d-4d02-99c8-016a24370685';

-- 10. MBNA True Line Mastercard
DELETE FROM category_rewards WHERE card_id = '4df0d99d-1014-4a7c-9039-9592d25619bf';
DELETE FROM cards WHERE id = '4df0d99d-1014-4a7c-9039-9592d25619bf';

-- 11. Neo Mastercard
DELETE FROM category_rewards WHERE card_id = 'f08bd943-0641-4c0d-ac45-2cfb8ab26288';
DELETE FROM cards WHERE id = 'f08bd943-0641-4c0d-ac45-2cfb8ab26288';

-- 12. PC Financial Mastercard
DELETE FROM category_rewards WHERE card_id = '3a78de56-32d5-445b-988a-f26b33af88d8';
DELETE FROM cards WHERE id = '3a78de56-32d5-445b-988a-f26b33af88d8';

-- 13. PC Financial World Elite Mastercard
DELETE FROM category_rewards WHERE card_id = '09f7d37f-c648-4580-9beb-de6623e83d8f';
DELETE FROM cards WHERE id = '09f7d37f-c648-4580-9beb-de6623e83d8f';

-- 14. PC Financial World Mastercard
DELETE FROM category_rewards WHERE card_id = '40c94f3a-f24e-4d8c-9c4b-42fd2de5cafb';
DELETE FROM cards WHERE id = '40c94f3a-f24e-4d8c-9c4b-42fd2de5cafb';

-- 15. RBC Cash Back Preferred World Elite Mastercard
DELETE FROM category_rewards WHERE card_id = '2cf284f6-534d-487f-8f61-24ad15623d6c';
DELETE FROM cards WHERE id = '2cf284f6-534d-487f-8f61-24ad15623d6c';

-- 16. Rogers Platinum Mastercard
DELETE FROM category_rewards WHERE card_id = '764fc19c-3268-4b34-873f-4333c331ecb0';
DELETE FROM cards WHERE id = '764fc19c-3268-4b34-873f-4333c331ecb0';

-- Commit the transaction
COMMIT;

-- Verify cleanup
SELECT 'Remaining duplicates check:' as info;
SELECT name, COUNT(*) as count 
FROM cards 
WHERE country = 'CA'
GROUP BY name 
HAVING COUNT(*) > 1
ORDER BY name;
