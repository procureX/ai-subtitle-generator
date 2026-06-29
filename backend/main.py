import os
import subprocess
from fastapi import FastAPI, UploadFile, File, HTTPException
# Import our brand new transcription function from the other file
from transcribe import generate_subtitles

app = FastAPI()
UPLOAD_DIR = "temp_storage"

@app.get("/")
def read_root():
    return {"message": "Hello! The Caption Generator backend is running successfully on Ubuntu!"}

@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    ALLOWED_EXTENSIONS = (".mp4", ".webm")
    if not file.filename.lower().endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Only .mp4 and .webm video files are supported!")

    video_path = os.path.join(UPLOAD_DIR, file.filename)
    base_filename, _ = os.path.splitext(file.filename)
    audio_path = os.path.join(UPLOAD_DIR, f"{base_filename}.mp3")
    # Define where our final caption file will live
    srt_path = os.path.join(UPLOAD_DIR, f"{base_filename}.srt")

    try:
        # Save the uploaded video
        with open(video_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):  
                buffer.write(chunk)

        # Extract audio using FFmpeg
        ffmpeg_command = [
            "ffmpeg", "-i", video_path, "-q:a", "0", "-map", "a", audio_path, "-y"
        ]
        subprocess.run(ffmpeg_command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # 🔥 NEW STEP: Run our local AI transcription function!
        generate_subtitles(audio_path, srt_path)

        return {
            "message": "Success! Video processed, audio extracted, and subtitles generated.",
            "video_file": video_path,
            "audio_file": audio_path,
            "caption_file": srt_path
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Something went wrong: {str(e)}")