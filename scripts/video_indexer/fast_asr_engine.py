import whisper
import tempfile
import os
import subprocess

class ASREngine:
    def __init__(self, model_size="base"):
        print(f"Loading Whisper model ({model_size})...")
        self.model = whisper.load_model(model_size)

    def transcribe(self, video_path):
        """
        Transcribes video using official Whisper.
        Returns list of word segments (simplified from sentence segments).
        
        CRITICAL: Original video file is NEVER modified.
        """
        print(f"Transcribing {video_path}...")
        
        try:
            # Use official Whisper - MUCH faster
            result = self.model.transcribe(
                video_path,  # Can process audio directly
                # language="en", # REMOVED: Allow auto-detection (or mixed)
                verbose=False,
                word_timestamps=False,  # Faster without word-level
                initial_prompt="这是一段包含English单词的中文讲解视频。" # Hint for mixed language
            )
            
            # Convert sentence segments to pseudo-word segments
            # This is a compromise: we get word positions but not as precise
            words = []
            for segment in result['segments']:
                text = segment['text'].strip()
                start_time = segment['start']
                end_time = segment['end']
                
                # Split sentence into words
                word_list = text.split()
                if not word_list:
                    continue
                
                # STRATEGY: Use segment start time for ALL words
                # This ensures we jump to the beginning of the sentence/phrase,
                # which provides better context than jumping to the exact word.
                segment_start = segment['start']
                segment_end = segment['end']
                
                for word in word_list:
                    words.append({
                        'word': word.strip(),
                        'start': round(segment_start, 2), # Jump to sentence start
                        'end': round(segment_end, 2)
                    })
            
            print(f"  Extracted {len(words)} words from {len(result['segments'])} segments")
            return words
            
        except Exception as e:
            print(f"Error transcribing: {e}")
            return []
