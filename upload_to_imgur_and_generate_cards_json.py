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

idx = 0
while idx < len(filenames):
    filename = filenames[idx]
    clean_name = filename.split('_', 1)[1].rsplit('.', 1)[0].replace('_', ' ') if '_' in filename else filename

    if clean_name in uploaded_names:
        print(f"[{idx + 1}/{len(filenames)}] Skipping already uploaded: {clean_name}")
        idx += 1
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
        print(f"[{idx + 1}/{len(filenames)}] Uploaded: {clean_name}")

    elif response.status_code == 429:
        print(f"\n❌ Rate limit hit on image {clean_name}. Imgur returned 429 Too Many Requests.")
        print("⏳ Waiting 1 hour before retrying...")
        time.sleep(3600)  # wait 1 hour and retry the same image
        continue  # retry same image after cooldown

    else:
        print(f"[{idx + 1}/{len(filenames)}] Failed to upload: {filename} | Error: {response.status_code}")

    # Save progress after each attempt (success or fail)
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(uploaded_cards, f, indent=2, ensure_ascii=False)

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(uploaded_cards, f, indent=2, ensure_ascii=False)

    idx += 1
    time.sleep(1.5)  # Delay to reduce rate-limiting risk

print("\n✅ Upload complete or continuing with wait cycles. You can stop and restart this script any time.")
