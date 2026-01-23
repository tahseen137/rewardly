-- ============================================================================
-- Link Cards to Reward Programs Migration
-- Adds foreign key relationship between cards and reward_programs
-- ============================================================================

-- ============================================================================
-- ADD REWARD_PROGRAM_ID TO CARDS TABLE
-- ============================================================================

-- Add the foreign key column (nullable initially) - only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'reward_program_id'
  ) THEN
    ALTER TABLE cards 
    ADD COLUMN reward_program_id UUID REFERENCES reward_programs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for performance (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_cards_reward_program_id ON cards(reward_program_id);

-- Add comment
COMMENT ON COLUMN cards.reward_program_id IS 'Foreign key to reward_programs table for detailed valuation data';

-- ============================================================================
-- UPDATE EXISTING CARDS TO LINK TO REWARD PROGRAMS
-- Map cards to their reward programs based on reward_program name
-- ============================================================================

-- Aeroplan cards
UPDATE cards 
SET reward_program_id = (SELECT id FROM reward_programs WHERE program_key = 'aeroplan')
WHERE reward_program ILIKE '%aeroplan%';

-- Scene+ cards
UPDATE cards 
SET reward_program_id = (SELECT id FROM reward_programs WHERE program_key = 'scene-plus')
WHERE reward_program ILIKE '%scene%';

-- Avion cards
UPDATE cards 
SET reward_program_id = (SELECT id FROM reward_programs WHERE program_key = 'rbc-avion')
WHERE reward_program ILIKE '%avion%';

-- Aventura cards
UPDATE cards 
SET reward_program_id = (SELECT id FROM reward_programs WHERE program_key = 'cibc-aventura')
WHERE reward_program ILIKE '%aventura%';

-- BMO Rewards cards
UPDATE cards 
SET reward_program_id = (SELECT id FROM reward_programs WHERE program_key = 'bmo-rewards')
WHERE reward_program ILIKE '%bmo%' AND reward_program ILIKE '%rewards%';

-- TD Rewards cards
UPDATE cards 
SET reward_program_id = (SELECT id FROM reward_programs WHERE program_key = 'td-rewards')
WHERE reward_program ILIKE '%td%' AND reward_program ILIKE '%rewards%';

-- American Express Membership Rewards cards
UPDATE cards 
SET reward_program_id = (SELECT id FROM reward_programs WHERE program_key = 'amex-mr')
WHERE reward_program ILIKE '%membership rewards%' OR reward_program ILIKE '%amex%';

-- WestJet Rewards cards
UPDATE cards 
SET reward_program_id = (SELECT id FROM reward_programs WHERE program_key = 'westjet-rewards')
WHERE reward_program ILIKE '%westjet%';

-- Capital One Miles cards
UPDATE cards 
SET reward_program_id = (SELECT id FROM reward_programs WHERE program_key = 'capital-one-miles')
WHERE issuer ILIKE '%capital one%';

-- Marriott Bonvoy cards
UPDATE cards 
SET reward_program_id = (SELECT id FROM reward_programs WHERE program_key = 'marriott-bonvoy')
WHERE reward_program ILIKE '%marriott%' OR reward_program ILIKE '%bonvoy%';

-- Hilton Honors cards
UPDATE cards 
SET reward_program_id = (SELECT id FROM reward_programs WHERE program_key = 'hilton-honors')
WHERE reward_program ILIKE '%hilton%';

-- World of Hyatt cards
UPDATE cards 
SET reward_program_id = (SELECT id FROM reward_programs WHERE program_key = 'world-of-hyatt')
WHERE reward_program ILIKE '%hyatt%';

-- IHG One Rewards cards
UPDATE cards 
SET reward_program_id = (SELECT id FROM reward_programs WHERE program_key = 'ihg-one-rewards')
WHERE reward_program ILIKE '%ihg%';

-- Best Western Rewards cards
UPDATE cards 
SET reward_program_id = (SELECT id FROM reward_programs WHERE program_key = 'best-western-rewards')
WHERE reward_program ILIKE '%best western%';

-- Tangerine Money-Back cards
UPDATE cards 
SET reward_program_id = (SELECT id FROM reward_programs WHERE program_key = 'tangerine-money-back')
WHERE issuer ILIKE '%tangerine%' AND reward_currency = 'cashback';

-- ============================================================================
-- CREATE VIEW FOR CARDS WITH PROGRAM DATA
-- ============================================================================

CREATE OR REPLACE VIEW cards_with_program_details AS
SELECT 
  c.*,
  rp.program_name,
  rp.program_category,
  rp.program_type,
  rp.unit,
  rp.direct_rate_cents,
  rp.optimal_rate_cents,
  rp.optimal_method,
  rp.redemption_methods,
  -- Get all point valuations for this program
  (
    SELECT json_agg(
      json_build_object(
        'redemption_type', pv.redemption_type,
        'cents_per_point', pv.cents_per_point,
        'minimum_redemption', pv.minimum_redemption,
        'notes', pv.notes
      )
      ORDER BY pv.cents_per_point DESC
    )
    FROM point_valuations pv
    WHERE pv.program_id = rp.id
  ) as redemption_options
FROM cards c
LEFT JOIN reward_programs rp ON c.reward_program_id = rp.id
WHERE c.is_active = true;

-- Add RLS policy for the new view
CREATE POLICY "Allow anonymous read access to cards_with_program_details"
  ON cards FOR SELECT
  TO anon
  USING (is_active = true);

-- ============================================================================
-- VERIFICATION QUERIES (commented out)
-- ============================================================================

-- Check how many cards are linked to programs
-- SELECT 
--   COUNT(*) as total_cards,
--   COUNT(reward_program_id) as linked_cards,
--   COUNT(*) - COUNT(reward_program_id) as unlinked_cards
-- FROM cards;

-- View cards with their program details
-- SELECT 
--   c.name,
--   c.issuer,
--   c.reward_program,
--   rp.program_name,
--   rp.optimal_rate_cents
-- FROM cards c
-- LEFT JOIN reward_programs rp ON c.reward_program_id = rp.id
-- ORDER BY c.issuer, c.name;

-- View unlinked cards (need manual mapping)
-- SELECT 
--   name,
--   issuer,
--   reward_program
-- FROM cards
-- WHERE reward_program_id IS NULL
-- ORDER BY issuer, name;
