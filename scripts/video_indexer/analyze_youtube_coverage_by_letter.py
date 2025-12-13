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

def load_youtube_words(pattern):
    youtube_words = set()
    files = glob.glob(pattern)
    for f in files:
        try:
            with open(f, 'r', encoding='utf-8') as jf:
                data = json.load(jf)
                youtube_words.update(data.keys())
        except Exception as e:
            print(f"Error loading index shard {f}: {e}")
    return youtube_words

def main():
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    word_book_path = os.path.join(project_root, 'public', 'cihuibiao', 'zkgaopinci666.csv')
    youtube_pattern = os.path.join(project_root, 'public', 'data', 'index_youtube_*.json')
    
    # 1. Load Data
    book_words = load_word_book(word_book_path)
    yt_index = load_youtube_words(youtube_pattern)
    
    print(f"Total Words in Book: {len(book_words)}")
    print(f"Total YouTube Index Size: {len(yt_index)}")
    print("-" * 60)
    
    header = f"{'Char':<6} {'Book Total':<12} {'Covered':<10} {'Coverage %':<12} {'Missing':<10}"
    print(header)
    print("-" * 60)
    
    total_book = 0
    total_covered = 0
    
    # Analyze by letter
    chars = list(string.ascii_lowercase)
    
    for char in chars:
        # Filter book words starting with char
        book_subset = {w for w in book_words if w.startswith(char)}
        subset_total = len(book_subset)
        
        if subset_total == 0:
            print(f"{char:<6} {0:<12} {0:<10} {'N/A':<12} {0:<10}")
            continue
            
        # Find how many are in YouTube index
        covered_subset = book_subset.intersection(yt_index)
        covered_count = len(covered_subset)
        
        percentage = (covered_count / subset_total) * 100
        missing_count = subset_total - covered_count
        
        print(f"{char:<6} {subset_total:<12} {covered_count:<10} {percentage:6.1f}%      {missing_count:<10}")
        
        total_book += subset_total
        total_covered += covered_count
        
    print("-" * 60)
    total_pct = (total_covered / total_book * 100) if total_book > 0 else 0
    print(f"{'ALL':<6} {total_book:<12} {total_covered:<10} {total_pct:6.1f}%      {total_book - total_covered:<10}")
    print("=" * 60)

if __name__ == "__main__":
    main()
