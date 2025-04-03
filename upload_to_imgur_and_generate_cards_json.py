import os
import requests
import json
import time

IMGUR_CLIENT_ID = "eec91617fb1b1a6"  # <-- Replace this with your actual Client ID
INPUT_FOLDER = "card_images"
OUTPUT_JSON = "cards.json"
PROGRESS_FILE = "cards-progress.json"

headers = {"Authorization": f"Client-ID {IMGUR_CLIENT_ID}"}

# Load progress if available
if os.path.exists(PROGRESS_FILE):
    with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
        uploaded_cards = json.load(f)
else:
    uploaded_cards = []

# Track names already uploaded to avoid duplicates
uploaded_names = {card['name'] for card in uploaded_cards}

# Get all image filenames
filenames = [f for f in os.listdir(INPUT_FOLDER) if f.lower().endswith((".jpg", ".png"))]
print(f"Found {len(filenames)} images. Starting/resuming upload to Imgur...\n")

for idx, filename in enumerate(filenames, 1):
    clean_name = filename.split('_', 1)[1].rsplit('.', 1)[0].replace('_', ' ') if '_' in filename else filename

    if clean_name in uploaded_names:
        print(f"[{idx}/{len(filenames)}] Skipping already uploaded: {clean_name}")
        continue

    filepath = os.path.join(INPUT_FOLDER, filename)
    with open(filepath, "rb") as img_file:
        image_data = img_file.read()

    response = requests.post(
        "https://api.imgur.com/3/image",
        headers=headers,
        files={"image": image_data},
    )

    if response.status_code == 200:
        link = response.json()['data']['link']
        uploaded_cards.append({"name": clean_name, "image_url": link})
        uploaded_names.add(clean_name)
        print(f"[{idx}/{len(filenames)}] Uploaded: {clean_name}")

        # Save progress after each upload
        with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
            json.dump(uploaded_cards, f, indent=2, ensure_ascii=False)

    elif response.status_code == 429:
        print(f"\n❌ Rate limit hit on image {clean_name}. Imgur returned 429 Too Many Requests.")
        print("🚫 Upload paused. Please wait a while and rerun the script later.")
        break

    else:
        print(f"[{idx}/{len(filenames)}] Failed to upload: {filename} | Error: {response.status_code}")

    time.sleep(1.5)  # Delay to reduce rate-limiting risk

# Save final version as cards.json
with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(uploaded_cards, f, indent=2, ensure_ascii=False)

print("\n✅ Upload complete (or paused due to rate limits). You can safely rerun this script later.")