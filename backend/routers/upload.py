import os
from fastapi import APIRouter, UploadFile, File, HTTPException

from config import UPLOAD_DIR

router = APIRouter()

@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    """Handles raw saving of file stream to disk."""
    ALLOWED_EXTENSIONS = (".mp4", ".webm")
    if not file.filename.lower().endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Only .mp4 and .webm video files are supported!")

    video_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(video_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            buffer.write(chunk)

    base_filename, _ = os.path.splitext(file.filename)
    return {"base_filename": base_filename, "filename": file.filename}
