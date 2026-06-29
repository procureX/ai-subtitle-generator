import os
import subprocess
from fastapi import FastAPI, UploadFile, File, HTTPException
from transcribe import generate_subtitles
# Import your brand new translation function
from translator import translate_srt_file

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
    
    # Define our three distinct output caption files
    english_srt = os.path.join(UPLOAD_DIR, f"{base_filename}_en.srt")
    spanish_srt = os.path.join(UPLOAD_DIR, f"{base_filename}_es.srt")
    urdu_srt = os.path.join(UPLOAD_DIR, f"{base_filename}_ur.srt")

    try:
        # Save uploaded video file
        with open(video_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):  
                buffer.write(chunk)

        # Extract audio using FFmpeg
        ffmpeg_command = [
            "ffmpeg", "-i", video_path, "-q:a", "0", "-map", "a", audio_path, "-y"
        ]
        subprocess.run(ffmpeg_command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # 1. Generate the base English subtitles
        generate_subtitles(audio_path, english_srt)

        # 2. Automatically generate translation variations
        translate_srt_file(english_srt_path=english_srt, target_language='es', output_srt_path=spanish_srt)
        translate_srt_file(english_srt_path=english_srt, target_language='ur', output_srt_path=urdu_srt)

        return {
            "message": "Success! Video processed, and multi-language subtitles generated.",
            "video_file": video_path,
            "captions": {
                "english": english_srt,
                "spanish": spanish_srt,
                "urdu": urdu_srt
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Something went wrong: {str(e)}")