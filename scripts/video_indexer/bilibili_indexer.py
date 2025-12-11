import os
import json
import shutil
import subprocess
import re
import time
import argparse
from collections import defaultdict
from fast_asr_engine import ASREngine  # Use fast engine with improved estimation

try:
    from tqdm import tqdm
    HAS_TQDM = True
except ImportError:
    HAS_TQDM = False
    print("Tip: Install tqdm for progress bars: pip install tqdm")

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

from indexer_shared import (
    STOP_WORDS, TextProcessor, get_transcription_cache_path,
    save_transcription_cache, load_transcription_cache,
    deduplicate_occurrences, smart_filter_taught_words
)

def download_audio(bvid, output_dir, max_retries=3):
    """
    Download Bilibili video using you-get with retry logic.
    
    Args:
        bvid: Bilibili video ID (e.g., "BV1234567890")
        output_dir: Directory to save downloaded videos
        max_retries: Maximum number of download attempts (default: 3)
        
    Returns:
        dict: {"success": bool, "error": str or None, "title": str}
    """
    url = f"https://www.bilibili.com/video/{bvid}"
    print(f"\n📥 Downloading video for {bvid}...")
    
    # 1. Get video info first
    title = "Unknown Title"
    try:
        info_cmd = ['you-get', '--json', url]
        result = subprocess.run(info_cmd, capture_output=True, text=True, check=True, timeout=30)
        info = json.loads(result.stdout)
        title = info.get('title', 'Unknown Title')
        print(f"  📺 Title: {title}")
    except subprocess.TimeoutExpired:
        error_msg = "Timeout getting video info"
        print(f"  ❌ {error_msg}")
        return {"success": False, "error": error_msg, "title": title}
    except Exception as e:
        print(f"  ⚠️  Warning: Could not get video info: {e}")
        # Continue anyway, title is not critical
    
    # 2. Download video with retry logic
    print(f"  ⏬ Starting download (this may take several minutes for multi-part videos)...")
    print(f"  💡 Tip: You can see you-get's progress below")
    
    for attempt in range(1, max_retries + 1):
        try:
            if attempt > 1:
                print(f"\n  🔄 Retry attempt {attempt}/{max_retries}...")
                time.sleep(5)  # Wait before retry
            
            download_cmd = [
                'you-get',
                '--playlist',  # Support multi-page videos
                '-o', output_dir,
                url
            ]
            
            # Don't capture output - let you-get show progress in real-time
            print()  # Add blank line before you-get output
            result = subprocess.run(
                download_cmd,
                timeout=1800  # 30 minute timeout for large playlists
            )
            print()  # Add blank line after you-get output
            
            # Check if download succeeded (returncode 0 or 1 both can be success)
            # you-get returns 1 when files already exist
            if result.returncode in [0, 1]:
                print(f"  ✅ Download complete")
                return {"success": True, "error": None, "title": title}
            else:
                error_msg = f"you-get exited with code {result.returncode}"
                if attempt == max_retries:
                    print(f"  ❌ {error_msg}")
                    return {"success": False, "error": error_msg, "title": title}
                print(f"  ⚠️  {error_msg}, retrying...")
                
        except subprocess.TimeoutExpired:
            error_msg = "Download timeout (>30 minutes)"
            if attempt == max_retries:
                print(f"  ❌ {error_msg}")
                return {"success": False, "error": error_msg, "title": title}
            print(f"  ⚠️  {error_msg}, retrying...")
            
        except Exception as e:
            error_msg = f"Download error: {str(e)}"
            if attempt == max_retries:
                print(f"  ❌ {error_msg}")
                return {"success": False, "error": error_msg, "title": title}
            print(f"  ⚠️  {error_msg}, retrying...")
    
    # Should not reach here, but just in case
    return {"success": False, "error": "Unknown download failure", "title": title}

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

# (Shared logic imported from indexer_shared)

def extract_page_number(filename):
    """Extract page number from filename like '(P10. [10]--10).mp4'"""
    match = re.search(r'\(P(\d+)\.', filename)
    if match:
        return int(match.group(1))
    return None

