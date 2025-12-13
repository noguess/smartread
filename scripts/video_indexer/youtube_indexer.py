import os
import json
import subprocess
import re
import time
import argparse
import glob
from collections import defaultdict
from fast_asr_engine import ASREngine

# Import shared logic including STOP_WORDS
from indexer_shared import (
    STOP_WORDS, TextProcessor, get_transcription_cache_path,
    save_transcription_cache, load_transcription_cache,
    deduplicate_occurrences, smart_filter_taught_words
)

try:
    from tqdm import tqdm
    HAS_TQDM = True
except ImportError:
    HAS_TQDM = False
    print("Tip: Install tqdm for progress bars: pip install tqdm")

# Configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "public", "data")
TEMP_DIR = os.path.join(SCRIPT_DIR, "temp_downloads_youtube")

# Default Test URLs
URL_LIST = [
    # "https://www.youtube.com/watch?v=dQw4w9WgXcQ", 
]

def download_audio_youtube(url, output_dir, max_retries=3):
    """
    Download YouTube video audio using yt-dlp.
    
    Args:
        url: Video URL
        output_dir: Directory to save downloads
        max_retries: Retry attempts
        
    Returns:
        dict: {"success": bool, "error": str, "title": str, "filename": str, "id": str}
    """
    print(f"\n📥 Downloading video for {url}...")
    
    # Ensure output dir exists
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Get video info(s)
    # yt-dlp --dump-json returns one JSON object per line for playlists
    video_infos = []
    
    try:
        # Get JSON info
        info_cmd = [
            'yt-dlp', 
            '--dump-json', 
            # '--no-playlist', # Allow playlist
            '--flat-playlist', # Get metadata efficiently first
            url
        ]
        result = subprocess.run(info_cmd, capture_output=True, text=True, check=True, timeout=60)
        
        # Parse output (one JSON per line)
        for line in result.stdout.strip().split('\n'):
            if line.strip():
                try:
                    info = json.loads(line)
                    video_infos.append({
                        "id": info.get('id'),
                        "title": info.get('title', 'Unknown Title'),
                        "url": info.get('url') or info.get('webpage_url') or f"https://www.youtube.com/watch?v={info.get('id')}"
                    })
                except json.JSONDecodeError:
                    continue
                    
        print(f"  📺 Found {len(video_infos)} video(s)")
        
    except Exception as e:
        print(f"  ⚠️  Warning: Could not get video info: {e}")
        # Try to extract ID from URL regex as fallback
        match = re.search(r'(?:v=|\/)([0-9A-Za-z_-]{11}).*', url)
        if match:
            video_infos.append({
                "id": match.group(1),
                "title": "Unknown Title",
                "url": url
            })

    results = []
    
    # 2. Download loop for each video
    for v_info in video_infos:
        video_id = v_info['id']
        title = v_info['title']
        video_url = v_info['url']
        
        if not video_id: 
            continue
            
        print(f"  Processing: {title} ({video_id})")
        
        # Output filename template
        output_template = os.path.join(output_dir, f"{video_id}.%(ext)s")
        expected_file = os.path.join(output_dir, f"{video_id}.wav")
        
        # Check if already exists
        if os.path.exists(expected_file):
             print(f"  ✅ Already exists: {expected_file}")
             results.append({
                "success": True, 
                "error": None, 
                "title": title, 
                "id": video_id,
                "filename": f"{video_id}.wav",
                "path": expected_file
            })
             continue

        success = False
        for attempt in range(1, max_retries + 1):
            try:
                if attempt > 1:
                    print(f"  🔄 Retry attempt {attempt}/{max_retries}...")
                    time.sleep(5)
    
                cmd = [
                    'yt-dlp',
                    '-f', 'ba', 
                    '-x', 
                    '--audio-format', 'wav', 
                    '--audio-quality', '0',
                    '--no-playlist', # Download ONE specific video at a time (since we are iterating ids)
                    '-o', output_template,
                    f"https://www.youtube.com/watch?v={video_id}" # Force single video URL
                ]
                
                subprocess.run(cmd, check=True)
                
                if os.path.exists(expected_file):
                    print(f"  ✅ Download complete: {expected_file}")
                    results.append({
                        "success": True, 
                        "error": None, 
                        "title": title, 
                        "id": video_id,
                        "filename": f"{video_id}.wav",
                        "path": expected_file
                    })
                    success = True
                    break
                else:
                    raise Exception("Output file not found")
                    
            except Exception as e:
                error_msg = str(e)
                print(f"  ⚠️  Error: {error_msg}")
        
        if not success:
             print(f"  ❌ Failed to download {video_id}")
             # We don't fail the whole batch, just this one
             
    return results

