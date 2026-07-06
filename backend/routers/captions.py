import os
import datetime
import urllib.parse
import srt
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from config import UPLOAD_DIR
from models import UpdateCaptionRequest

router = APIRouter()

@router.get("/captions/{filename}/{lang}")
def get_captions(filename: str, lang: str):
    srt_path = os.path.join(UPLOAD_DIR, f"{filename}_{lang}.srt")
    if not os.path.exists(srt_path):
        raise HTTPException(status_code=404, detail="Subtitles missing.")
    with open(srt_path, "r", encoding="utf-8") as f:
        content = f.read()
    subtitles = list(srt.parse(content))
    return {"captions": [{"index": s.index, "start": str(s.start), "end": str(s.end), "text": s.content} for s in subtitles]}

@router.get("/captions/{filename}/{lang}/download")
def download_captions(filename: str, lang: str):
    """Serves the generated .srt file as a downloadable attachment."""
    srt_path = os.path.join(UPLOAD_DIR, f"{filename}_{lang}.srt")
    if not os.path.exists(srt_path):
        raise HTTPException(status_code=404, detail="Subtitles missing.")

    with open(srt_path, "r", encoding="utf-8") as f:
        content = f.read()

    download_name = f"{filename}_{lang}.srt"
    # RFC 5987 encoding so filenames with spaces/unicode download correctly across browsers
    quoted_name = urllib.parse.quote(download_name)
    headers = {
        "Content-Disposition": f"attachment; filename=\"{download_name}\"; filename*=UTF-8''{quoted_name}"
    }
    return Response(content=content, media_type="application/x-subrip", headers=headers)

@router.put("/captions/{filename}/{lang}")
def update_captions(filename: str, lang: str, data: UpdateCaptionRequest):
    srt_path = os.path.join(UPLOAD_DIR, f"{filename}_{lang}.srt")
    blocks = []
    for line in data.captions:
        h_s, m_s, s_s = map(float, line.start.split(':'))
        h_e, m_e, s_e = map(float, line.end.split(':'))
        blocks.append(srt.Subtitle(index=line.index, start=datetime.timedelta(hours=h_s, minutes=m_s, seconds=s_s), end=datetime.timedelta(hours=h_e, minutes=m_e, seconds=s_e), content=line.text))
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write(srt.compose(blocks))
    return {"message": "Successfully updated!"}
