import os
import re
import time
import srt
from deep_translator import GoogleTranslator

# Reuse one GoogleTranslator instance per target language instead of
# constructing a new one for every single subtitle line.
_translator_cache = {}

def _get_translator(target_lang: str) -> GoogleTranslator:
    if target_lang not in _translator_cache:
        _translator_cache[target_lang] = GoogleTranslator(source="en", target=target_lang)
    return _translator_cache[target_lang]

def translate_text_mock(text: str, target_lang: str) -> str:
    """
    Translates a single subtitle line into `target_lang` using Google Translate
    via the free deep-translator library (no API key required).

    Name kept as `translate_text_mock` for historical reasons — it does a
    real translation, not a mock.
    """
    cleaned_text = text.strip()
    if not cleaned_text:
        return cleaned_text

    try:
        translator = _get_translator(target_lang)
        result = translator.translate(cleaned_text)
        time.sleep(0.1)  # small pause between requests to avoid rate-limiting
        return result
    except Exception as e:
        # Don't let one failed line (e.g. a transient network hiccup or rate limit)
        # kill the whole subtitle file — fall back to the original English text
        # for that line, but make the failure visible in the server console.
        print(f"⚠️ Translation failed for '{cleaned_text[:50]}...': {e}")
        return cleaned_text

def translate_srt_stream(english_srt_path: str, target_language: str, output_srt_path: str):
    """
    Parses an SRT file, translates every line into target_language, and
    yields incremental progress percentages (0-100) as it goes. Writes the
    translated .srt to output_srt_path when done — including the zero-line
    edge case, which just writes an empty file.

    This replaces the previous callback-based translate_srt_file(), which
    required main.py to keep its own separate, nearly-identical inline loop
    just to get per-line progress into an SSE stream. A generator lets the
    route simply do `for pct in translate_srt_stream(...): yield ...`
    instead of duplicating this logic.
    """
    if not os.path.exists(english_srt_path):
        raise FileNotFoundError(f"Source SRT block missing at: {english_srt_path}")

    with open(english_srt_path, "r", encoding="utf-8") as f:
        content = f.read()

    subtitles = list(srt.parse(content))
    total_lines = len(subtitles)

    if total_lines == 0:
        with open(output_srt_path, "w", encoding="utf-8") as f:
            f.write("")
        yield 100
        return

    translated_subtitles = []
    for index, subtitle in enumerate(subtitles):
        translated_text = translate_text_mock(subtitle.content, target_language)
        translated_subtitles.append(srt.Subtitle(
            index=subtitle.index,
            start=subtitle.start,
            end=subtitle.end,
            content=translated_text
        ))
        yield min(int(((index + 1) / total_lines) * 100), 100)

    with open(output_srt_path, "w", encoding="utf-8") as f:
        f.write(srt.compose(translated_subtitles))
