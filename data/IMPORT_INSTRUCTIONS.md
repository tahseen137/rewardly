# Credit Card Database - Import Instructions

**Database File:** `/Users/clawdbot/.openclaw/workspace/rewardly/data/credit-cards-full.json`
**Total Cards:** 203 (86 Canadian, 117 US)
**Generated:** 2026-02-12

---

## Database Structure

The JSON file contains:
- **Metadata**: Generation info, sources, data quality notes
- **Cards Array**: 203 credit card objects with complete details

### Card Object Schema

Each card includes:
```json
{
  "name": "Card Name",
  "issuer": "Bank Name",
  "country": "CA" | "US",
  "currency": "CAD" | "USD",
  "card_type": "personal" | "business",
  "category": "travel" | "cashback" | "rewards" | etc.,
  "reward_program": "Program Name",
  "point_value_cad": 2.0,
  "point_value_usd": 1.48,
  "annual_fee": 139.0,
  "foreign_transaction_fee": 0.025,
  "earning_rates": {
    "base": 1.0,
    "travel": 1.5,
    "groceries": 1.5,
    ...
  },
  "signup_bonus": {
    "points": 50000,
    "spend_requirement": 3000,
    "months": 3
  }
}
```

---

## Import to Supabase

### Option 1: Python Script (Recommended)

```python
import json
import os
from supabase import create_client

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)

# Load data
with open('credit-cards-full.json', 'r') as f:
    data = json.load(f)

# Import cards
for card in data['cards']:
    # Map to Supabase schema
    card_data = {
        "card_key": card['name'].lower().replace(' ', '-').replace("'", ""),
        "name": card['name'],
        "issuer": card['issuer'],
        "reward_program": card['reward_program'],
        "reward_currency": "points" if "points" in card['reward_program'].lower() else "miles",
        "point_valuation": card['point_value_cad'],
        "annual_fee": card['annual_fee'],
        "base_reward_rate": card['earning_rates']['base'],
        "country": card['country'],
        "currency": card['currency'],
        "is_active": True
    }
    
    # Insert card
    result = supabase.table('cards').insert(card_data).execute()
    card_id = result.data[0]['id']
    
    # Insert category rewards
    for category, multiplier in card['earning_rates'].items():
        if category != 'base':
            reward_data = {
                "card_id": card_id,
                "category": category,
                "multiplier": multiplier,
                "reward_unit": "multiplier",
                "description": f"{multiplier}x on {category}"
            }
            supabase.table('category_rewards').insert(reward_data).execute()
    
    # Insert signup bonus
    if 'signup_bonus' in card:
        bonus_data = {
            "card_id": card_id,
            "bonus_amount": card['signup_bonus']['points'],
            "bonus_currency": "points",
            "spend_requirement": card['signup_bonus']['spend_requirement'],
            "timeframe_days": card['signup_bonus']['months'] * 30,
            "is_active": True
        }
        supabase.table('signup_bonuses').insert(bonus_data).execute()
    
    print(f"✅ Imported: {card['name']}")

print(f"\n🎉 Import complete! {len(data['cards'])} cards imported.")
```

### Option 2: SQL Script Generator

Run this to generate SQL insert statements:

```bash
python3 generate_sql_import.py
```

This will create `credit-cards-import.sql` ready for Supabase SQL editor.

### Option 3: Direct Supabase API

Use the Supabase REST API or client library to bulk insert the JSON data.

---

## Data Quality Checklist

Before importing:
- [x] All 203 cards have required fields (name, issuer, annual_fee, etc.)
- [x] Point valuations verified against TPG and Reddit consensus
- [x] Earning rates include base + bonus categories
- [x] Signup bonuses current as of Feb 2026
- [x] Foreign transaction fees default to 2.5% unless waived

After importing:
- [ ] Verify card count in Supabase matches (203 cards)
- [ ] Spot-check 20 random cards for accuracy
- [ ] Ensure category_rewards table populated correctly
- [ ] Confirm signup_bonuses linked to cards
- [ ] Test Sage AI queries with new cards

---

## Maintenance

**Monthly Tasks:**
- Update signup bonuses (change frequently)
- Verify annual fees (rare changes)
- Check for new card launches

**Quarterly Tasks:**
- Update point valuations (community consensus)
- Review earning rates for limited-time promos
- Add newly launched cards

**Annually:**
- Comprehensive review of all card data
- Remove discontinued cards
- Update issuer information if banks merge/rebrand

---

## Quick Stats

- **Total Cards:** 203
- **Canadian:** 86 (42.4%)
- **US:** 117 (57.6%)
- **Personal:** 174 (85.7%)
- **Business:** 29 (14.3%)

**By Category:**
- Travel: 105 (51.7%)
- Cashback: 57 (28.1%)
- Co-branded: 14 (6.9%)
- Student: 11 (5.4%)
- Store: 4 (2.0%)
- Low-interest: 6 (3.0%)
- Rewards: 3 (1.5%)
- Secured: 3 (1.5%)

**Coverage:**
- Major Canadian banks: 100% (TD, RBC, CIBC, BMO, Scotiabank)
- Major US banks: 100% (Chase, Amex, Citi, Capital One, BoA, Wells Fargo)
- Credit unions: ~70%
- Co-branded cards: 14 major retailers/airlines
- Premium cards: All major premium travel cards included

---

## Contact & Questions

For questions about data sources, accuracy, or import process:
- Check `DATA_SOURCES.md` for citation details
- Review `GAP_ANALYSIS.md` for known limitations
- File issues in project tracker

---

**Ready to import? Run the Python script or SQL generator above.**
