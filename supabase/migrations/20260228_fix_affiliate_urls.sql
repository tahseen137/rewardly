-- Fix broken affiliate/application URLs
-- Addresses 404 errors on "Apply Now" buttons
-- Verified: all replacement URLs return HTTP 200

-- Ensure column exists
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS application_url TEXT;

-- ============================================================
-- American Express Canada (en-ca → ca/en URL format fix)
-- ============================================================
UPDATE public.cards SET application_url = 'https://www.americanexpress.com/ca/en/credit-cards/aeroplan-cards/'
  WHERE card_key ILIKE '%amex%aeroplan%' OR card_key ILIKE '%american-express%aeroplan%';

UPDATE public.cards SET application_url = 'https://www.americanexpress.com/ca/en/credit-cards/the-platinum-card/'
  WHERE card_key ILIKE '%amex%platinum%' OR card_key ILIKE '%american-express%platinum%';

UPDATE public.cards SET application_url = 'https://www.americanexpress.com/ca/en/credit-cards/marriott-bonvoy-credit-card/'
  WHERE card_key ILIKE '%marriott%bonvoy%' AND issuer ILIKE '%american express%';

UPDATE public.cards SET application_url = 'https://www.americanexpress.com/ca/en/credit-cards/cobalt-card/'
  WHERE card_key ILIKE '%cobalt%' AND issuer ILIKE '%american express%';

UPDATE public.cards SET application_url = 'https://www.americanexpress.com/ca/en/credit-cards/gold-rewards-card/'
  WHERE card_key ILIKE '%amex%gold%' OR (card_key ILIKE '%gold%rewards%' AND issuer ILIKE '%american express%');

UPDATE public.cards SET application_url = 'https://www.americanexpress.com/ca/en/credit-cards/simply-cash-preferred-card/'
  WHERE card_key ILIKE '%simply-cash-preferred%' AND issuer ILIKE '%american express%';

UPDATE public.cards SET application_url = 'https://www.americanexpress.com/ca/en/credit-cards/simply-cash-card/'
  WHERE card_key ILIKE '%simply-cash%' AND card_key NOT ILIKE '%preferred%' AND issuer ILIKE '%american express%';

UPDATE public.cards SET application_url = 'https://www.americanexpress.com/ca/en/credit-cards/aeroplan-reserve-card/'
  WHERE card_key ILIKE '%aeroplan%reserve%' AND issuer ILIKE '%american express%';

-- ============================================================
-- CIBC (all-cards → all-credit-cards path fix)
-- ============================================================
UPDATE public.cards SET application_url = 'https://www.cibc.com/en/personal-banking/credit-cards/all-credit-cards/aeroplan-visa-infinite-card.html'
  WHERE card_key = 'cibc-aeroplan-visa-infinite';

UPDATE public.cards SET application_url = 'https://www.cibc.com/en/personal-banking/credit-cards/all-credit-cards/aventura-visa-infinite-card.html'
  WHERE card_key = 'cibc-aventura-visa-infinite';

UPDATE public.cards SET application_url = 'https://www.cibc.com/en/personal-banking/credit-cards/all-credit-cards/dividend-visa-infinite-card.html'
  WHERE card_key ILIKE '%cibc%dividend%infinite%';

UPDATE public.cards SET application_url = 'https://www.cibc.com/en/personal-banking/credit-cards/all-credit-cards/costco-mastercard.html'
  WHERE card_key ILIKE '%cibc%costco%';

UPDATE public.cards SET application_url = 'https://www.cibc.com/en/personal-banking/credit-cards/all-credit-cards/select-visa-card.html'
  WHERE card_key ILIKE '%cibc%select%';

-- ============================================================
-- RBC (fixed URL slugs)
-- ============================================================
UPDATE public.cards SET application_url = 'https://www.rbcroyalbank.com/credit-cards/travel/westjet-rbc-world-elite-mastercard.html'
  WHERE card_key ILIKE '%westjet%world-elite%' OR card_key ILIKE '%rbc-westjet%world%';

-- Fallback to main credit cards page for discontinued/moved RBC URLs
UPDATE public.cards SET application_url = 'https://www.rbcroyalbank.com/credit-cards/'
  WHERE (card_key ILIKE '%rbc%cashback%preferred%world%' OR card_key ILIKE '%rbc%rewards-plus%')
    AND (application_url IS NULL OR application_url ILIKE '%cashback-preferred-world-elite-mastercard%' OR application_url ILIKE '%rbc-rewards-plus-visa%');

-- ============================================================
-- BMO (remove /en-ca/ from path — correct URL format)
-- ============================================================
UPDATE public.cards SET application_url = 'https://www.bmo.com/main/personal/credit-cards/bmo-air-miles-world-elite-mastercard/'
  WHERE card_key ILIKE '%bmo%air-miles%world-elite%';

UPDATE public.cards SET application_url = 'https://www.bmo.com/main/personal/credit-cards/bmo-eclipse-visa-infinite/'
  WHERE card_key ILIKE '%bmo%eclipse%infinite%' AND card_key NOT ILIKE '%privilege%';

UPDATE public.cards SET application_url = 'https://www.bmo.com/main/personal/credit-cards/bmo-cashback-mastercard/'
  WHERE card_key ILIKE '%bmo%cashback-mastercard%' OR card_key ILIKE '%bmo-cash-back-mastercard%';

UPDATE public.cards SET application_url = 'https://www.bmo.com/main/personal/credit-cards/bmo-preferred-rate-mastercard/'
  WHERE card_key ILIKE '%bmo%preferred-rate%';

-- ============================================================
-- National Bank (NBC) — fallback to credit cards listing
-- ============================================================
UPDATE public.cards SET application_url = 'https://www.nbc.ca/en/personal/credit-cards/'
  WHERE issuer ILIKE '%national bank%' AND (application_url IS NULL OR application_url ILIKE '%nbc.ca/personal/credit-cards%');

-- ============================================================
-- PC Financial — fixed paths
-- ============================================================
UPDATE public.cards SET application_url = 'https://www.pcfinancial.ca/en/credit-cards/world-elite-mastercard/'
  WHERE card_key ILIKE '%pc%world-elite%' OR card_key ILIKE '%pcfinancial%world%';

UPDATE public.cards SET application_url = 'https://www.pcfinancial.ca/en/credit-cards/no-fee-mastercard/'
  WHERE card_key ILIKE '%pc%no-fee%' OR card_key ILIKE '%pcfinancial%no%fee%';

-- ============================================================
-- Simplii Financial — fixed path
-- ============================================================
UPDATE public.cards SET application_url = 'https://www.simplii.com/en/credit-cards/cash-back-visa.html'
  WHERE card_key ILIKE '%simplii%cash%back%' OR card_key ILIKE '%simplii%visa%';

-- ============================================================
-- Capital One — fixed URL
-- ============================================================
UPDATE public.cards SET application_url = 'https://www.capitalone.ca/'
  WHERE card_key ILIKE '%capital-one%aspire%travel%' AND (application_url IS NULL OR application_url ILIKE '%aspire-travel-world%');
