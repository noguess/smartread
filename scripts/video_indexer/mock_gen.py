import os
import json
import csv
import random
import time
from collections import defaultdict

# Configuration
CSV_PATH = "public/cihuibiao/zkgaopinci666.csv"
OUTPUT_DIR = "public/data"
NUM_MOCK_VIDEOS = 2  # Simulating 2 mock videos

def read_words_from_csv(csv_path):
    """
    Read words from zkgaopinci666.csv.
    Returns a list of word spellings.
    """
    words = []
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader)  # Skip header row
            for row in reader:
                if len(row) >= 2:
                    word = row[1].strip().lower()  # Column 2: word spelling
                    if word:
                        words.append(word)
        print(f"✓ Read {len(words)} words from {csv_path}")
        return words
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return []

def generate_mock_entry(word, video_id):
    """
    Generate a mock video entry for a word.
    Returns a V2.0 compliant entry: {"v": video_id, "t": start_time, "c": "context"}
    """
    # Generate random timestamp between 0-300 seconds
    start_time = round(random.uniform(0, 290), 1)
    
    # Generate simple context sentence with the word
    contexts = [
        f"this is a simple sentence with {word}",
        f"you can learn {word} from this example",
        f"the word {word} is very useful",
        f"let's practice using {word} in context",
        f"here we see {word} in a sentence"
    ]
    context = random.choice(contexts)
    
    return {
        "v": video_id,
        "t": start_time,  # V2.0: Single timestamp (seconds)
        "c": context
    }

def main():
    """
    Generate mock video index data for all 666 words from CSV.
    Creates alphabet-sharded index files.
    """
    print("=" * 60)
    print("Mock Video Index Generator V2.0 (Bilibili Edition)")
    print("=" * 60)
    
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Read words from CSV
    words = read_words_from_csv(CSV_PATH)
    if not words:
        print("Error: No words found. Exiting.")
        return
    
    # Generate video map (V2.0: BVIDs)
    # Using some real TED talk BVIDs for realism, though they might not match the words.
    video_map = {
        "0": {
            "bvid": "BV1Nb411v7XU",
            "p": 1,
            "title": "TED演讲：如何通过练习学习英语"
        },
        "1": {
            "bvid": "BV1Nb411v7XU",  # Same video, different page
            "p": 2,
            "title": "TED演讲：词汇量拓展训练"
        }
    }
    
    with open(os.path.join(OUTPUT_DIR, "video_map.json"), "w") as f:
        json.dump(video_map, f, indent=2)
    print(f"✓ Generated video_map.json with {len(video_map)} mock videos")
    
    # Generate indexes grouped by first letter
    print("\n" + "=" * 60)
    print("Generating word indexes...")
    print("=" * 60)
    
    sharded_index = defaultdict(dict)
    total_entries = 0
    
    for word in words:
        # Determine shard (first letter)
        first_char = word[0] if word and word[0].isalpha() else 'others'
        first_char = first_char.lower()
        
        # Generate 1-2 mock entries per word
        num_entries = random.randint(1, 2)
        entries = []
        
        for _ in range(num_entries):
            video_id = str(random.randint(0, NUM_MOCK_VIDEOS - 1))
            entry = generate_mock_entry(word, video_id)
            entries.append(entry)
            total_entries += 1
        
        # Add to sharded index
        sharded_index[first_char][word] = entries
    
    # Save sharded index files
    saved_files = []
    for char, word_dict in sorted(sharded_index.items()):
        filename = f"index_{char}.json"
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        with open(filepath, "w") as f:
            json.dump(word_dict, f)  # Compact format (no indent for production)
        
        saved_files.append(filename)
        print(f"✓ Saved {filename} ({len(word_dict)} words)")
    
    # Generate metadata
    metadata = {
        "generated_at": int(time.time()),
        "total_videos": NUM_MOCK_VIDEOS,
        "total_words": len(words),
        "total_entries": total_entries,
        "sharding_type": "alphabet",
        "version": "2.0",
        "shard_count": len(sharded_index)
    }
    
    with open(os.path.join(OUTPUT_DIR, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"✓ Saved metadata.json")
    
    # Summary
    print("\n" + "=" * 60)
    print("Generation Complete!")
    print("=" * 60)
    print(f"✓ Total words indexed: {len(words)}")
    print(f"✓ Total video entries: {total_entries}")
    print(f"✓ Index files created: {len(saved_files)}")
    print(f"✓ Shards: {', '.join(sorted(sharded_index.keys()))}")
    print(f"✓ Output directory: {OUTPUT_DIR}")
    print("\nNote: These are MOCK indexes for frontend testing.")
    print("Video files do not actually exist - fallback UI will be shown.")
    print("=" * 60)

if __name__ == "__main__":
    main()
