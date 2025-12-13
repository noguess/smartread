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
    yt_words = load_youtube_words(youtube_pattern)
    
    # 2. Filter: Words in YouTube but NOT in Book
    non_book_words = yt_words - book_words
    total_non_book = len(non_book_words)
    
    print(f"Total YouTube Words: {len(yt_words)}")
    print(f"Word Book Size: {len(book_words)}")
    print(f"Non-Book Words (YouTube - Book): {total_non_book}")
    print("=" * 60)
    
    if total_non_book == 0:
        print("No non-book words found in YouTube index.")
        return

    # 3. Group by Letter
    letter_counts = {char: 0 for char in string.ascii_lowercase}
    # Add a catch-all for others if needed, though index files are usually a-z
    
    for word in non_book_words:
        start_char = word[0].lower()
        if start_char in letter_counts:
            letter_counts[start_char] += 1
            
    # 4. Calculate Stats and Print
    header = f"{'Char':<6} {'Count':<8} {'% of Non-Book':<15}"
    print(header)
    print("-" * 40)
    
    # Sort by percentage descending? Or alphabetical? 
    # Usually distribution charts are either alphabetical or by magnitude. 
    # Let's do alphabetical as requested ("a starts with..., b starts with...")
    
    for char in string.ascii_lowercase:
        count = letter_counts[char]
        percentage = (count / total_non_book) * 100
        print(f"{char:<6} {count:<8} {percentage:5.1f}%")
        
    print("-" * 40)
    
    # Optional: Top contributors
    sorted_letters = sorted(letter_counts.items(), key=lambda item: item[1], reverse=True)
    print("\nTop 5 Contributors to Non-Book Words:")
    for char, count in sorted_letters[:5]:
        print(f"{char}: {count} ({count/total_non_book*100:.1f}%)")

if __name__ == "__main__":
    main()
