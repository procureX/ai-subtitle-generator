import os
import subprocess


def get_video_duration(video_path):
    """Uses ffprobe to get the exact total duration of the video in seconds."""
    cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video_path]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    try:
        return float(result.stdout.strip())
    except ValueError:
        return 0.0


def build_subtitles_filter(srt_path: str) -> str:
    """
    Builds an ffmpeg -vf subtitles=... filter argument with the path properly
    escaped. ffmpeg's filtergraph syntax treats ':', '\\', and '\'' specially,
    so raw paths (especially containing spaces or drive letters) need escaping.
    """
    abs_path = os.path.abspath(srt_path)
    escaped = abs_path.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")
    return f"subtitles='{escaped}'"


def stream_ffmpeg_extraction(video_path, audio_path, total_duration):
    """Runs FFmpeg and yields progress percentages periodically as chunks compile."""
    if total_duration == 0:
        yield "data: 100\n\n"
        return

    cmd = [
        "ffmpeg", "-i", video_path, "-q:a", "0", "-map", "a",
        "-progress", "pipe:1", "-y", audio_path
    ]

    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)

    while True:
        line = process.stdout.readline()
        if not line:
            break

        if "out_time_ms=" in line:
            try:
                time_ms = float(line.split("=")[1].strip())
                current_seconds = time_ms / 1000000.0
                percentage = min(int((current_seconds / total_duration) * 100), 100)
                yield f"data: {percentage}\n\n"
            except Exception:
                pass

    process.communicate()
    yield "data: 100\n\n"
