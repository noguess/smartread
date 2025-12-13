import json
import os
import string

def get_stats(filepath, threshold=8):
    if not os.path.exists(filepath):
        return 0, 0
    
    total_words = 0
    high_score_words = 0
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            total_words = len(data)
            
            for word, entries in data.items():
                total_score = sum(entry.get('s', 0) for entry in entries)
                if total_score > threshold:
                    high_score_words += 1
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return 0, 0
        
    return total_words, high_score_words

def main():
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    data_dir = os.path.join(project_root, 'public', 'data')
    threshold = 8
    
    # Header
    # YT_T: YouTube Total, YT_H: YouTube High Score, YT_%: YouTube High Score %
    # B_T: Bilibili Total, B_H: Bilibili High Score, B_%: Bilibili High Score %
    header = f"{'Char':<4} | {'YT Total':<8} {'YT >8':<8} {'YT %':<6} | {'Bili Total':<10} {'Bili >8':<8} {'Bili %':<6} | {'Diff (>8)':<10}"
    print("=" * len(header))
    print(header)
    print("-" * len(header))
    
    total_stats = {
        'yt_total': 0, 'yt_high': 0,
        'bili_total': 0, 'bili_high': 0
    }
    
    chars = list(string.ascii_lowercase)
    
    for char in chars:
        yt_path = os.path.join(data_dir, f"index_youtube_{char}.json")
        bili_path = os.path.join(data_dir, f"index_bilibili_{char}.json")
        
        yt_t, yt_h = get_stats(yt_path, threshold)
        bili_t, bili_h = get_stats(bili_path, threshold)
        
        # Accumulate totals
        total_stats['yt_total'] += yt_t
        total_stats['yt_high'] += yt_h
        total_stats['bili_total'] += bili_t
        total_stats['bili_high'] += bili_h
        
        # Calc percentages
        yt_pct = (yt_h / yt_t * 100) if yt_t > 0 else 0
        bili_pct = (bili_h / bili_t * 100) if bili_t > 0 else 0
        
        diff = bili_h - yt_h
        
        print(f"{char:<4} | {yt_t:<8} {yt_h:<8} {yt_pct:5.1f}% | {bili_t:<10} {bili_h:<8} {bili_pct:5.1f}% | {diff:<10}")

    print("-" * len(header))
    
    # Grand Totals
    g_yt_t = total_stats['yt_total']
    g_yt_h = total_stats['yt_high']
    g_bili_t = total_stats['bili_total']
    g_bili_h = total_stats['bili_high']
    
    g_yt_pct = (g_yt_h / g_yt_t * 100) if g_yt_t > 0 else 0
    g_bili_pct = (g_bili_h / g_bili_t * 100) if g_bili_t > 0 else 0
    g_diff = g_bili_h - g_yt_h
    
    print(f"{'ALL':<4} | {g_yt_t:<8} {g_yt_h:<8} {g_yt_pct:5.1f}% | {g_bili_t:<10} {g_bili_h:<8} {g_bili_pct:5.1f}% | {g_diff:<10}")
    print("=" * len(header))

if __name__ == "__main__":
    main()
