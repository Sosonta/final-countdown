import os
import json
import requests

CARDS_JSON_PATH = "cards.json"
YGOPRO_API_URL = "https://db.ygoprodeck.com/api/v7/cardinfo.php"

# Load current cards.json
with open(CARDS_JSON_PATH, "r", encoding="utf-8") as f:
    cards = json.load(f)

# Fetch full data from YGOPRODeck
print("📡 Fetching full card database from YGOPRODeck...")
response = requests.get(YGOPRO_API_URL)
if response.status_code != 200:
    print("❌ Failed to fetch data from YGOPRODeck API.")
    exit(1)

full_data = response.json()["data"]
print(f"✅ Retrieved {len(full_data)} cards from YGOPRODeck API.")

# Index full data by card name (case-insensitive)
api_cards = {card["name"].lower(): card for card in full_data}

enriched = []
missing = []

for entry in cards:
    name_key = entry["name"].lower()
    if name_key not in api_cards:
        missing.append(entry["name"])
        enriched.append(entry)
        continue

    api_card = api_cards[name_key]
    
    # Base metadata
    enriched_card = {
        **entry,
        "type": api_card.get("type"),
        "race": api_card.get("race"),
        "attribute": api_card.get("attribute"),
        "level": api_card.get("level"),
        "atk": api_card.get("atk"),
        "def": api_card.get("def"),
        "desc": api_card.get("desc"),
    }

    # 👉 Add linkval if it's a Link Monster
    if api_card.get("type", "").lower().startswith("link"):
        enriched_card["linkval"] = api_card.get("linkval")

    enriched.append(enriched_card)

# Save enriched cards.json
with open(CARDS_JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(enriched, f, indent=2, ensure_ascii=False)

print(f"\n✅ cards.json updated with full metadata for {len(enriched) - len(missing)} cards.")
if missing:
    print(f"⚠️  {len(missing)} cards could not be matched:\n- " + "\n- ".join(missing[:10]))
