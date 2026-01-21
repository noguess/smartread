import os
import argparse
import re
from youtube_indexer import download_audio_youtube, TEMP_DIR
from fast_asr_engine import ASREngine
from indexer_shared import get_transcription_cache_path, load_transcription_cache, save_transcription_cache

def sanitize_filename(name):
    # Remove invalid characters
    s = re.sub(r'[\\/*?:"<>|]', "", name)
    s = "".join(c for c in s if c.isprintable())
    return s.strip()

def youtube_to_text(urls, output_file=None, skip_download=False):
    """
    Download YouTube videos and save transcriptions to local text files.
    """
    # 1. Ensure TEMP_DIR exists
    os.makedirs(TEMP_DIR, exist_ok=True)
    
    # 2. Handle Downloads
    downloaded_files = []
    if not skip_download:
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

    if not downloaded_files:
        print("❌ No videos to process.")
        return

    # 3. Transcribe & Save to Text
    asr = None  # Lazy load
    
    for idx, item in enumerate(downloaded_files):
        if not item.get("success"):
            continue
            
        video_id = item['id']
        file_path = item['path']
        title = item['title']
        
        print(f"\nProcessing [{idx+1}/{len(downloaded_files)}] {title} ({video_id})")
        
        # Check Cache
        cache_path = get_transcription_cache_path(file_path)
        cached_data = load_transcription_cache(cache_path)
        
        words = []
        if cached_data:
            print("  ✅ Found cached transcription")
            words = cached_data['words']
        else:
            if asr is None:
                print("  🤖 Loading Whisper...")
                asr = ASREngine(model_size="medium")
            
            print("  🗣️  Transcribing...")
            words = asr.transcribe(file_path)
            save_transcription_cache(cache_path, words, {"title": title})
        
        # Determine Output Filename
        if output_file and len(downloaded_files) == 1:
            final_output = output_file
        else:
            if output_file:
                print(f"⚠️  Multiple videos found, ignoring --output '{output_file}' and using titles.")
            safe_title = sanitize_filename(title)
            final_output = f"{safe_title}.txt"
        
        print(f"📄 Writing transcription to: {final_output}")

        with open(final_output, "w", encoding="utf-8") as f:
            f.write(f"Title: {title}\n")
            f.write(f"Video ID: {video_id}\n")
            f.write("="*60 + "\n\n")
            
            # Combine words into sentences/paragraphs (simple heuristic)
            current_sentence = []
            for word_obj in words:
                word_text = word_obj['word']
                current_sentence.append(word_text)
            
            full_text = " ".join(current_sentence)
            # Cleanup multiple spaces
            full_text = re.sub(r'\s+', ' ', full_text).strip()
            
            f.write(full_text)
            f.write("\n")
            
        print(f"✅ Saved: {final_output}")

    print(f"\n✅ All done!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='YouTube to Text Downloader')
    parser.add_argument('--urls', nargs='+', help='List of YouTube URLs')
    parser.add_argument('--output', type=str, default=None, help='Output text file (optional, default uses video title)')
    parser.add_argument('--skip-download', action='store_true', help='Skip download phase, use existing wav files in temp folder')
    
    args = parser.parse_args()
    
    if not args.urls and not args.skip_download:
        print("❌ Error: No URLs provided. Use --urls or --skip-download")
    else:
        youtube_to_text(args.urls or [], args.output, args.skip_download)
