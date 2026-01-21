import os
import argparse
import sys
from google import genai
from google.genai import types

# Initialize Google GenAI client
client = None

def get_client():
    global client
    if client is None:
        # Check for keys. The SDK defaults to GOOGLE_API_KEY, but we support GEMINI_API_KEY too
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        
        if not api_key:
            print("❌ Error: API Key not found.")
            print("Please set GOOGLE_API_KEY or GEMINI_API_KEY.")
            sys.exit(1)
            
        client = genai.Client(api_key=api_key)
    return client

# Default to Gemini 2.0 Flash as it is stable and fast, but user requested 3-pro capability. 
# Let's default to what they asked for "gemini-2.0-flash-exp" is often better for general tasks, 
# "gemini-3-pro-preview" is the cutting edge. I will set the default to the one in their example?
# Actually the example used `gemini-3-pro-preview`. 
# However, for transcript cleaning, flash is usually sufficient and faster.
# I'll enable the user to override, but set default to `gemini-2.0-flash-exp` for reliability if they don't have access to 3-pro-preview whitelisted yet? 
# No, let's trust the user has access. They said "Use gemini 3 pro".
DEFAULT_MODEL = os.getenv("LLM_MODEL", "gemini-3-pro-preview")

import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

import time
# from google.api_core import exceptions # Not needed, we catch Exception

class chunk_status:
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"

def generate_with_retry(prompt, text, model, temperature=0.3, max_retries=5, initial_delay=2):
    """
    Helper to call Gemini with retry logic. 
    Raises Exception if all retries fail, allowing the caller to handle the failure state.
    """
    delay = initial_delay
    last_error = None
    
    for attempt in range(max_retries):
        try:
            response = get_client().models.generate_content(
                model=model,
                contents=[prompt, text],
                config=types.GenerateContentConfig(
                    temperature=temperature
                )
            )
            return response.text.strip()
        except Exception as e:
            last_error = e
            # Check for recoverable errors (Rate Limit or Server Errors)
            error_str = str(e)
            is_rate_limit = "429" in error_str or "RESOURCE_EXHAUSTED" in error_str
            is_server_error = "500" in error_str or "503" in error_str or "disconnected" in error_str
            
            if is_rate_limit or is_server_error:
                logger.warning(f"    ⏳ Transient error ({error_str[:50]}...). Retrying in {delay}s... (Attempt {attempt+1}/{max_retries})")
                time.sleep(delay)
                delay *= 2 # Exponential backoff
            else:
                # Non-recoverable error (e.g. Bad Request), retry might not help but let's try a few times just in case
                logger.error(f"    ⚠️  Possible non-recoverable error: {e}")
                time.sleep(delay)
                
    raise last_error

def process_single_chunk(func, chunk, index, total):
    """
    Wrapper to process a single chunk and return result dict.
    """
    try:
        result_text = func(chunk) # specific clean/translate func
        return {
            "status": chunk_status.SUCCESS,
            "text": result_text,
            "original": chunk
        }
    except Exception as e:
        logger.error(f"❌ Chunk {index+1}/{total} Failed after retries: {e}")
        return {
            "status": chunk_status.FAILED,
            "text": chunk, # Keep original as fallback
            "original": chunk,
            "error": str(e)
        }

def robust_batch_process(chunks, process_func, phase_name="Processing"):
    """
    Two-Pass processing strategy.
    Pass 1: Try all.
    Pass 2: Retry failures.
    """
    results = [None] * len(chunks)
    failed_indices = []

    print(f"\n🚀 Starting {phase_name} (Total chunks: {len(chunks)})")
    
    # --- Pass 1 ---
    for i, chunk in enumerate(chunks):
        print(f"  🔹 [Pass 1] {phase_name} chunk {i+1}/{len(chunks)} ({len(chunk)} chars)...")
        res = process_single_chunk(process_func, chunk, i, len(chunks))
        results[i] = res
        if res["status"] == chunk_status.FAILED:
            failed_indices.append(i)

    # --- Pass 2 (Recovery) ---
    if failed_indices:
        print(f"\n⚠️  {len(failed_indices)} chunks failed in Pass 1. Starting Recovery Pass...")
        
        for idx in failed_indices:
            print(f"  🚑 [Pass 2] Retrying chunk {idx+1}...")
            # Retry with specific logic if needed? For now just call again (maybe network implies it works now)
            # We could increase retries or delay here if we wanted deeper control.
            # But generate_with_retry already does heavy lifting. 
            # We'll just try one more time completely.
            chunk = chunks[idx]
            res = process_single_chunk(process_func, chunk, idx, len(chunks))
            results[idx] = res
            
            if res["status"] == chunk_status.SUCCESS:
                print(f"    ✅ Recovered chunk {idx+1}!")
            else:
                print(f"    ❌ Chunk {idx+1} failed again. Keeping original text.")

    # Combine results
    final_texts = [r["text"] for r in results]
    return "\n\n".join(final_texts)

