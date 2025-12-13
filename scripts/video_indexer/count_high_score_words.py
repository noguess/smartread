import json
import glob
import os

def load_and_count_high_score(pattern, threshold=8):
    high_score_count = 0
    total_words = 0
    files = glob.glob(pattern)
    
    print(f"Analyzing {len(files)} files for pattern: {pattern}")
    
    for f in files:
        try:
            with open(f, 'r', encoding='utf-8') as jf:
                data = json.load(jf)
                total_words += len(data)
                for word, entries in data.items():
                    # Calculate total score for the word
                    # Entry structure: {"v": "...", "t": ..., "c": ..., "s": score}
                    total_score = sum(entry.get('s', 0) for entry in entries)
                    
                    if total_score > threshold:
                        high_score_count += 1
        except Exception as e:
            print(f"Error reading {f}: {e}")
            
    return high_score_count, total_words

def main():
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    youtube_pattern = os.path.join(project_root, 'public', 'data', 'index_youtube_*.json')
    bilibili_pattern = os.path.join(project_root, 'public', 'data', 'index_bilibili_*.json')
    
    threshold = 8
    
    yt_high, yt_total = load_and_count_high_score(youtube_pattern, threshold)
    bili_high, bili_total = load_and_count_high_score(bilibili_pattern, threshold)
    
    print("=" * 50)
    print(f"WORDS WITH TOTAL SCORE > {threshold}")
    print("=" * 50)
    print(f"{'Platform':<15} {'Total Words':<15} {'High Score (>8)':<20} {'%':<10}")
    print("-" * 50)
    print(f"{'YouTube':<15} {yt_total:<15} {yt_high:<20} {yt_high/yt_total*100:.1f}%")
    print(f"{'Bilibili':<15} {bili_total:<15} {bili_high:<20} {bili_high/bili_total*100:.1f}%")
    print("-" * 50)
    print(f"Difference (Bilibili - YouTube): {bili_high - yt_high}")
    print("=" * 50)

if __name__ == "__main__":
    main()
