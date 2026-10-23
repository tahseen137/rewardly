#!/usr/bin/env python3
"""
Card Verification Script - Updates canadian_cards_extended.json and credit-cards-full.json
with verified data from bank websites (Feb 14, 2026).
"""
import json
import copy

EXTENDED_PATH = "src/data/canadian_cards_extended.json"
FULL_PATH = "data/credit-cards-full.json"
VERIFICATION_DATE = "2026-02-14"

# ============================================================
# VERIFIED CORRECTIONS for canadian_cards_extended.json
# ============================================================
EXTENDED_FIXES = {
    "amex-cobalt-card": {
        "annualFee": 191.88,
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.americanexpress.com/en-ca/credit-cards/cobalt-card/",
        "categoryRewards": [
            {"category": "dining", "rewardRate": {"value": 5, "type": "points", "unit": "multiplier"}},
            {"category": "groceries", "rewardRate": {"value": 5, "type": "points", "unit": "multiplier"}},
            {"category": "streaming", "rewardRate": {"value": 3, "type": "points", "unit": "multiplier"}},
            {"category": "gas", "rewardRate": {"value": 2, "type": "points", "unit": "multiplier"}},
            {"category": "transit", "rewardRate": {"value": 2, "type": "points", "unit": "multiplier"}},
        ],
        "signupBonus": {"amount": 15000, "currency": "points", "spendRequirement": 9000, "timeframeDays": 365},
    },
    "amex-simplycash-preferred": {
        "annualFee": 119.88,
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.americanexpress.com/en-ca/credit-cards/simply-cash-preferred/",
        "baseRewardRate": {"value": 2, "type": "cashback", "unit": "percent"},
        "categoryRewards": [
            {"category": "groceries", "rewardRate": {"value": 4, "type": "cashback", "unit": "percent"}},
            {"category": "gas", "rewardRate": {"value": 4, "type": "cashback", "unit": "percent"}},
        ],
        "signupBonus": {"amount": 250, "currency": "cashback", "spendRequirement": 3000, "timeframeDays": 120},
    },
    "amex-simplycash": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.americanexpress.com/en-ca/credit-cards/simply-cash/",
    },
    "amex-gold-rewards": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.americanexpress.com/en-ca/credit-cards/gold-rewards-card/",
    },
    "amex-platinum-card": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.americanexpress.com/en-ca/credit-cards/platinum-card/",
    },
    "amex-aeroplan-card": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.americanexpress.com/en-ca/credit-cards/aeroplan-card/",
    },
    "amex-aeroplan-reserve": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.americanexpress.com/en-ca/credit-cards/aeroplan-reserve-card/",
    },
    "amex-marriott-bonvoy": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.americanexpress.com/en-ca/credit-cards/marriott-bonvoy/",
    },
    "td-first-class-travel": {
        "annualFee": 139,
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.td.com/ca/en/personal-banking/products/credit-cards/travel-rewards/first-class-travel-visa-infinite-card",
        "baseRewardRate": {"value": 2, "type": "points", "unit": "multiplier"},
        "categoryRewards": [
            {"category": "travel_booked", "rewardRate": {"value": 8, "type": "points", "unit": "multiplier"}},
            {"category": "groceries", "rewardRate": {"value": 6, "type": "points", "unit": "multiplier"}},
            {"category": "dining", "rewardRate": {"value": 6, "type": "points", "unit": "multiplier"}},
            {"category": "transit", "rewardRate": {"value": 6, "type": "points", "unit": "multiplier"}},
            {"category": "recurring_bills", "rewardRate": {"value": 4, "type": "points", "unit": "multiplier"}},
            {"category": "streaming", "rewardRate": {"value": 4, "type": "points", "unit": "multiplier"}},
        ],
        "signupBonus": {"amount": 165000, "currency": "points", "spendRequirement": 7500, "timeframeDays": 180},
    },
    "td-aeroplan-visa-infinite": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.td.com/ca/en/personal-banking/products/credit-cards/aeroplan/aeroplan-visa-infinite-card",
        "categoryRewards": [
            {"category": "groceries", "rewardRate": {"value": 1.5, "type": "airline_miles", "unit": "multiplier"}},
            {"category": "gas", "rewardRate": {"value": 1.5, "type": "airline_miles", "unit": "multiplier"}},
            {"category": "air_canada", "rewardRate": {"value": 1.5, "type": "airline_miles", "unit": "multiplier"}},
        ],
        "signupBonus": {"amount": 40000, "currency": "airline_miles", "spendRequirement": 7500, "timeframeDays": 365},
    },
    "td-aeroplan-visa-infinite-privilege": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.td.com/ca/en/personal-banking/products/credit-cards/aeroplan/aeroplan-visa-infinite-privilege-card",
    },
    "td-cash-back-visa-infinite": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.td.com/ca/en/personal-banking/products/credit-cards/cash-back/cash-back-visa-infinite-card",
        "categoryRewards": [
            {"category": "groceries", "rewardRate": {"value": 3, "type": "cashback", "unit": "percent"}},
            {"category": "gas", "rewardRate": {"value": 2, "type": "cashback", "unit": "percent"}},
            {"category": "recurring_bills", "rewardRate": {"value": 1, "type": "cashback", "unit": "percent"}},
        ],
    },
    "td-platinum-travel-visa": {
        "annualFee": 89,
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.td.com/ca/en/personal-banking/products/credit-cards/travel-rewards/platinum-travel-visa-card",
    },
    "rbc-avion-visa-infinite": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.rbcroyalbank.com/credit-cards/travel/rbc-avion-visa-infinite.html",
        "categoryRewards": [
            {"category": "travel", "rewardRate": {"value": 1.25, "type": "points", "unit": "multiplier"}},
        ],
        "signupBonus": {"amount": 35000, "currency": "points", "spendRequirement": 5000, "timeframeDays": 90},
    },
    "rbc-avion-visa-infinite-privilege": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.rbcroyalbank.com/credit-cards/travel/rbc-avion-visa-infinite-privilege.html",
    },
    "rbc-westjet-world-elite": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.rbcroyalbank.com/credit-cards/travel/rbc-westjet-world-elite-mastercard.html",
    },
    "rbc-cash-back-preferred-we": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.rbcroyalbank.com/credit-cards/cash-back/cashback-preferred-world-elite-mastercard.html",
    },
    "rbc-ion-plus-visa": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.rbcroyalbank.com/credit-cards/rewards/rbc-ion-plus-visa.html",
        "rewardProgram": "RBC Avion Rewards",
        "categoryRewards": [
            {"category": "groceries", "rewardRate": {"value": 1.5, "type": "points", "unit": "multiplier"}},
            {"category": "gas", "rewardRate": {"value": 1.5, "type": "points", "unit": "multiplier"}},
            {"category": "transit", "rewardRate": {"value": 1.5, "type": "points", "unit": "multiplier"}},
        ],
    },
    "rbc-rewards-plus-visa": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.rbcroyalbank.com/credit-cards/rewards/rbc-rewards-plus-visa.html",
    },
    "scotia-momentum-visa-infinite": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.scotiabank.com/ca/en/personal/credit-cards/visa/momentum-infinite-card.html",
        "categoryRewards": [
            {"category": "groceries", "rewardRate": {"value": 4, "type": "cashback", "unit": "percent"}},
            {"category": "recurring_bills", "rewardRate": {"value": 4, "type": "cashback", "unit": "percent"}},
            {"category": "gas", "rewardRate": {"value": 2, "type": "cashback", "unit": "percent"}},
            {"category": "transit", "rewardRate": {"value": 2, "type": "cashback", "unit": "percent"}},
        ],
    },
    "scotia-gold-amex": {
        "foreignTransactionFee": 0,
        "applicationUrl": "https://www.scotiabank.com/ca/en/personal/credit-cards/american-express/gold-card.html",
        "categoryRewards": [
            {"category": "dining", "rewardRate": {"value": 6, "type": "points", "unit": "multiplier"}},
            {"category": "entertainment", "rewardRate": {"value": 6, "type": "points", "unit": "multiplier"}},
            {"category": "groceries", "rewardRate": {"value": 5, "type": "points", "unit": "multiplier"}},
            {"category": "transit", "rewardRate": {"value": 3, "type": "points", "unit": "multiplier"}},
        ],
        "signupBonus": {"amount": 45000, "currency": "points", "spendRequirement": 7500, "timeframeDays": 365},
    },
    "scotia-passport-visa-infinite": {
        "foreignTransactionFee": 0,
        "rewardProgram": "Scene+",
        "applicationUrl": "https://www.scotiabank.com/ca/en/personal/credit-cards/visa/passport-infinite-card.html",
        "categoryRewards": [
            {"category": "groceries", "rewardRate": {"value": 3, "type": "points", "unit": "multiplier"}},
            {"category": "dining", "rewardRate": {"value": 2, "type": "points", "unit": "multiplier"}},
            {"category": "entertainment", "rewardRate": {"value": 2, "type": "points", "unit": "multiplier"}},
            {"category": "transit", "rewardRate": {"value": 2, "type": "points", "unit": "multiplier"}},
        ],
        "signupBonus": {"amount": 50000, "currency": "points", "spendRequirement": 10000, "timeframeDays": 180},
    },
    "scotia-scene-visa": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.scotiabank.com/ca/en/personal/credit-cards/visa/scene-visa.html",
    },
    "scotia-momentum-no-fee": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.scotiabank.com/ca/en/personal/credit-cards/visa/momentum-no-fee-card.html",
    },
    "cibc-dividend-visa-infinite": {
        "annualFee": 120,
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.cibc.com/en/personal-banking/credit-cards/all-cards/dividend-visa-infinite-card.html",
    },
    "cibc-aeroplan-visa-infinite": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.cibc.com/en/personal-banking/credit-cards/all-cards/aeroplan-visa-infinite-card.html",
    },
    "cibc-aventura-visa-infinite": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.cibc.com/en/personal-banking/credit-cards/all-cards/aventura-visa-infinite-card.html",
    },
    "cibc-costco-mastercard": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.cibc.com/en/personal-banking/credit-cards/all-cards/costco-mastercard.html",
    },
    "cibc-select-visa": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.cibc.com/en/personal-banking/credit-cards/all-cards/select-visa-card.html",
    },
    "bmo-cashback-world-elite": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.bmo.com/en-ca/main/personal/credit-cards/bmo-cashback-world-elite-mastercard/",
        "categoryRewards": [
            {"category": "groceries", "rewardRate": {"value": 5, "type": "cashback", "unit": "percent"}},
            {"category": "gas", "rewardRate": {"value": 4, "type": "cashback", "unit": "percent"}},
            {"category": "transit", "rewardRate": {"value": 4, "type": "cashback", "unit": "percent"}},
            {"category": "recurring_bills", "rewardRate": {"value": 3, "type": "cashback", "unit": "percent"}},
        ],
    },
    "bmo-eclipse-visa-infinite": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.bmo.com/en-ca/main/personal/credit-cards/bmo-eclipse-visa-infinite/",
    },
    "bmo-cashback-mastercard": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.bmo.com/en-ca/main/personal/credit-cards/bmo-cashback-mastercard/",
    },
    "bmo-airmiles-world-elite": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.bmo.com/en-ca/main/personal/credit-cards/bmo-air-miles-world-elite-mastercard/",
    },
    "bmo-preferred-rate-mastercard": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.bmo.com/en-ca/main/personal/credit-cards/bmo-preferred-rate-mastercard/",
    },
    "tangerine-money-back": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.tangerine.ca/en/personal/spend/credit-cards/money-back-credit-card",
    },
    "tangerine-world-mastercard": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.tangerine.ca/en/personal/spend/credit-cards/world-mastercard",
    },
    "capital-one-aspire-cash": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.capitalone.ca/credit-cards/aspire-cash-platinum/",
    },
    "capital-one-aspire-travel": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.capitalone.ca/credit-cards/aspire-travel-world/",
    },
    "national-bank-world-elite": {
        "foreignTransactionFee": 0,
        "applicationUrl": "https://www.nbc.ca/personal/credit-cards/world-elite-mastercard.html",
    },
    "national-bank-syncro": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.nbc.ca/personal/credit-cards/syncro-mastercard.html",
    },
    "rogers-world-elite": {
        "foreignTransactionFee": 0,
        "applicationUrl": "https://www.rogersbank.com/en/rogers_world_elite_mastercard",
        "categoryRewards": [
            {"category": "foreign_currency", "rewardRate": {"value": 4, "type": "cashback", "unit": "percent"}},
            {"category": "rogers", "rewardRate": {"value": 3, "type": "cashback", "unit": "percent"}},
        ],
    },
    "rogers-platinum-mastercard": {
        "foreignTransactionFee": 0,
        "applicationUrl": "https://www.rogersbank.com/en/rogers_platinum_mastercard",
    },
    "simplii-cash-back-visa": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.simplii.com/en/credit-cards/cash-back-visa-card.html",
    },
    "pc-world-elite": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.pcfinancial.ca/en/credit-cards/pc-money-account/world-elite/",
    },
    "pc-mastercard": {
        "foreignTransactionFee": 0.025,
        "applicationUrl": "https://www.pcfinancial.ca/en/credit-cards/pc-money-account/no-fee/",
    },
}

