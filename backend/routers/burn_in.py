import os
import subprocess
import threading
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, FileResponse

from config import UPLOAD_DIR
from utils.ffmpeg_utils import get_video_duration, build_subtitles_filter

router = APIRouter()

@router.post("/burn-in/{filename}/{lang}")
def burn_in_captions(filename: str, lang: str):
    """Hardcodes (burns in) the given language's captions onto the video via
    ffmpeg's subtitles filter, streaming progress back over SSE."""
    video_path = os.path.join(UPLOAD_DIR, f"{filename}.mp4")
    if not os.path.exists(video_path):
        video_path = os.path.join(UPLOAD_DIR, f"{filename}.webm")

    srt_path = os.path.join(UPLOAD_DIR, f"{filename}_{lang}.srt")
    output_path = os.path.join(UPLOAD_DIR, f"{filename}_{lang}_burned.mp4")

    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Source video missing.")
    if not os.path.exists(srt_path):
        raise HTTPException(status_code=404, detail=f"No generated captions found for language '{lang}'. Generate them first.")

    total_duration = get_video_duration(video_path) or 1.0

    def stream_burn_in():
        process = None
        try:
            cmd = [
                "ffmpeg", "-i", video_path,
                "-vf", build_subtitles_filter(srt_path),
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-pix_fmt", "yuv420p",
                "-c:a", "copy",
                "-progress", "pipe:1",
                "-y", output_path,
            ]
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

            # ffmpeg writes a lot of diagnostic output to stderr while encoding.
            # If nothing reads it, the OS pipe buffer fills up and ffmpeg blocks
            # on write() indefinitely — the process looks "stuck" but is actually
            # deadlocked. Drain it continuously on a background thread instead of
            # only reading it after the process exits.
            stderr_lines = []

            def _drain_stderr():
                for line in process.stderr:
                    stderr_lines.append(line)

            stderr_thread = threading.Thread(target=_drain_stderr, daemon=True)
            stderr_thread.start()

            while True:
                line = process.stdout.readline()
                if not line:
                    break
                if "out_time_ms=" in line:
                    try:
                        time_ms = float(line.split("=")[1].strip())
                        current_seconds = time_ms / 1000000.0
                        pct = min(int((current_seconds / total_duration) * 100), 100)
                        yield f"event: burn_in_progress\ndata: {pct}\n\n"
                    except Exception:
                        pass

            return_code = process.wait()
            stderr_thread.join(timeout=5)

            if return_code != 0:
                stderr_output = "".join(stderr_lines)
                raise RuntimeError(f"ffmpeg exited with code {return_code}: {stderr_output[-500:]}")

            output_filename = os.path.basename(output_path)
            yield f"event: burn_in_complete\ndata: {output_filename}\n\n"

        except Exception as e:
            import traceback
            print(f"⚠️ Burn-in error: {e}")
            traceback.print_exc()
            yield f"event: error\ndata: {str(e)}\n\n"

    return StreamingResponse(stream_burn_in(), media_type="text/event-stream")

@router.get("/download-video/{filename}")
def download_video(filename: str):
    """Serves a video file (e.g. a burned-in output) as a downloadable attachment,
    and also works for previewing it inline (e.g. a <video> tag src)."""
    video_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video not found.")
    return FileResponse(video_path, media_type="video/mp4", filename=filename)
