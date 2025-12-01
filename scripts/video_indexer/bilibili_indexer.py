import os
import json
import shutil
import subprocess
import re
from collections import defaultdict
from fast_asr_engine import ASREngine  # Use fast engine with improved estimation

# Configuration
# Get the project root directory (two levels up from this script)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "public", "data")
TEMP_DIR = os.path.join(SCRIPT_DIR, "temp_downloads")

BVID_LIST = [
    "BV1XksdztEvb",  # Test video
    # Add more BVIDs here
]

# Common English stop words to filter out
STOP_WORDS = {
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about',
    'and', 'but', 'or', 'nor', 'so', 'yet',
    'it', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'its', 'our', 'their',
    'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
    'do', 'does', 'did', 'done',
    'have', 'has', 'had',
    'go', 'come', 'take', 'make', 'get',
    'one', 'two', 'three',
    'yes', 'no', 'not', 'yeah', 'ok', 'okay', 'umm', 'uh'
}

class TextProcessor:
    """Simple text processor for lemmatization"""
    def lemmatize(self, word):
        # Lowercase and strip punctuation
        return word.lower().strip('.,!?()[]{}"\'')

def download_audio(bvid, output_dir):
    """
    Download Bilibili video using you-get.
    Downloads to output_dir with you-get's default naming.
    No return value - use scan_video_files() to find downloaded files.
    """
    url = f"https://www.bilibili.com/video/{bvid}"
    print(f"Downloading video for {bvid}...")
    
    # 1. Get video info first
    try:
        info_cmd = ['you-get', '--json', url]
        result = subprocess.run(info_cmd, capture_output=True, text=True, check=True, timeout=15)
        info = json.loads(result.stdout)
        title = info.get('title', 'Unknown Title')
        print(f"  Title: {title}")
    except Exception as e:
        print(f"  Warning: Could not get video info: {e}")
        title = "Unknown Title"
    
    # 2. Download video using you-get
    print(f"  Downloading video(s) to {output_dir}...")
    
    try:
        download_cmd = [
            'you-get',
            '--playlist',  # Support multi-page videos
            '-o', output_dir,
            url
        ]
        
        # Don't check=True because you-get returns non-zero if files exist
        result = subprocess.run(download_cmd, capture_output=True, text=True)
        if result.returncode != 0 and "Skip" not in result.stdout:
            print(f"  Warning: you-get exited with code {result.returncode}")
        
    except Exception as e:
        print(f"  Warning during download: {e}")

def extract_audio(video_path):
    """Extract audio from video file to .wav"""
    base_name = os.path.splitext(video_path)[0]
    audio_path = f"{base_name}.wav"
    
    if os.path.exists(audio_path):
        return audio_path
        
    print(f"  Extracting audio from {os.path.basename(video_path)}...")
    
    try:
        ffmpeg_cmd = [
            'ffmpeg',
            '-i', video_path,
            # REMOVED: -ss and -t (Process FULL video)
            '-vn',
            '-acodec', 'pcm_s16le',
            '-ar', '16000',
            '-ac', '1',
            audio_path,
            '-y',
            '-loglevel', 'error'
        ]
        subprocess.run(ffmpeg_cmd, check=True)
        return audio_path
    except Exception as e:
        print(f"  Error extracting audio: {e}")
        return None

def get_transcription_cache_path(video_path):
    """Get path for transcription cache json"""
    return f"{video_path}.transcription.json"

CACHE_VERSION = "3.0"  # Version for cache format

