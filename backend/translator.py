import os
import srt
from deep_translator import GoogleTranslator

def translate_srt_file(english_srt_path: str, target_language: str, output_srt_path: str):
    print(f"🌐 Translating subtitles into code: '{target_language}'...")
    
    # 1. Read the existing English subtitle file
    with open(english_srt_path, "r", encoding="utf-8") as f:
        srt_content = f.read()
    
    # Parse the text into individual caption blocks we can iterate through
    subtitles = list(srt.parse(srt_content))
    
    # 2. Set up our free translation engine
    # 'en' is the source language; target_language will be 'es' (Spanish) or 'ur' (Urdu)
    translator = GoogleTranslator(source='en', target=target_language)
    
    # 3. Loop through each caption block and translate the text content
    for sub in subtitles:
        if sub.content.strip():  # Skip empty lines
            try:
                translated_text = translator.translate(sub.content)
                sub.content = translated_text
            except Exception as e:
                print(f"⚠️ Could not translate line '{sub.content}': {e}")
                
    # 4. Compile the translated blocks back into a standard subtitle format and save
    with open(output_srt_path, "w", encoding="utf-8") as f:
        f.write(srt.compose(subtitles))
        
    print(f"🎉 Created translated subtitle file at: {output_srt_path}")