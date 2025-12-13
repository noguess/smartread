import csv
import json
import glob
import os
import string

def load_word_book(filepath):
    words = set()
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader) # Skip header
            for row in reader:
                if len(row) >= 2:
                    words.add(row[1].strip().lower())
    except Exception as e:
        print(f"Error loading word book: {e}")
    return words

def load_index_words(pattern):
    indexed_words = set()
    files = glob.glob(pattern)
    for f in files:
        try:
            with open(f, 'r', encoding='utf-8') as jf:
                data = json.load(jf)
                indexed_words.update(data.keys())
        except Exception as e:
            print(f"Error loading index shard {f}: {e}")
    return indexed_words

def main():
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    word_book_path = os.path.join(project_root, 'public', 'cihuibiao', 'zkgaopinci666.csv')
    
    # 1. Load Data
    book_words = load_word_book(word_book_path)
    
    youtube_pattern = os.path.join(project_root, 'public', 'data', 'index_youtube_*.json')
    bilibili_pattern = os.path.join(project_root, 'public', 'data', 'index_bilibili_*.json')
    
    yt_index = load_index_words(youtube_pattern)
    bili_index = load_index_words(bilibili_pattern)
    
    # 2. Calculate Effective Words (Intersection)
    yt_effective = book_words.intersection(yt_index)
    bili_effective = book_words.intersection(bili_index)
    
    # 3. Calculations
    yt_only = yt_effective - bili_effective
    bili_only = bili_effective - yt_effective
    
    print("=" * 60)
    print(f"EFFECTIVE WORD COVERAGE (Base: {len(book_words)} words)")
    print("=" * 60)
    print(f"{'Platform':<15} {'Covered':<10} {'% of Book':<10}")
    print("-" * 60)
    print(f"{'YouTube':<15} {len(yt_effective):<10} {len(yt_effective)/len(book_words)*100:.1f}%")
    print(f"{'Bilibili':<15} {len(bili_effective):<10} {len(bili_effective)/len(book_words)*100:.1f}%")
    print("-" * 60)
    print(f"Difference (YouTube - Bilibili): {len(yt_effective) - len(bili_effective)}")
    print("=" * 60)
    
    print(f"\nUnique Contributions of Each Platform to Effective Coverage:")
    print("-" * 60)
    print(f"YouTube Only ({len(yt_only)} words):")
    if yt_only:
        print(", ".join(sorted(list(yt_only))))
    else:
        print("(None)")
        
    print("-" * 60)
    print(f"Bilibili Only ({len(bili_only)} words):")
    if bili_only:
        # Too many? Show sample
        bili_list = sorted(list(bili_only))
        if len(bili_list) > 20:
             print(", ".join(bili_list[:20]) + f" ... and {len(bili_list)-20} more")
        else:
             print(", ".join(bili_list))
    print("=" * 60)

if __name__ == "__main__":
    main()
