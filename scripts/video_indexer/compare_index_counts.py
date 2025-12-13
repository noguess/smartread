import json
import os
import string

def get_word_count(filepath):
    if not os.path.exists(filepath):
        return 0
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return len(data)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return 0

def main():
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    data_dir = os.path.join(project_root, 'public', 'data')
    
    print(f"{'Letter':<6} {'YouTube':<10} {'Bilibili':<10} {'Diff (YT-Bili)':<15}")
    print("-" * 45)
    
    total_yt = 0
    total_bili = 0
    
    # Check a-z
    chars = list(string.ascii_lowercase)
    
    for char in chars:
        yt_path = os.path.join(data_dir, f"index_youtube_{char}.json")
        bili_path = os.path.join(data_dir, f"index_bilibili_{char}.json")
        
        yt_count = get_word_count(yt_path)
        bili_count = get_word_count(bili_path)
        
        diff = yt_count - bili_count
        
        print(f"{char:<6} {yt_count:<10} {bili_count:<10} {diff:<15}")
        
        total_yt += yt_count
        total_bili += bili_count
        
    print("-" * 45)
    print(f"{'TOTAL':<6} {total_yt:<10} {total_bili:<10} {total_yt - total_bili:<15}")

if __name__ == "__main__":
    main()