def save_transcription_cache(cache_path, words, video_info):
    """Save transcription result to cache with version"""
    data = {
        "version": CACHE_VERSION,
        "info": video_info,
        "words": words
    }
    with open(cache_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_transcription_cache(cache_path):
    """Load transcription from cache, check version"""
    if os.path.exists(cache_path):
        try:
            with open(cache_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Version check
            if data.get('version') != CACHE_VERSION:
                print(f"    Cache version mismatch, will re-transcribe")
                return None
                
            return data
        except Exception as e:
            print(f"    Error loading cache: {e}, will re-transcribe")
            return None
    return None

def scan_video_files(directory):
    """Scan for video files in directory"""
    video_extensions = {'.mp4', '.flv', '.mkv', '.mov'}
    files = []
    for f in os.listdir(directory):
        ext = os.path.splitext(f)[1].lower()
        if ext in video_extensions:
            files.append(os.path.join(directory, f))
    # Sort to ensure P1, P2, P3 order
    files.sort()
    return files

def get_context(all_words, current_index, window=5):
    """Extract context window around current word."""
    start = max(0, current_index - window)
    end = min(len(all_words), current_index + window + 1)
    return " ".join([w['word'] for w in all_words[start:end]])

def deduplicate_occurrences(occurrences, time_threshold=60):
    """
    Remove duplicate occurrences that are too close in time.
    
    Args:
        occurrences: List of occurrence dicts with 'v', 't', 'c' keys
        time_threshold: Minimum time gap (seconds) between kept occurrences
        
    Returns:
        Deduplicated list
    """
    if not occurrences:
        return occurrences
    
    # Sort by time
    sorted_occs = sorted(occurrences, key=lambda x: x['t'])
    
    # Keep first occurrence, then only keep if time gap > threshold
    result = [sorted_occs[0]]
    
    for occ in sorted_occs[1:]:
        # Check time difference with last kept occurrence
        if occ['t'] - result[-1]['t'] >= time_threshold:
            result.append(occ)
    
    return result

def filter_by_frequency_density(word_index, time_window=120, density_threshold=5):
    """
    Filter words based on frequency density in sliding time windows.
    Only keep words that appear frequently in a short time window (likely being taught).
    
    Args:
        word_index: Dict of {word: [occurrences]}
        time_window: Size of sliding window in seconds (default: 120s = 2 minutes)
        density_threshold: Minimum occurrences in a window to be considered "taught" (default: 5)
        
    Returns:
        Filtered dict with only "taught" words
    """
    filtered_index = {}
    
    for word, occurrences in word_index.items():
        if len(occurrences) < density_threshold:
            # Quick check: if total occurrences < threshold, can't possibly pass
            continue
        
        # Extract timestamps and sort
        timestamps = sorted([occ['t'] for occ in occurrences])
        
        # Check if any sliding window has >= density_threshold occurrences
        is_taught_word = False
        
        for i in range(len(timestamps)):
            # Count how many timestamps fall within [timestamps[i], timestamps[i] + time_window]
            window_end = timestamps[i] + time_window
            count = 0
            
            for t in timestamps[i:]:
                if t <= window_end:
                    count += 1
                else:
                    break
            
            if count >= density_threshold:
                is_taught_word = True
                break
        
        if is_taught_word:
            filtered_index[word] = occurrences
    
    return filtered_index

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Bilibili Video Indexer V3.0 (Robust Edition)')
    parser.add_argument('--retry-failed', action='store_true', 
                       help='Only retry videos that failed in the previous run')
    args = parser.parse_args()
    
    print("=" * 60)
    print("Bilibili Video Indexer V3.0 (Robust Edition)")
    print("=" * 60)

    # Ensure directories exist
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(TEMP_DIR, exist_ok=True)

    # 1. Download Phase (skip if retry-failed mode)
    if not args.retry_failed:
        print("\n[Phase 1] Checking/Downloading Videos...")
        for bvid in BVID_LIST:
            download_audio(bvid, TEMP_DIR) # This now handles playlists
    else:
        print("\n[Retry Mode] Skipping download phase...")

    # 2. Processing Phase (Scanning files)
    print("\n[Phase 2] Processing Videos (Resume Capable)...")
    
    # Initialize engines only if needed
    processor = TextProcessor()
    
    # We delay loading Whisper until we confirm we actually need it (no cache)
    asr = None 
    
    video_files = scan_video_files(TEMP_DIR)
    print(f"Found {len(video_files)} video files in {TEMP_DIR}")
    
    # Filter for retry-failed mode
    if args.retry_failed:
        failed_log_path = os.path.join(OUTPUT_DIR, "failed_videos.json")
        if os.path.exists(failed_log_path):
            with open(failed_log_path, 'r', encoding='utf-8') as f:
                previous_failures = json.load(f)
            
            failed_filenames = {fail['filename'] for fail in previous_failures}
            video_files = [vf for vf in video_files if os.path.basename(vf) in failed_filenames]
            
            print(f"Retry mode: Found {len(video_files)} previously failed videos")
            
            if not video_files:
                print("No failed videos to retry. Exiting.")
                return
        else:
            print("No failed_videos.json found. Nothing to retry. Exiting.")
            return
    
    global_index = defaultdict(list)
    total_words_count = 0
    video_map = {}
    failed_videos = []  # Track failed videos
    successful_videos = 0
    
    for idx, video_path in enumerate(video_files):
        try:
            video_filename = os.path.basename(video_path)
            video_id = str(idx) # Simple numeric ID for frontend
            
            # Generate a title based on filename
            title = os.path.splitext(video_filename)[0]
            
            # Try to extract BVID from filename (you-get usually includes it)
            import re as regex_module
            bvid_match = regex_module.search(r'(BV[a-zA-Z0-9]+)', video_filename)
            bvid = bvid_match.group(1) if bvid_match else None
            
            video_map[video_id] = {
                "filename": video_filename,
                "title": title,
                "bvid": bvid  # May be None if not in filename
            }
            
            print(f"\nProcessing [{idx+1}/{len(video_files)}] {video_filename}...")
            
            # Check Cache First
            cache_path = get_transcription_cache_path(video_path)
            cached_data = load_transcription_cache(cache_path)
            
            words = []
            
            if cached_data:
                print(f"  ✓ Found cached transcription, skipping Whisper!")
                words = cached_data['words']
            else:
                # No cache, perform heavy lifting
                if asr is None:
                    print("  Loading Whisper model (medium)...")
                    asr = ASREngine(model_size="medium")
                
                # Extract Audio
                audio_path = extract_audio(video_path)
                if not audio_path:
                    raise Exception("Audio extraction failed")
                    
                # Transcribe
                words = asr.transcribe(audio_path)
                
                # Save Cache immediately
                save_transcription_cache(cache_path, words, {"title": title})
                print(f"  ✓ Saved transcription cache")
                
                # Optional: Cleanup audio to save space
                if os.path.exists(audio_path):
                    os.remove(audio_path)

            # 3. Indexing (Always runs, fast)
            print(f"  Indexing {len(words)} words...")
            indexed_count = 0
            for i, word_obj in enumerate(words):
                raw_text = word_obj['word']
                
                # Regex extraction
                potential_words = re.findall(r'[a-zA-Z]+(?:-[a-zA-Z]+)*', raw_text)
                
                for raw_word in potential_words:
                    lemma = processor.lemmatize(raw_word)
                    
                    # Validation
                    is_valid = False
                    if lemma:
                        clean_lemma = lemma.replace('-', '')
                        if clean_lemma.isalpha() and all(ord(c) < 128 for c in lemma):
                            is_valid = True
                    
                    if is_valid:
                        if len(lemma) < 2 and lemma not in ['a', 'i']:
                            continue
                        if lemma in STOP_WORDS:
                            continue
                        
                        context = get_context(words, i)
                        
                        # Absolute time is just start time (no offset needed as we process full video)
                        absolute_time = word_obj['start']
                        
                        entry = {
                            "v": video_id,
                            "t": round(absolute_time, 1),
                            "c": context
                        }
                        global_index[lemma].append(entry)
                        indexed_count += 1
                        total_words_count += 1
            
            print(f"  ✓ Indexed {indexed_count} word occurrences")
            successful_videos += 1
            
        except Exception as e:
            error_msg = str(e)
            print(f"  ❌ Error processing {video_filename}: {error_msg}")
            import traceback
            traceback.print_exc()
            
            # Record failure
            failed_videos.append({
                "filename": video_filename,
                "error": error_msg,
                "index": idx
            })
            
            print(f"  Continuing with next video...")
            continue
    # 5. Save Data
    print("\n" + "=" * 60)
    print("Saving data...")
    print("=" * 60)
    
    # Show original words before filtering
    print(f"\n{'=' * 60}")
    print(f"📋 Original Words (before density filter):")
    print(f"{'=' * 60}")
    
    if global_index:
        sorted_original = sorted(global_index.items(), key=lambda x: (-len(x[1]), x[0]))
        print(f"{'Word':<20} {'Occurrences':<15} {'First at'}")
        print("-" * 60)
        
        for word, occurrences in sorted_original[:30]:  # Show top 30
            first_time = min(occ['t'] for occ in occurrences)
            print(f"{word:<20} {len(occurrences):<15} {first_time:.1f}s")
        
        if len(global_index) > 30:
            print(f"... and {len(global_index) - 30} more words")
    
    print("=" * 60)
    
    # Step 1: Filter by frequency density (identify taught words)
    print("Filtering by frequency density (taught words only)...")
    print(f"  Parameters: time_window=120s, density_threshold=3")
    original_word_count = len(global_index)
    
    taught_words_index = filter_by_frequency_density(
        global_index, 
        time_window=120, 
        density_threshold=3
    )
    
    taught_word_count = len(taught_words_index)
    original_occurrence_count = sum(len(occs) for occs in global_index.values())
    taught_occurrence_count = sum(len(occs) for occs in taught_words_index.values())
    
    print(f"  Words: {original_word_count} → {taught_word_count} (filtered {original_word_count - taught_word_count} auxiliary words)")
    print(f"  Occurrences: {original_occurrence_count} → {taught_occurrence_count}")
    
    # Step 2: Deduplicate occurrences for each taught word
    print("Deduplicating nearby occurrences...")
    deduplicated_index = {}
    final_occurrence_count = 0
    
    for lemma, occurrences in taught_words_index.items():
        deduped = deduplicate_occurrences(occurrences, time_threshold=60)
        deduplicated_index[lemma] = deduped
        final_occurrence_count += len(deduped)
    
    print(f"  Occurrences: {taught_occurrence_count} → {final_occurrence_count} (removed {taught_occurrence_count - final_occurrence_count} duplicates)")
    
    # Save video_map
    video_map_path = os.path.join(OUTPUT_DIR, "video_map.json")
    with open(video_map_path, "w", encoding='utf-8') as f:
        json.dump(video_map, f, indent=2, ensure_ascii=False)
    print(f"✓ Saved video_map.json")
    
    # Shard and save index
    shards = defaultdict(dict)
    for lemma, entries in deduplicated_index.items():
        first_char = lemma[0] if lemma and lemma[0].isalpha() else "others"
        shards[first_char][lemma] = entries

    for char, data in shards.items():
        filename = f"index_{char}.json"
        with open(os.path.join(OUTPUT_DIR, filename), "w", encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False)
        print(f"✓ Saved {filename} ({len(data)} words)")
            
    # Save Metadata
    import time
    metadata = {
        "generated_at": int(time.time()),
        "total_videos": len(video_map),
        "total_words": final_occurrence_count,  # Use final count after filtering and deduplication
        "sharding_type": "alphabet",
        "version": "2.0",
        "indexer": "you-get + WhisperX"
    }
    with open(os.path.join(OUTPUT_DIR, "metadata.json"), "w", encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
    print(f"✓ Saved metadata.json")
    
    # Save/Update failed videos log
    if args.retry_failed and failed_videos:
        # In retry mode, only save the NEW failures (videos that failed again)
        failed_log_path = os.path.join(OUTPUT_DIR, "failed_videos.json")
        with open(failed_log_path, 'w', encoding='utf-8') as f:
            json.dump(failed_videos, f, indent=2, ensure_ascii=False)
        print(f"⚠️  Updated failed_videos.json ({len(failed_videos)} still failing)")
    elif args.retry_failed and not failed_videos:
        # All retries succeeded! Remove the failed log
        failed_log_path = os.path.join(OUTPUT_DIR, "failed_videos.json")
        if os.path.exists(failed_log_path):
            os.remove(failed_log_path)
            print(f"✓ All retries succeeded! Removed failed_videos.json")
    elif failed_videos:
        # Normal mode with new failures
        failed_log_path = os.path.join(OUTPUT_DIR, "failed_videos.json")
        with open(failed_log_path, 'w', encoding='utf-8') as f:
            json.dump(failed_videos, f, indent=2, ensure_ascii=False)
        print(f"⚠️  Saved failed_videos.json ({len(failed_videos)} failures)")

    # Cleanup temp dir
    # if os.path.exists(TEMP_DIR):
    #     shutil.rmtree(TEMP_DIR)
    #     print(f"✓ Cleaned up temp directory")

    print("\n" + "=" * 60)
    print("Processing Complete!")
    print("=" * 60)
    print(f"✓ Total videos found: {len(video_files)}")
    print(f"✓ Successfully processed: {successful_videos}")
    if failed_videos:
        print(f"❌ Failed: {len(failed_videos)}")
        print(f"\nFailed videos:")
        for fail in failed_videos:
            print(f"  - {fail['filename']}: {fail['error']}")
    print(f"\n✓ Filtering pipeline:")
    print(f"  - Original: {original_word_count} words, {original_occurrence_count} occurrences")
    print(f"  - After density filter: {taught_word_count} words, {taught_occurrence_count} occurrences")
    print(f"  - After deduplication: {taught_word_count} words, {final_occurrence_count} occurrences")
    print(f"✓ Output: {OUTPUT_DIR}")
    
    # Display indexed words
    print(f"\n{'=' * 60}")
    print(f"📚 Indexed Words ({len(deduplicated_index)} words):")
    print(f"{'=' * 60}")
    
    if deduplicated_index:
        # Sort by word alphabetically
        sorted_words = sorted(deduplicated_index.items(), key=lambda x: x[0])
        
        # Display in a formatted table
        print(f"{'Word':<20} {'Occurrences':<15} {'Timestamps'}")
        print("-" * 60)
        
        for word, occurrences in sorted_words:
            timestamps_str = ", ".join([f"{occ['t']:.1f}s" for occ in occurrences])
            # Truncate if too long
            if len(timestamps_str) > 40:
                timestamps_str = timestamps_str[:37] + "..."
            print(f"{word:<20} {len(occurrences):<15} {timestamps_str}")
    else:
        print("  (No words were indexed)")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
