#!/bin/bash

# Supabase configuration
SUPABASE_URL="https://zdlozhpmqrtvvhdzbmrv.supabase.co"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbG96aHBtcXJ0dnZoZHpibXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxODYwMTEsImV4cCI6MjA4Mzc2MjAxMX0.o7xqSfwRtvxsPoAe7e0kJzb5TXoFyCzDEQqOWkLNkos"
HEADERS=(-H "apikey: $API_KEY" -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json")
LOG_FILE="DUPLICATE_CLEANUP.md"

# Define duplicate pairs (card names)
declare -a CARDS=(
    "American Express Aeroplan Card"
    "American Express Aeroplan Reserve Card"
    "American Express Cobalt Card"
    "American Express Gold Rewards Card"
    "American Express Green Card"
    "BMO Air Miles World Elite Mastercard"
    "BMO AIR MILES World Elite Mastercard"
    "BMO CashBack Mastercard"
    "Brim Mastercard"
    "Capital One Aspire Cash Platinum Mastercard"
    "CIBC Dividend Visa Card for Students"
    "MBNA True Line Mastercard"
    "Neo Mastercard"
    "PC Financial Mastercard"
    "PC Financial World Elite Mastercard"
    "PC Financial World Mastercard"
    "RBC Cash Back Preferred World Elite Mastercard"
    "Rogers Platinum Mastercard"
)

process_card() {
    local card_name="$1"
    echo "" >> "$LOG_FILE"
    echo "## Processing: $card_name" >> "$LOG_FILE"
    echo "**Time**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    
    # Query all cards with this name
    local cards_json=$(curl -s "${SUPABASE_URL}/rest/v1/cards?select=*&name=eq.${card_name// /%20}" "${HEADERS[@]}")
    local card_count=$(echo "$cards_json" | jq 'length')
    
    echo "Found $card_count card(s) with name: $card_name" >> "$LOG_FILE"
    
    if [ "$card_count" -lt 2 ]; then
        echo "⚠️  Only found $card_count card - skipping" >> "$LOG_FILE"
        return
    fi
    
    # Get IDs and details
    local id1=$(echo "$cards_json" | jq -r '.[0].id')
    local id2=$(echo "$cards_json" | jq -r '.[1].id')
    local updated1=$(echo "$cards_json" | jq -r '.[0].updated_at')
    local updated2=$(echo "$cards_json" | jq -r '.[1].updated_at')
    
    echo "- Card 1: $id1 (updated: $updated1)" >> "$LOG_FILE"
    echo "- Card 2: $id2 (updated: $updated2)" >> "$LOG_FILE"
    
    # Count category_rewards for each
    local count1=$(curl -s "${SUPABASE_URL}/rest/v1/category_rewards?select=*&card_id=eq.$id1" "${HEADERS[@]}" | jq 'length')
    local count2=$(curl -s "${SUPABASE_URL}/rest/v1/category_rewards?select=*&card_id=eq.$id2" "${HEADERS[@]}" | jq 'length')
    
    echo "- Card 1 category_rewards: $count1" >> "$LOG_FILE"
    echo "- Card 2 category_rewards: $count2" >> "$LOG_FILE"
    
    # Determine which to keep
    local keep_id=""
    local delete_id=""
    
    if [ "$count1" -gt "$count2" ]; then
        keep_id="$id1"
        delete_id="$id2"
        echo "**Decision**: Keep Card 1 ($count1 > $count2 category_rewards)" >> "$LOG_FILE"
    elif [ "$count2" -gt "$count1" ]; then
        keep_id="$id2"
        delete_id="$id1"
        echo "**Decision**: Keep Card 2 ($count2 > $count1 category_rewards)" >> "$LOG_FILE"
    else
        # Equal counts - use updated_at
        if [[ "$updated1" > "$updated2" ]]; then
            keep_id="$id1"
            delete_id="$id2"
            echo "**Decision**: Keep Card 1 (equal rewards, newer update: $updated1)" >> "$LOG_FILE"
        else
            keep_id="$id2"
            delete_id="$id1"
            echo "**Decision**: Keep Card 2 (equal rewards, newer update: $updated2)" >> "$LOG_FILE"
        fi
    fi
    
    echo "- Keeping: $keep_id" >> "$LOG_FILE"
    echo "- Deleting: $delete_id" >> "$LOG_FILE"
    
    # Delete category_rewards for duplicate card
    echo "" >> "$LOG_FILE"
    echo "### Deleting category_rewards for $delete_id..." >> "$LOG_FILE"
    local delete_cr_result=$(curl -s -X DELETE "${SUPABASE_URL}/rest/v1/category_rewards?card_id=eq.$delete_id" "${HEADERS[@]}")
    echo "Result: $delete_cr_result" >> "$LOG_FILE"
    
    # Delete the duplicate card
    echo "" >> "$LOG_FILE"
    echo "### Deleting card $delete_id..." >> "$LOG_FILE"
    local delete_card_result=$(curl -s -X DELETE "${SUPABASE_URL}/rest/v1/cards?id=eq.$delete_id" "${HEADERS[@]}")
    echo "Result: $delete_card_result" >> "$LOG_FILE"
    
    echo "" >> "$LOG_FILE"
    echo "✅ Completed processing for: $card_name" >> "$LOG_FILE"
    echo "---" >> "$LOG_FILE"
}

# Process each unique card
for card_name in "${CARDS[@]}"; do
    process_card "$card_name"
    sleep 0.5  # Be nice to the API
done

echo "" >> "$LOG_FILE"
echo "## Summary" >> "$LOG_FILE"
echo "Cleanup completed at $(date -u +"%Y-%m-%d %H:%M:%S UTC")" >> "$LOG_FILE"
