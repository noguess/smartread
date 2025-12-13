import csv
import json
import os
import random

def load_word_book(filepath):
    words = set()
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader) 
            for row in reader:
                if len(row) >= 2:
                    words.add(row[1].strip().lower())
    except Exception as e:
        print(f"Error loading word book: {e}")
    return words

def main():
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    word_book_path = os.path.join(project_root, 'public', 'cihuibiao', 'zkgaopinci666.csv')
    youtube_s_path = os.path.join(project_root, 'public', 'data', 'index_youtube_s.json')
    
    book_words = load_word_book(word_book_path)
    
    # Load only 's' shard for Youtube
    yt_s_words = set()
    if os.path.exists(youtube_s_path):
        with open(youtube_s_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            yt_s_words.update(data.keys())
            
    # Filter
    missing_s = sorted(list(yt_s_words - book_words))
    
    print(f"Total 's' words in YouTube Index: {len(yt_s_words)}")
    print(f"Missing 's' words (not in Book): {len(missing_s)}")
    print("-" * 50)
    print("Examples of missing 's' words:")
    
    # Print first 10, middle 10, last 10 to give a range
    if len(missing_s) > 30:
        print(", ".join(missing_s[:10]))
        print("...")
        mid = len(missing_s) // 2
        print(", ".join(missing_s[mid-5:mid+5]))
        print("...")
        print(", ".join(missing_s[-10:]))
    else:
        print(", ".join(missing_s))

if __name__ == "__main__":
    main()
