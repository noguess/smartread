import os
import json
import re

# Common English stop words to filter out
STOP_WORDS = {
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about',
    'and', 'but', 'or', 'nor', 'so', 'yet',
    'it', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'its', 'our', 'their',
    'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
    'do', 'does', 'did', 'done',
    'have', 'has', 'had',
    'go', 'come', 'take', 'make', 'get',
    'one', 'two', 'three',
    'yes', 'no', 'not', 'yeah', 'ok', 'okay', 'umm', 'uh'
}

class TextProcessor:
    """Simple text processor for lemmatization"""
    def lemmatize(self, word):
        # Lowercase and strip punctuation
        return word.lower().strip('.,!?()[]{}"\'')

def get_transcription_cache_path(video_path):
    """Get path for transcription cache json"""
    return f"{video_path}.transcription.json"

CACHE_VERSION = "3.0"  # Version for cache format

def save_transcription_cache(cache_path, words, video_info):
    """Save transcription result to cache with version"""
    data = {
        "version": CACHE_VERSION,
        "info": video_info,
        "words": words
    }
    with open(cache_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_transcription_cache(cache_path):
    """Load transcription from cache, check version"""
    if os.path.exists(cache_path):
        try:
            with open(cache_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Version check
            if data.get('version') != CACHE_VERSION:
                print(f"    Cache version mismatch, will re-transcribe")
                return None
                
            return data
        except Exception as e:
            print(f"    Error loading cache: {e}, will re-transcribe")
            return None
    return None

def deduplicate_occurrences(occurrences, time_threshold=60):
    """
    Remove duplicate occurrences that are too close in time.
    
    Args:
        occurrences: List of occurrence dicts with 'v', 't', 'c' keys
        time_threshold: Minimum time gap (seconds) between kept occurrences
        
    Returns:
        Deduplicated list
    """
    if not occurrences:
        return occurrences
    
    # Sort by time
    sorted_occs = sorted(occurrences, key=lambda x: x['t'])
    
    # Keep first occurrence, then only keep if time gap > threshold
    result = [sorted_occs[0]]
    
    for occ in sorted_occs[1:]:
        # Check time difference with last kept occurrence
        if occ['t'] - result[-1]['t'] >= time_threshold:
            result.append(occ)
    
    return result

def smart_filter_taught_words(word_index, time_window=120, min_score=10, whitelist=None):
    """
    Smartly filter taught words based on multi-dimensional scoring.
    Also assigns a score 's' to each occurrence for frontend sorting.
    
    Scoring Rules:
    1. Base Score: +1 per occurrence
    2. Density Score: +2 per occurrence in high-density window
    3. Context Score: +5 if context contains intro patterns ("这个单词", "意思是"...)
    4. Isolation Score: +2 if context contains Chinese characters (mixed language)
    
    Args:
        word_index: Dict of {word: [occurrences]}
        time_window: Sliding window size (seconds)
        min_score: Minimum total score to keep the word
        whitelist: Set of words to keep regardless of score (e.g. from existing index)
        
    Returns:
        Filtered dict with only "taught" words, each occurrence having an 's' field
    """
    filtered_index = {}
    whitelist = whitelist or set()
    
    # Intro patterns that strongly suggest a word is being taught
    INTRO_PATTERNS = [
        "这个单词", "单词叫做", "单词是", "意思是", "叫", "翻译成", "什么意思",
        "怎么来记", "看这个词", "读一下", "再读一遍", "什么鬼", "怎么讲"
    ]
    
    for word, occurrences in word_index.items():
        # 1. Calculate Density Map (which occurrences are in dense regions)
        timestamps = sorted([occ['t'] for occ in occurrences])
        dense_timestamps = set()
        
        max_density = 0
        for i in range(len(timestamps)):
            window_end = timestamps[i] + time_window
            current_window_timestamps = []
            for t in timestamps[i:]:
                if t <= window_end:
                    current_window_timestamps.append(t)
                else:
                    break
            
            count = len(current_window_timestamps)
            max_density = max(max_density, count)
            
            # If this window is dense, mark all timestamps in it
            if count >= 3:
                for t in current_window_timestamps:
                    dense_timestamps.add(t)
        
        # 2. Calculate Individual Scores & Total Score
        total_word_score = 0
        
        # Base Score for the word (based on total count)
        base_word_score = len(occurrences)
        total_word_score += base_word_score
        
        # Density Bonus for the word
        if max_density >= 3:
            total_word_score += max_density * 2
            
        # Calculate score for each occurrence
        for occ in occurrences:
            occ_score = 1 # Base score for this occurrence
            
            # Context Score
            context = occ['c']
            if any(p in context for p in INTRO_PATTERNS):
                occ_score += 5
                total_word_score += 5 # Add to word total
            
            # Isolation Score (Chinese characters)
            if any('\u4e00' <= char <= '\u9fff' for char in context):
                occ_score += 2
                total_word_score += 2 # Add to word total
                
            # Density Score (is this specific occurrence in a dense region?)
            if occ['t'] in dense_timestamps:
                occ_score += 2
                
            # Save score to occurrence
            occ['s'] = occ_score
            
        # Cap total context/isolation score contributions to avoid spam
        # (Simplified logic: we trust the sum of individual scores roughly reflects importance)
            
        if total_word_score >= min_score or word in whitelist:
            filtered_index[word] = occurrences
            
    return filtered_index
