import os

# Single source of truth for where uploaded videos, extracted audio, and
# generated .srt files live on disk. Every router imports this instead of
# each redefining/hardcoding "temp_storage" independently.
UPLOAD_DIR = "temp_storage"
os.makedirs(UPLOAD_DIR, exist_ok=True)
