#!/usr/bin/env python3
"""
SQL Import Generator for Credit Card Database
Generates Supabase-compatible SQL INSERT statements
"""

import json
from datetime import datetime

def escape_sql(text):
    """Escape single quotes for SQL"""
    if text is None:
        return 'NULL'
    return str(text).replace("'", "''")

def generate_sql_imports(json_file, output_file):
    """Generate SQL import statements"""
    
    with open(json_file, 'r') as f:
        data = json.load(f)
    
    cards = data['cards']
    
    sql_statements = []
    
    # Header
    sql_statements.append("-- ====================================================================")
    sql_statements.append("-- Credit Card Database Import")
    sql_statements.append(f"-- Generated: {datetime.now().isoformat()}")
    sql_statements.append(f"-- Total Cards: {len(cards)}")
    sql_statements.append("-- ====================================================================\n")
    
    sql_statements.append("-- Start transaction")
    sql_statements.append("BEGIN;\n")
    
    # Clear existing data (optional - comment out if appending)
    sql_statements.append("-- Clear existing data (optional)")
    sql_statements.append("-- TRUNCATE TABLE signup_bonuses CASCADE;")
    sql_statements.append("-- TRUNCATE TABLE category_rewards CASCADE;")
    sql_statements.append("-- TRUNCATE TABLE cards CASCADE;\n")
    
    # Generate card inserts
    for i, card in enumerate(cards, 1):
        card_key = card['name'].lower().replace(' ', '-').replace("'", "").replace("®", "").replace("™", "")
        
        # Determine reward currency type
        reward_program = card['reward_program']
        if 'mile' in reward_program.lower() or 'aeroplan' in reward_program.lower():
            reward_currency = 'airline_miles'
        elif 'hotel' in reward_program.lower() or 'marriott' in reward_program.lower() or 'hilton' in reward_program.lower():
            reward_currency = 'hotel_points'
        elif 'cashback' in reward_program.lower() or 'cash' in reward_program.lower():
            reward_currency = 'cashback'
        else:
            reward_currency = 'points'
        
        # Card insert
        sql_statements.append(f"-- Card {i}/{len(cards)}: {card['name']}")
        sql_statements.append("INSERT INTO cards (")
        sql_statements.append("  card_key, name, issuer, reward_program, reward_currency,")
        sql_statements.append("  point_valuation, annual_fee, base_reward_rate, base_reward_unit,")
        sql_statements.append("  is_active, created_at, updated_at")
        sql_statements.append(") VALUES (")
        sql_statements.append(f"  '{escape_sql(card_key)}',")
        sql_statements.append(f"  '{escape_sql(card['name'])}',")
        sql_statements.append(f"  '{escape_sql(card['issuer'])}',")
        sql_statements.append(f"  '{escape_sql(reward_program)}',")
        sql_statements.append(f"  '{reward_currency}',")
        sql_statements.append(f"  {card['point_value_cad']},")
        sql_statements.append(f"  {card['annual_fee']},")
        sql_statements.append(f"  {card['earning_rates']['base']},")
        sql_statements.append(f"  'multiplier',")
        sql_statements.append(f"  true,")
        sql_statements.append(f"  NOW(),")
        sql_statements.append(f"  NOW()")
        sql_statements.append(f") RETURNING id;  -- Store this as card_{i}_id\n")
        
        # Category rewards
        for category, multiplier in card['earning_rates'].items():
            if category != 'base':
                sql_statements.append(f"-- Category reward: {category} ({multiplier}x)")
                sql_statements.append("INSERT INTO category_rewards (")
                sql_statements.append("  card_id, category, multiplier, reward_unit, description,")
                sql_statements.append("  has_spend_limit, created_at, updated_at")
                sql_statements.append(") VALUES (")
                sql_statements.append(f"  (SELECT id FROM cards WHERE card_key = '{escape_sql(card_key)}'),")
                sql_statements.append(f"  '{escape_sql(category)}',")
                sql_statements.append(f"  {multiplier},")
                sql_statements.append(f"  'multiplier',")
                sql_statements.append(f"  '{multiplier}x points on {category}',")
                sql_statements.append(f"  false,")
                sql_statements.append(f"  NOW(),")
                sql_statements.append(f"  NOW()")
                sql_statements.append(");\n")
        
        # Signup bonus
        if 'signup_bonus' in card and card['signup_bonus']:
            bonus = card['signup_bonus']
            if bonus.get('points'):
                months = bonus.get('months') or 3
                timeframe_days = months * 30 if months else 90
                spend_req = bonus.get('spend_requirement') or 0
                
                sql_statements.append(f"-- Signup bonus: {bonus['points']} points")
                sql_statements.append("INSERT INTO signup_bonuses (")
                sql_statements.append("  card_id, bonus_amount, bonus_currency,")
                sql_statements.append("  spend_requirement, timeframe_days, is_active")
                sql_statements.append(") VALUES (")
                sql_statements.append(f"  (SELECT id FROM cards WHERE card_key = '{escape_sql(card_key)}'),")
                sql_statements.append(f"  {bonus['points']},")
                sql_statements.append(f"  '{reward_currency}',")
                sql_statements.append(f"  {spend_req},")
                sql_statements.append(f"  {timeframe_days},")
                sql_statements.append(f"  true")
                sql_statements.append(");\n")
        
        sql_statements.append("")  # Blank line between cards
    
    # Footer
    sql_statements.append("-- Commit transaction")
    sql_statements.append("COMMIT;\n")
    
    sql_statements.append("-- ====================================================================")
    sql_statements.append(f"-- Import complete: {len(cards)} cards")
    sql_statements.append("-- ====================================================================")
    
    # Write to file
    sql_content = '\n'.join(sql_statements)
    with open(output_file, 'w') as f:
        f.write(sql_content)
    
    print(f"✅ SQL import file generated!")
    print(f"📁 File: {output_file}")
    print(f"📊 Cards: {len(cards)}")
    print(f"💾 Size: {len(sql_content)} bytes")
    print(f"\n🚀 To import:")
    print(f"   1. Open Supabase SQL Editor")
    print(f"   2. Copy/paste contents of {output_file}")
    print(f"   3. Execute query")
    print(f"   4. Verify {len(cards)} cards imported")

if __name__ == "__main__":
    generate_sql_imports(
        "/Users/clawdbot/.openclaw/workspace/rewardly/data/credit-cards-full.json",
        "/Users/clawdbot/.openclaw/workspace/rewardly/data/credit-cards-import.sql"
    )