# ============================================================
# Apply updates to canadian_cards_extended.json
# ============================================================
with open(EXTENDED_PATH, "r") as f:
    ext_data = json.load(f)

changes_log = []
verified_cards = []

for card in ext_data["cards"]:
    card_id = card["id"]
    if card_id in EXTENDED_FIXES:
        fixes = EXTENDED_FIXES[card_id]
        for key, value in fixes.items():
            old_val = card.get(key)
            if old_val != value:
                changes_log.append(f"  [{card['name']}] {key}: {old_val} → {value}")
            card[key] = value
        card["lastVerified"] = VERIFICATION_DATE
        verified_cards.append(card["name"])

# Fix the duplicate TD Platinum Travel Visa ($0 fee entry)
for card in ext_data["cards"]:
    if card["id"] == "td-platinum-travel-visa" and card["annualFee"] == 0:
        card["annualFee"] = 89
        card["foreignTransactionFee"] = 0.025
        card["lastVerified"] = VERIFICATION_DATE
        changes_log.append(f"  [{card['name']}] annualFee: 0 → 89 (was incorrect duplicate)")

# Remove the duplicate TD Platinum Travel entry (visa-infinite-privilege-td)
ext_data["cards"] = [c for c in ext_data["cards"] if c["id"] != "visa-infinite-privilege-td"]
changes_log.append("  Removed duplicate 'visa-infinite-privilege-td' entry (duplicate of td-platinum-travel-visa)")

