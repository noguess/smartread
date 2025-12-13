import csv
import json
import glob
import os

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
    
    print(f"Loading word book from: {word_book_path}")
    book_words = load_word_book(word_book_path)
    print(f"Total words in book: {len(book_words)}")
    
    youtube_pattern = os.path.join(project_root, 'public', 'data', 'index_youtube_*.json')
    bilibili_pattern = os.path.join(project_root, 'public', 'data', 'index_bilibili_*.json')
    
    yt_words = load_index_words(youtube_pattern)
    bili_words = load_index_words(bilibili_pattern)
    
    all_indexed = yt_words.union(bili_words)
    
    found_in_yt = book_words.intersection(yt_words)
    found_in_bili = book_words.intersection(bili_words)
    found_total = book_words.intersection(all_indexed)
    
    print("-" * 40)
    print(f"YouTube Coverage: {len(found_in_yt)} / {len(book_words)} ({len(found_in_yt)/len(book_words)*100:.1f}%)")
    print(f"Bilibili Coverage: {len(found_in_bili)} / {len(book_words)} ({len(found_in_bili)/len(book_words)*100:.1f}%)")
    print("-" * 40)
    print(f"Total Coverage:   {len(found_total)} / {len(book_words)} ({len(found_total)/len(book_words)*100:.1f}%)")
    print("-" * 40)
    
    # Optional: List missing top 10
    missing = list(book_words - all_indexed)
    missing.sort()
    if missing:
        print(f"Missing words (Sample 10): {missing[:10]}")

if __name__ == "__main__":
    main()