def scan_video_files(directory):
    """Scan for video files in directory and sort by page number"""
    video_extensions = {'.mp4', '.flv', '.mkv', '.mov'}
    files = []
    for f in os.listdir(directory):
        ext = os.path.splitext(f)[1].lower()
        if ext in video_extensions:
            files.append(os.path.join(directory, f))
    
    # Sort by page number extracted from filename, not alphabetically
    # This ensures P1, P2, P3, ..., P10 order instead of P1, P10, P11, ..., P2
    def get_page_number(filepath):
        filename = os.path.basename(filepath)
        page_num = extract_page_number(filename)
        return page_num if page_num is not None else 9999  # Put files without page numbers at end
    
    files.sort(key=get_page_number)
    return files

def get_context(all_words, current_index, window=5):
    """Extract context window around current word."""
    start = max(0, current_index - window)
    end = min(len(all_words), current_index + window + 1)
    return " ".join([w['word'] for w in all_words[start:end]])

# (Shared logic imported from indexer_shared)



# (Shared logic imported from indexer_shared)

def load_bvid_list_from_file(filepath):
    """Load BVID list from a text file (one BVID per line)"""
    bvids = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            # Skip empty lines and comments
            if line and not line.startswith('#'):
                # Extract BVID if it's a full URL
                if 'bilibili.com' in line:
                    match = re.search(r'(BV[a-zA-Z0-9]+)', line)
                    if match:
                        bvids.append(match.group(1))
                else:
                    # Assume it's already a BVID
                    bvids.append(line)
    return bvids

