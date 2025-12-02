#!/usr/bin/env python3
"""
Fix video_map.json to add missing BVID and page number information.
No need to re-download or re-transcribe videos.
"""

import json
import re
import os

# Configuration
BVID = "BV1XksdztEvb"  # The BVID for all videos
VIDEO_MAP_PATH = "../../public/data/video_map.json"

def extract_page_number(filename):
    """Extract page number from filename like '(P10. [10]--10).mp4'"""
    # Match patterns like 'P1.', 'P10.', 'P44.'
    match = re.search(r'\(P(\d+)\.', filename)
    if match:
        return int(match.group(1))
    return None

def main():
    print("=" * 60)
    print("Fixing video_map.json with BVID and page numbers")
    print("=" * 60)
    
    # Get script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    video_map_file = os.path.join(script_dir, VIDEO_MAP_PATH)
    
    # Load existing video_map.json
    print(f"\n📂 Loading {video_map_file}...")
    with open(video_map_file, 'r', encoding='utf-8') as f:
        video_map = json.load(f)
    
    print(f"✅ Found {len(video_map)} videos")
    
    # Update each video entry
    updated_count = 0
    for video_id, video_info in video_map.items():
        filename = video_info['filename']
        
        # Extract page number
        page_number = extract_page_number(filename)
        
        if page_number is None:
            print(f"⚠️  Warning: Could not extract page number from: {filename}")
            continue
        
        # Update the entry
        video_info['bvid'] = BVID
        video_info['page'] = page_number
        
        updated_count += 1
        
        if updated_count <= 3:  # Show first 3 examples
            print(f"  ✓ Video {video_id}: Page {page_number}")
    
    print(f"\n✅ Updated {updated_count}/{len(video_map)} videos")
    
    # Save updated video_map.json
    print(f"\n💾 Saving updated video_map.json...")
    with open(video_map_file, 'w', encoding='utf-8') as f:
        json.dump(video_map, f, indent=2, ensure_ascii=False)
    
    print("✅ Done!")
    
    # Show a sample
    print("\n" + "=" * 60)
    print("Sample updated entry:")
    print("=" * 60)
    sample_id = list(video_map.keys())[0]
    print(json.dumps({sample_id: video_map[sample_id]}, indent=2, ensure_ascii=False))
    
    print("\n" + "=" * 60)
    print("🎉 Video map successfully fixed!")
    print("=" * 60)
    print(f"\nNow you can construct Bilibili URLs like:")
    print(f"https://www.bilibili.com/video/{BVID}?p=<page>&t=<timestamp>")

if __name__ == "__main__":
    main()
