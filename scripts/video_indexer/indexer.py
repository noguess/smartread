import os
import json
import glob
from collections import defaultdict
from text_processor import TextProcessor
from asr_engine import ASREngine

# Configuration
VIDEO_DIR = "public/videos"
OUTPUT_DIR = "public/data"
EXTENSIONS = ["*.mp4", "*.mkv", "*.mov", "*.mp3"]

def scan_videos(directory):
    """Scan directory for video files. READ-ONLY operation."""
    files = []
    for ext in EXTENSIONS:
        files.extend(glob.glob(os.path.join(directory, "**", ext), recursive=True))
    return files

def get_context(all_words, current_index, window=5):
    """Extract context window around current word."""
    start = max(0, current_index - window)
    end = min(len(all_words), current_index + window + 1)
    return " ".join([w['word'] for w in all_words[start:end]])

def main():
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Initialize engines
    processor = TextProcessor()
    asr = ASREngine(model_size="tiny")  # Use tiny for dev speed

    # 1. Scan videos and build map (READ-ONLY)
    video_files = scan_videos(VIDEO_DIR)
    video_map = {i: f.replace("public/", "") for i, f in enumerate(video_files)}
    
    # Save video map
    with open(os.path.join(OUTPUT_DIR, "video_map.json"), "w") as f:
        json.dump(video_map, f, indent=2)
    print(f"Saved video_map.json with {len(video_map)} videos.")
    print(f"NOTE: Original video files in {VIDEO_DIR} remain UNTOUCHED.")

    # 2. Process videos (NON-DESTRUCTIVE: only reads videos, writes temp audio)
    global_index = defaultdict(list)
    total_words_count = 0

    for vid_id, video_path in enumerate(video_files):
        try:
            print(f"Processing [{vid_id}] {video_path}...")
            words = asr.transcribe(video_path)  # Temporary audio extracted and deleted
            
            for i, word_obj in enumerate(words):
                raw_word = word_obj['word']
                lemma = processor.lemmatize(raw_word)
                
                if lemma:
                    context = get_context(words, i)
                    # V1.2 Structure: {"v": vid_id, "t": [start, end], "c": context}
                    entry = {
                        "v": vid_id,
                        "t": [round(word_obj['start'], 2), round(word_obj['end'], 2)],
                        "c": context
                    }
                    global_index[lemma].append(entry)
                    total_words_count += 1
                    
        except Exception as e:
            print(f"Error processing {video_path}: {e}")
            # Continue with other videos

    # 3. Shard and Save Index
    print("Sharding and saving index...")
    shards = defaultdict(dict)
    for lemma, entries in global_index.items():
        first_char = lemma[0] if lemma[0].isalpha() else "others"
        shards[first_char][lemma] = entries

    for char, data in shards.items():
        filename = f"index_{char}.json"
        with open(os.path.join(OUTPUT_DIR, filename), "w") as f:
            json.dump(data, f)  # Minified
        print(f"Saved {filename}")

    # 4. Save Metadata
    metadata = {
        "generated_at": 0,  # TODO: Add timestamp
        "total_videos": len(video_files),
        "total_words": total_words_count,
        "sharding_type": "alphabet",
        "version": "1.2"
    }
    with open(os.path.join(OUTPUT_DIR, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
    
    print("\n=== Processing Complete ===")
    print(f"✓ {len(video_files)} videos analyzed")
    print(f"✓ {total_words_count} words indexed")
    print(f"✓ Original videos: UNCHANGED")
    print(f"✓ Output: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