with open(EXTENDED_PATH, "w") as f:
    json.dump(ext_data, f, indent=2, ensure_ascii=False)

print(f"Updated {EXTENDED_PATH}: {len(verified_cards)} cards verified")

# ============================================================
# VERIFIED CORRECTIONS for credit-cards-full.json
# ============================================================
FULL_FIXES = {
    # Key is (issuer, name) tuple
    ("American Express", "American Express Cobalt Card"): {
        "annual_fee": 191.88,
        "foreign_transaction_fee": 0.025,
        "earning_rates": {"base": 1.0, "dining": 5.0, "groceries": 5.0, "streaming": 3.0, "gas": 2.0, "transit": 2.0},
        "signup_bonus": {"points": 15000, "spend_requirement": 9000, "months": 12},
        "applicationUrl": "https://www.americanexpress.com/en-ca/credit-cards/cobalt-card/",
    },
    ("American Express", "SimplyCash Preferred Card from American Express"): {
        "annual_fee": 119.88,
        "foreign_transaction_fee": 0.025,
        "earning_rates": {"base": 2.0, "groceries": 4.0, "gas": 4.0},
        "signup_bonus": {"amount": 250, "spend_requirement": 3000, "months": 4},
        "applicationUrl": "https://www.americanexpress.com/en-ca/credit-cards/simply-cash-preferred/",
    },
    ("American Express", "SimplyCash Card from American Express"): {
        "foreign_transaction_fee": 0.025,
        "applicationUrl": "https://www.americanexpress.com/en-ca/credit-cards/simply-cash/",
    },
    ("TD Bank", "TD First Class Travel Visa Infinite Card"): {
        "foreign_transaction_fee": 0.025,
        "earning_rates": {"base": 2.0, "travel_booked": 8.0, "groceries": 6.0, "dining": 6.0, "transit": 6.0, "recurring_bills": 4.0, "streaming": 4.0},
        "signup_bonus": {"points": 165000, "spend_requirement": 7500, "months": 6},
        "applicationUrl": "https://www.td.com/ca/en/personal-banking/products/credit-cards/travel-rewards/first-class-travel-visa-infinite-card",
    },
    ("TD Bank", "TD Aeroplan Visa Infinite Card"): {
        "foreign_transaction_fee": 0.025,
        "earning_rates": {"base": 1.0, "groceries": 1.5, "gas": 1.5, "air_canada": 1.5},
        "signup_bonus": {"points": 40000, "spend_requirement": 7500, "months": 12},
        "applicationUrl": "https://www.td.com/ca/en/personal-banking/products/credit-cards/aeroplan/aeroplan-visa-infinite-card",
    },
    ("TD Bank", "TD Cash Back Visa Infinite Card"): {
        "foreign_transaction_fee": 0.025,
        "earning_rates": {"base": 0.5, "groceries": 3.0, "gas": 2.0, "recurring_bills": 1.0},
        "applicationUrl": "https://www.td.com/ca/en/personal-banking/products/credit-cards/cash-back/cash-back-visa-infinite-card",
    },
    ("TD Bank", "TD Aeroplan Visa Infinite Privilege Card"): {
        "foreign_transaction_fee": 0.025,
        "applicationUrl": "https://www.td.com/ca/en/personal-banking/products/credit-cards/aeroplan/aeroplan-visa-infinite-privilege-card",
    },
    ("RBC", "RBC Avion Visa Infinite Card"): {
        "foreign_transaction_fee": 0.025,
        "earning_rates": {"base": 1.0, "travel": 1.25},
        "applicationUrl": "https://www.rbcroyalbank.com/credit-cards/travel/rbc-avion-visa-infinite.html",
    },
    ("RBC", "RBC Avion Visa Infinite Privilege Card"): {
        "foreign_transaction_fee": 0.025,
        "applicationUrl": "https://www.rbcroyalbank.com/credit-cards/travel/rbc-avion-visa-infinite-privilege.html",
    },
    ("RBC", "RBC Cash Back Preferred World Elite Mastercard"): {
        "foreign_transaction_fee": 0.025,
        "applicationUrl": "https://www.rbcroyalbank.com/credit-cards/cash-back/cashback-preferred-world-elite-mastercard.html",
    },
    ("RBC", "RBC WestJet World Elite Mastercard"): {
        "foreign_transaction_fee": 0.025,
        "applicationUrl": "https://www.rbcroyalbank.com/credit-cards/travel/rbc-westjet-world-elite-mastercard.html",
    },
    ("RBC", "RBC ION+ Visa"): {
        "foreign_transaction_fee": 0.025,
        "earning_rates": {"base": 1.0, "groceries": 1.5, "gas": 1.5, "transit": 1.5},
        "applicationUrl": "https://www.rbcroyalbank.com/credit-cards/rewards/rbc-ion-plus-visa.html",
    },
    ("Scotiabank", "Scotiabank Momentum Visa Infinite Card"): {
        "foreign_transaction_fee": 0.025,
        "earning_rates": {"base": 1.0, "groceries": 4.0, "recurring_bills": 4.0, "gas": 2.0, "transit": 2.0},
        "applicationUrl": "https://www.scotiabank.com/ca/en/personal/credit-cards/visa/momentum-infinite-card.html",
    },
    ("Scotiabank", "Scotiabank Gold American Express Card"): {
        "foreign_transaction_fee": 0,
        "earning_rates": {"base": 1.0, "dining": 6.0, "entertainment": 6.0, "groceries": 5.0, "transit": 3.0},
        "signup_bonus": {"points": 45000, "spend_requirement": 7500, "months": 12},
        "applicationUrl": "https://www.scotiabank.com/ca/en/personal/credit-cards/american-express/gold-card.html",
    },
    ("Scotiabank", "Scotiabank Passport Visa Infinite Card"): {
        "foreign_transaction_fee": 0,
        "earning_rates": {"base": 1.0, "groceries": 3.0, "dining": 2.0, "entertainment": 2.0, "transit": 2.0},
        "signup_bonus": {"points": 50000, "spend_requirement": 10000, "months": 6},
        "applicationUrl": "https://www.scotiabank.com/ca/en/personal/credit-cards/visa/passport-infinite-card.html",
    },
    ("CIBC", "CIBC Dividend Visa Infinite Card"): {
        "annual_fee": 120,
        "foreign_transaction_fee": 0.025,
        "applicationUrl": "https://www.cibc.com/en/personal-banking/credit-cards/all-cards/dividend-visa-infinite-card.html",
    },
    ("BMO", "BMO CashBack World Elite Mastercard"): {
        "foreign_transaction_fee": 0.025,
        "earning_rates": {"base": 1.0, "groceries": 5.0, "gas": 4.0, "transit": 4.0, "recurring_bills": 3.0},
        "applicationUrl": "https://www.bmo.com/en-ca/main/personal/credit-cards/bmo-cashback-world-elite-mastercard/",
    },
    ("BMO", "BMO Eclipse Visa Infinite Card"): {
        "foreign_transaction_fee": 0.025,
        "applicationUrl": "https://www.bmo.com/en-ca/main/personal/credit-cards/bmo-eclipse-visa-infinite/",
    },
}

with open(FULL_PATH, "r") as f:
    full_data = json.load(f)

full_changes = []
for card in full_data["cards"]:
    key = (card.get("issuer", ""), card.get("name", ""))
    if key in FULL_FIXES:
        fixes = FULL_FIXES[key]
        for fkey, fval in fixes.items():
            old = card.get(fkey)
            if old != fval:
                full_changes.append(f"  [{card['name']}] {fkey}: {json.dumps(old)[:80]} → {json.dumps(fval)[:80]}")
            card[fkey] = fval
        card["lastVerified"] = VERIFICATION_DATE

with open(FULL_PATH, "w") as f:
    json.dump(full_data, f, indent=2, ensure_ascii=False)

print(f"Updated {FULL_PATH}: {len(full_changes)} changes")

# ============================================================
# Print change summary
# ============================================================
print("\n=== EXTENDED FILE CHANGES ===")
for c in changes_log:
    print(c)

print(f"\n=== FULL FILE CHANGES ===")
for c in full_changes:
    print(c)

print(f"\nTotal verified cards: {len(verified_cards)}")
print(f"Verification date: {VERIFICATION_DATE}")