def main():
    parser = argparse.ArgumentParser(
        description='Bilibili Video Indexer V3.1 (Enhanced Robust Edition)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Use hardcoded BVID_LIST in script
  python bilibili_indexer.py
  
  # Specify BVIDs via command line
  python bilibili_indexer.py --bvids BV1234567890 BV0987654321
  
  # Load BVIDs from file (one per line)
  python bilibili_indexer.py --bvid-file videos.txt
  
  # Retry only failed videos from previous run
  python bilibili_indexer.py --retry-failed
        """
    )
    parser.add_argument('--bvids', nargs='+', metavar='BVID',
                       help='List of Bilibili video IDs to process')
    parser.add_argument('--bvid-file', type=str, metavar='FILE',
                       help='File containing BVIDs (one per line, supports URLs and comments with #)')
    parser.add_argument('--retry-failed', action='store_true', 
                       help='Only retry videos that failed in the previous run')
    parser.add_argument('--skip-download', action='store_true',
                       help='Skip download phase and only process existing videos')
    args = parser.parse_args()
    
    # Determine BVID list source
    bvid_list = None
    if args.bvids:
        bvid_list = args.bvids
        print(f"Using BVIDs from command line: {bvid_list}")
    elif args.bvid_file:
        bvid_list = load_bvid_list_from_file(args.bvid_file)
        print(f"Loaded {len(bvid_list)} BVIDs from {args.bvid_file}")
    else:
        # Use hardcoded BVID_LIST
        bvid_list = BVID_LIST
        if not bvid_list:
            print("❌ Error: No BVIDs specified!")
            print("   Use --bvids, --bvid-file, or edit BVID_LIST in the script.")
            return
        print(f"Using hardcoded BVID_LIST: {bvid_list}")
    
    print("=" * 60)
    print("Bilibili Video Indexer V3.0 (Robust Edition)")
    print("=" * 60)

    # Ensure directories exist
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(TEMP_DIR, exist_ok=True)

    # 1. Download Phase
    download_failures = []
    
    # Create a mapping from title keywords to BVID for later use
    # Since you-get doesn't include BVID in filename, we need to track it
    bvid_download_map = {}  # Maps BVID to download order/index
    
    if args.skip_download:
        print("\n[Phase 1] Skipping download phase (--skip-download)...")
    elif args.retry_failed:
        print("\n[Retry Mode] Skipping download phase...")
    else:
        print("\n" + "=" * 60)
        print(f"[Phase 1] Downloading {len(bvid_list)} Video(s)...")
        print("=" * 60)
        print(f"💡 Note: you-get will show its own download progress\n")
        
        # Don't use tqdm here - it conflicts with you-get's own progress display
        for idx, bvid in enumerate(bvid_list, 1):
            print(f"\n[{idx}/{len(bvid_list)}] Processing {bvid}")
            bvid_download_map[bvid] = idx
            
            result = download_audio(bvid, TEMP_DIR, max_retries=3)
            
            if not result["success"]:
                download_failures.append({
                    "bvid": bvid,
                    "title": result["title"],
                    "error": result["error"]
                })
        
        # Report download results
        if download_failures:
            print(f"\n⚠️  Download Summary: {len(bvid_list) - len(download_failures)}/{len(bvid_list)} successful")
            print(f"❌ Failed downloads:")
            for fail in download_failures:
                print(f"   - {fail['bvid']}: {fail['error']}")
        else:
            print(f"\n✅ All {len(bvid_list)} videos downloaded successfully!")

    # 2. Processing Phase (Scanning files)
    print("\n" + "=" * 60)
    print("[Phase 2] Processing Videos (Resume Capable)...")
    print("=" * 60)
    
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
    
    # Use progress bar for processing if available
    processing_iterator = tqdm(enumerate(video_files), total=len(video_files), 
                              desc="Processing", unit="video") if HAS_TQDM else enumerate(video_files)
    
    for idx, video_path in processing_iterator:
        try:
            video_filename = os.path.basename(video_path)
            video_id = str(idx) # Simple numeric ID for frontend
            
            # Generate a title based on filename
            title = os.path.splitext(video_filename)[0]
            
            # Extract page number from filename
            page_number = extract_page_number(video_filename)
            
            # Use the first BVID from bvid_list as the source
            # (assuming all downloaded videos are from the same or related series)
            source_bvid = bvid_list[0] if len(bvid_list) > 0 else None
            
            video_map[video_id] = {
                "filename": video_filename,
                "title": title,
                "bvid": source_bvid,
                "page": page_number
            }
            
            if not HAS_TQDM:
                print(f"\n📹 Processing [{idx+1}/{len(video_files)}] {video_filename}...")
            else:
                processing_iterator.set_postfix_str(video_filename[:40])
            
            # Check Cache First
            cache_path = get_transcription_cache_path(video_path)
            cached_data = load_transcription_cache(cache_path)
            
            words = []
            
            if cached_data:
                if not HAS_TQDM:
                    print(f"  ✅ Found cached transcription, skipping Whisper!")
                words = cached_data['words']
            else:
                # No cache, perform heavy lifting
                if asr is None:
                    if not HAS_TQDM:
                        print("  🤖 Loading Whisper model (medium)...")
                    asr = ASREngine(model_size="medium")
                
                # Extract Audio
                if not HAS_TQDM:
                    print(f"  🎵 Extracting audio...")
                audio_path = extract_audio(video_path)
                if not audio_path:
                    raise Exception("Audio extraction failed")
                    
                # Transcribe
                if not HAS_TQDM:
                    print(f"  🗣️  Transcribing (this may take a while)...")
                words = asr.transcribe(audio_path)
                
                # Save Cache immediately
                save_transcription_cache(cache_path, words, {"title": title})
                if not HAS_TQDM:
                    print(f"  💾 Saved transcription cache")
                
                # Optional: Cleanup audio to save space
                if os.path.exists(audio_path):
                    os.remove(audio_path)

            # 3. Indexing (Always runs, fast)
            if not HAS_TQDM:
                print(f"  📚 Indexing {len(words)} words...")
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
            
            if not HAS_TQDM:
                print(f"  ✅ Indexed {indexed_count} word occurrences")
            successful_videos += 1
            
        except Exception as e:
            error_msg = str(e)
            if HAS_TQDM:
                processing_iterator.write(f"  ❌ Error: {video_filename}: {error_msg}")
            else:
                print(f"  ❌ Error processing {video_filename}: {error_msg}")
            
            if not HAS_TQDM:
                import traceback
                traceback.print_exc()
            
            # Record failure
            failed_videos.append({
                "filename": video_filename,
                "error": error_msg,
                "index": idx
            })
            
            if not HAS_TQDM:
                print(f"  ⏭️  Continuing with next video...")
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
    print("  Using Smart Filter Algorithm (Context + Density + Isolation)")
    
    original_word_count = len(global_index)
    
    # Use Smart Algorithm
    taught_words_index = smart_filter_taught_words(
        global_index,
        time_window=120,
        min_score=15
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
    video_map_path = os.path.join(OUTPUT_DIR, "video_map_bilibili.json")
    with open(video_map_path, "w", encoding='utf-8') as f:
        json.dump(video_map, f, indent=2, ensure_ascii=False)
    print(f"✓ Saved video_map_bilibili.json")
    
    # Shard and save index
    shards = defaultdict(dict)
    for lemma, entries in deduplicated_index.items():
        first_char = lemma[0] if lemma and lemma[0].isalpha() else "others"
        shards[first_char][lemma] = entries

    for char, data in shards.items():
        filename = f"index_bilibili_{char}.json"
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
