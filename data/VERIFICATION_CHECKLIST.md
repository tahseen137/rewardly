# Database Verification Checklist

**Pre-Import Verification** ✅

Run these commands to verify database integrity before importing:

## 1. File Integrity

```bash
cd /Users/clawdbot/.openclaw/workspace/rewardly/data

# Verify all files exist
ls -lh credit-cards-full.json
ls -lh credit-cards-import.sql
ls -lh build_card_database.py
ls -lh generate_sql_import.py

# Expected output: All files present
```

## 2. JSON Validation

```bash
# Validate JSON syntax
python3 -m json.tool credit-cards-full.json > /dev/null && echo "✅ JSON Valid" || echo "❌ JSON Invalid"

# Check card count
cat credit-cards-full.json | python3 -c "import json, sys; data=json.load(sys.stdin); print(f'Total cards: {data[\"metadata\"][\"total_cards\"]}')"

# Expected output: Total cards: 203
```

## 3. Data Completeness

```bash
# Verify all cards have required fields
python3 << 'EOFPY'
import json

with open('credit-cards-full.json', 'r') as f:
    data = json.load(f)

required_fields = ['name', 'issuer', 'country', 'currency', 'reward_program', 
                   'point_value_cad', 'annual_fee', 'earning_rates']

missing = []
for i, card in enumerate(data['cards']):
    for field in required_fields:
        if field not in card:
            missing.append(f"Card {i}: Missing {field}")

if missing:
    print("❌ Missing fields found:")
    for m in missing:
        print(f"  {m}")
else:
    print(f"✅ All {len(data['cards'])} cards have required fields")
EOFPY
```

## 4. SQL File Validation

```bash
# Check SQL file size (should be ~295KB)
ls -lh credit-cards-import.sql | awk '{print "SQL file size:", $5}'

# Count INSERT statements (should match card count)
grep -c "INSERT INTO cards" credit-cards-import.sql
# Expected: 203

# Verify no syntax errors (basic check)
grep -c "BEGIN;" credit-cards-import.sql
grep -c "COMMIT;" credit-cards-import.sql
# Expected: 1 each
```

## 5. Data Quality Spot Check

```bash
# Show 3 random cards for manual verification
python3 << 'EOFPY'
import json
import random

with open('credit-cards-full.json', 'r') as f:
    data = json.load(f)

sample = random.sample(data['cards'], 3)
for card in sample:
    print(f"\n✅ {card['name']}")
    print(f"   Issuer: {card['issuer']}")
    print(f"   Country: {card['country']}")
    print(f"   Annual Fee: ${card['annual_fee']}")
    print(f"   Base Rate: {card['earning_rates']['base']}x")
    if 'signup_bonus' in card:
        print(f"   Bonus: {card['signup_bonus'].get('points', 'N/A')} points")
EOFPY
```

## 6. Coverage Verification

```bash
# Count by country
python3 << 'EOFPY'
import json
from collections import Counter

with open('credit-cards-full.json', 'r') as f:
    data = json.load(f)

countries = Counter(c['country'] for c in data['cards'])
print("Cards by country:")
for country, count in countries.items():
    print(f"  {country}: {count}")

categories = Counter(c.get('category', 'other') for c in data['cards'])
print("\nCards by category:")
for cat, count in sorted(categories.items()):
    print(f"  {cat}: {count}")
EOFPY
```

## 7. Import Readiness

```bash
# Generate fresh SQL file
python3 generate_sql_import.py

# Verify output
echo "✅ SQL file generated: credit-cards-import.sql"
ls -lh credit-cards-import.sql
```

---

## Post-Import Verification

After importing to Supabase, run these queries:

```sql
-- 1. Check total card count
SELECT COUNT(*) AS total_cards FROM cards;
-- Expected: 203

-- 2. Verify category rewards
SELECT COUNT(*) AS total_rewards FROM category_rewards;
-- Expected: 400+ (varies by card)

-- 3. Check signup bonuses
SELECT COUNT(*) AS total_bonuses FROM signup_bonuses;
-- Expected: 150+ (not all cards have bonuses)

-- 4. Verify by country
SELECT country, COUNT(*) AS card_count 
FROM cards 
GROUP BY country 
ORDER BY country;
-- Expected: CA: 86, US: 117

-- 5. Sample cards by issuer
SELECT issuer, COUNT(*) AS card_count 
FROM cards 
GROUP BY issuer 
ORDER BY card_count DESC 
LIMIT 10;
-- Should see major banks at top

-- 6. Check for nulls in critical fields
SELECT COUNT(*) AS cards_with_nulls 
FROM cards 
WHERE name IS NULL 
   OR issuer IS NULL 
   OR annual_fee IS NULL;
-- Expected: 0

-- 7. Verify point valuations
SELECT reward_program, AVG(point_valuation) AS avg_value 
FROM cards 
GROUP BY reward_program 
ORDER BY avg_value DESC 
LIMIT 10;
-- Check values are reasonable (0.5-2.5 range mostly)

-- 8. Test Sage AI query simulation
SELECT c.name, c.issuer, c.annual_fee, cr.category, cr.multiplier
FROM cards c
LEFT JOIN category_rewards cr ON c.id = cr.card_id
WHERE cr.category = 'travel'
  AND cr.multiplier >= 2.0
ORDER BY cr.multiplier DESC
LIMIT 10;
-- Should return premium travel cards
```

---

## Sign-Off Checklist

Before marking complete:

- [ ] ✅ All 9 files present in `/data/` directory
- [ ] ✅ JSON validates and contains 203 cards
- [ ] ✅ SQL file generated successfully
- [ ] ✅ No missing required fields
- [ ] ✅ Country distribution correct (86 CA, 117 US)
- [ ] ✅ Category distribution reasonable
- [ ] ✅ Spot-check of 20 cards passes manual review
- [ ] ✅ Documentation complete and readable
- [ ] ✅ Import instructions clear
- [ ] ✅ Maintenance schedule documented

---

**Once all checkboxes are ✅, database is ready for production import!**

*Last updated: 2026-02-12 7:55 PM EST*
