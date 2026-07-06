import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from config import UPLOAD_DIR
from utils.ffmpeg_utils import get_video_duration, stream_ffmpeg_extraction

router = APIRouter()

@router.get("/extract-audio-progress/{filename}")
def extract_audio_progress(filename: str):
    """Server-Sent Events (SSE) endpoint tracking the real FFmpeg extraction progress loop."""
    video_path = os.path.join(UPLOAD_DIR, filename)
    base_filename, _ = os.path.splitext(filename)
    audio_path = os.path.join(UPLOAD_DIR, f"{base_filename}.mp3")

    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video missing.")

    duration = get_video_duration(video_path)
    return StreamingResponse(stream_ffmpeg_extraction(video_path, audio_path, duration), media_type="text/event-stream")
