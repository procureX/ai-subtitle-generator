from typing import List
from pydantic import BaseModel


class CaptionLine(BaseModel):
    index: int
    start: str
    end: str
    text: str


class UpdateCaptionRequest(BaseModel):
    captions: List[CaptionLine]


class GenerateRequest(BaseModel):
    lang: str