def clean_transcript(text):
    """
    Uses LLM to clean ASR errors, fillers, and fix punctuation.
    """
    prompt = (
        "You are an expert editor. The following text is a raw transcription from a video. "
        "It may contain ASR errors, phonetic mix-ups, filler words (um, ah, you know), and lack proper punctuation. "
        "Please rewrite the text to be clear, grammatically correct, and easy to read, "
        "while preserving the original meaning and tone. "
        "Do NOT summarize. Output the full corrected text only."
    )

    return generate_with_retry(prompt, text, DEFAULT_MODEL)

def translate_transcript(text):
    """
    Uses LLM to translate text to Simplified Chinese.
    """
    prompt = (
        """
        You are an expert translator specializing in localized content. Translate the provided English text (which has been proofread) into native, professional Simplified Chinese.

        Requirements:

            Avoid Translationese: Do not mechanically translate English sentence structures (e.g., long relative clauses). Break them down into shorter, logical Chinese phrases.

            Tone: Maintain the professional yet conversational tone of an interview.

            Terminology: Ensure technical terms are accurate based on the context.

        Output: Output only the translated text."""
    )

    return generate_with_retry(prompt, text, DEFAULT_MODEL)

def split_text_into_chunks(text, max_chars=4000):
    """
    Splits text into chunks respecting paragraph boundaries (\n\n).
    Tries to keep each chunk under max_chars, but enforces sentence boundaries
    where possible.
    """
    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = []
    current_length = 0
    
    # Sentence ending punctuation
    sentence_endings = ('.', '!', '?', '"', "'", '”', '’')

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
            
        para_len = len(para)
        
        # Condition to start a new chunk:
        # 1. Current chunk is big enough (> max_chars)
        # 2. AND (Crucial): The LAST paragraph in current_chunk ended with a sentence 
        #    boundary. If it didn't, we prefer to keep appending to complete the sentence/thought.
        #    (Unless we get too huge, e.g. 1.5x limit, then forced split)
        
        is_big_enough = current_length + para_len > max_chars
        
        last_para_ended_sentence = True
        if current_chunk:
            last_para_ended_sentence = current_chunk[-1].strip().endswith(sentence_endings)
            
        force_split = current_length > max_chars * 1.5 # Safety valve
        
        if (is_big_enough and last_para_ended_sentence) or force_split:
            if current_chunk:
                chunks.append("\n\n".join(current_chunk))
                current_chunk = []
                current_length = 0
        
        current_chunk.append(para)
        current_length += para_len + 2 # +2 for \n\n

    if current_chunk:
        chunks.append("\n\n".join(current_chunk))
    
    return chunks

def process_file(input_file, clean_only=False):
    if not os.path.exists(input_file):
        print(f"❌ Error: Input file '{input_file}' not found.")
        return

    print(f"📖 Reading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        raw_text = f.read()

    if not raw_text.strip():
        print("❌ Error: File is empty.")
        return

    # --- Step 1: Cleaning ---
    chunks = split_text_into_chunks(raw_text)
    full_cleaned_text = robust_batch_process(chunks, clean_transcript, phase_name="Cleaning")
    
    # Save cleaned
    base_name = os.path.splitext(input_file)[0]
    cleaned_file = f"{base_name}_cleaned.txt"
    with open(cleaned_file, 'w', encoding='utf-8') as f:
        f.write(full_cleaned_text)
    print(f"✅ Saved clean text to: {cleaned_file}")

    if clean_only:
        print("🛑 --clean-only flag set. Skipping translation.")
        return

    # --- Step 2: Translation ---
    # Re-chunk safely
    translate_chunks = split_text_into_chunks(full_cleaned_text)
    full_translated_text = robust_batch_process(translate_chunks, translate_transcript, phase_name="Translating")
    
    # Save translated
    zh_file = f"{base_name}_zh.txt"
    with open(zh_file, 'w', encoding='utf-8') as f:
        f.write(full_translated_text)
    print(f"✅ Saved translation to: {zh_file}")

def main():
    parser = argparse.ArgumentParser(description='Clean and Translate Transcriptions')
    parser.add_argument('input_file', help='Path to the input text file')
    parser.add_argument('--clean-only', action='store_true', help='Only clean the transcript, skip translation')
    
    args = parser.parse_args()
    
    process_file(args.input_file, clean_only=args.clean_only)

if __name__ == "__main__":
    main()
