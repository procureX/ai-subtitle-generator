import os
import time
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from config import UPLOAD_DIR
from models import GenerateRequest
from utils.ffmpeg_utils import get_video_duration

router = APIRouter()

@router.post("/generate/{filename}")
def generate_captions_stream(filename: str, data: GenerateRequest):
    """Streams live multi-bar AI progression updates back to the workspace dashboard."""
    video_path = os.path.join(UPLOAD_DIR, f"{filename}.mp4")
    if not os.path.exists(video_path):
        video_path = os.path.join(UPLOAD_DIR, f"{filename}.webm")

    audio_path = os.path.join(UPLOAD_DIR, f"{filename}.mp3")
    english_srt = os.path.join(UPLOAD_DIR, f"{filename}_en.srt")
    target_srt = os.path.join(UPLOAD_DIR, f"{filename}_{data.lang}.srt")

    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio track not prepared yet.")

    total_duration = get_video_duration(video_path) or 1.0

    def ai_pipeline_iterator():
        try:
            # --- PHASE 3: WHISPER TRANSCRIPTION ---
            if not os.path.exists(english_srt):
                yield "event: transcription_start\ndata: Connected to neural engine...\n\n"

                from transcribe import transcribe_stream
                for pct in transcribe_stream(audio_path, english_srt, total_duration):
                    yield f"event: transcription_progress\ndata: {pct}\n\n"
                    time.sleep(0.01)  # Forces network buffer optimization flush

            yield "event: transcription_complete\ndata: 100\n\n"

            # --- PHASE 4: TRANSLATION MATRIX ENGINE ---
            if data.lang != "en":
                yield "event: translation_start\ndata: Initializing text layer translations...\n\n"

                from translator import translate_srt_stream
                for pct in translate_srt_stream(english_srt, data.lang, target_srt):
                    yield f"event: translation_progress\ndata: {pct}\n\n"

            yield "event: translation_complete\ndata: 100\n\n"

        except Exception as e:
            import traceback
            print(f"⚠️ Pipeline error: {e}")
            traceback.print_exc()
            yield f"event: error\ndata: {str(e)}\n\n"

    return StreamingResponse(ai_pipeline_iterator(), media_type="text/event-stream")
