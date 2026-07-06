from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import upload, audio, generate, captions, burn_in

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(audio.router)
app.include_router(generate.router)
app.include_router(captions.router)
app.include_router(burn_in.router)