def main():
    parser = argparse.ArgumentParser(description='YouTube Video Indexer')
    parser.add_argument('--urls', nargs='+', help='List of YouTube URLs')
    parser.add_argument('--skip-download', action='store_true', help='Skip download phase')
    parser.add_argument('--min-score', type=int, default=5, help='Minimum score to keep a word (default: 5)')
    parser.add_argument('--incremental', action='store_true', help='Merge with existing index instead of overwriting')
    args = parser.parse_args()
    
    urls = args.urls or URL_LIST
    
    if not urls:
        print("❌ Error: No URLs provided. Use --urls")
        return

    # Ensure directories
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(TEMP_DIR, exist_ok=True)
    
    # 1. Download
    downloaded_files = []
    
    if not args.skip_download:
        for url in urls:
            results = download_audio_youtube(url, TEMP_DIR)
            downloaded_files.extend(results)
    else:
        # Scan dir for wavs if skipping download
        for f in os.listdir(TEMP_DIR):
            if f.endswith('.wav'):
                vid = os.path.splitext(f)[0]
                downloaded_files.append({
                    "success": True,
                    "title": f"Existing {vid}",
                    "id": vid,
                    "filename": f,
                    "path": os.path.join(TEMP_DIR, f)
                })

    # 2. Transcribe & Index
    print("\n" + "="*60)
    print("Processing Videos...")
    print("="*60)
    
    processor = TextProcessor()
    asr = None # Lazy load
    
    global_index = defaultdict(list)
    video_map = {}
    
    # Incremental Mode: Load existing data
    loaded_lemmas = set()
    if args.incremental:
        print("\n[Incremental Mode] Loading existing index...")
        
        # Load video map
        vmap_path = os.path.join(OUTPUT_DIR, "video_map_youtube.json")
        if os.path.exists(vmap_path):
            try:
                with open(vmap_path, 'r', encoding='utf-8') as f:
                    existing_map = json.load(f)
                    video_map.update(existing_map)
                print(f"  ✅ Loaded video map ({len(video_map)} videos)")
            except Exception as e:
                print(f"  ⚠️  Failed to load existing video map: {e}")
        
        # Load shards
        shard_files = glob.glob(os.path.join(OUTPUT_DIR, "index_youtube_*.json"))
        loaded_words = 0
        for sf in shard_files:
            try:
                with open(sf, 'r', encoding='utf-8') as f:
                    shard_data = json.load(f)
                    for lemma, entries in shard_data.items():
                        global_index[lemma].extend(entries)
                        loaded_lemmas.add(lemma)
                        loaded_words += 1
            except Exception as e:
                print(f"  ⚠️  Failed to load shard {sf}: {e}")
                
        print(f"  ✅ Loaded {loaded_words} words from existing shards")

    
    for idx, item in enumerate(downloaded_files):
        video_id = item['id'] # YouTube ID is the ID
        file_path = item['path']
        title = item['title']
        
        print(f"\nProcessing [{idx+1}/{len(downloaded_files)}] {title} ({video_id})")

        # INCREMENTAL CHECK:
        # If video is already in index, skip to prevent duplication
        if args.incremental and video_id in video_map:
            print(f"  ⏭️  Skipping (already indexed)")
            continue
        
        video_map[video_id] = {
            "bvid": video_id, # Use youtube ID as 'bvid' field for compatibility
            "title": title,
            "filename": item['filename'],
            "page": 1,
            "platform": "youtube"
        }
        
        # Check Cache
        cache_path = get_transcription_cache_path(file_path)
        cached_data = load_transcription_cache(cache_path)
        
        words = []
        if cached_data:
            print("  ✅ Found cached transcription")
            words = cached_data['words']
            # Update title from cache if available
            if 'info' in cached_data and 'title' in cached_data['info']:
                 video_map[video_id]['title'] = cached_data['info']['title']
        else:
            if asr is None:
                print("  🤖 Loading Whisper...")
                asr = ASREngine(model_size="medium")
            
            print("  🗣️  Transcribing...")
            words = asr.transcribe(file_path)
            save_transcription_cache(cache_path, words, {"title": title})
            
        # Indexing
        print(f"  📚 Indexing {len(words)} words...")
        for i, word_obj in enumerate(words):
            raw_text = word_obj['word']
            potential_words = re.findall(r'[a-zA-Z]+(?:-[a-zA-Z]+)*', raw_text)
            
            for raw_word in potential_words:
                lemma = processor.lemmatize(raw_word)
                if lemma and lemma not in STOP_WORDS and len(lemma) > 1:
                     context = " ".join([w['word'] for w in words[max(0, i-5):min(len(words), i+6)]])
                     global_index[lemma].append({
                         "v": video_id,
                         "t": round(word_obj['start'], 1),
                         "c": context
                     })

    # 3. Save Data (Isolated)
    print("\n" + "="*60)
    print("Saving YouTube Data...")
    
    # Filter taught words
    print(f"  Filtering words with min_score={args.min_score}...")
    taught_index = smart_filter_taught_words(
        global_index, 
        min_score=args.min_score,
        whitelist=loaded_lemmas if args.incremental else None
    )
    
    # Save video_map
    with open(os.path.join(OUTPUT_DIR, "video_map_youtube.json"), "w", encoding='utf-8') as f:
        json.dump(video_map, f, indent=2, ensure_ascii=False)
        
    # Save shards
    shards = defaultdict(dict)
    for lemma, entries in taught_index.items():
        # Deduplicate
        entries = deduplicate_occurrences(entries)
        
        first_char = lemma[0] if lemma[0].isalpha() else "others"
        shards[first_char][lemma] = entries
        
    for char, data in shards.items():
        with open(os.path.join(OUTPUT_DIR, f"index_youtube_{char}.json"), "w", encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False)
            
    print(f"✅ Saved video_map_youtube.json and index shards.")

if __name__ == "__main__":
    main()
