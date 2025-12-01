import stable_whisper
import tempfile
import os
import subprocess

class ASREngine:
    def __init__(self, model_size="base"):
        print(f"Loading Whisper model ({model_size})...")
        self.model = stable_whisper.load_model(model_size)

    def transcribe(self, video_path):
        """
        Transcribes video by extracting audio temporarily.
        Returns list of word segments: [{'word': str, 'start': float, 'end': float}, ...]
        
        CRITICAL: Original video file is NEVER modified.
        """
        print(f"Transcribing {video_path}...")
        
        # Extract audio to temporary file
        temp_audio = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        temp_audio_path = temp_audio.name
        temp_audio.close()
        
        try:
            # Use ffmpeg to extract audio stream (READ-ONLY operation on video)
            subprocess.run([
                'ffmpeg', '-i', video_path,
                '-vn',  # No video
                '-acodec', 'pcm_s16le',  # WAV format
                '-ar', '16000',  # 16kHz sample rate
                '-ac', '1',  # Mono
                temp_audio_path,
                '-y'  # Overwrite temp file
            ], check=True, capture_output=True)
            
            # Perform ASR on temporary audio
            # Optimizations for speed:
            # - language="en": skip auto-detection (saves ~5-10 seconds)
            # - verbose=False: reduce console output overhead
            result = self.model.transcribe(
                temp_audio_path,
                language="en",  
                verbose=False
            )
            
            words = []
            for segment in result.segments:
                for word_obj in segment.words:
                    words.append({
                        'word': word_obj.word.strip(),
                        'start': word_obj.start,
                        'end': word_obj.end
                    })
            
            return words
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)
