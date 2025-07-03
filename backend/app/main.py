from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import health, meditate, visualize, audio, one_tap
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="Mindful Coach Backend MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(meditate.router, prefix="/api/meditate")
app.include_router(visualize.router, prefix="/api/visualize")
app.include_router(audio.router, prefix="/api/audio")
app.include_router(one_tap.router)

# Make sure the uploads directory exists
os.makedirs("uploads", exist_ok=True)

# Serve the uploads directory at /uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.on_event("startup")
def startup_event():
    print("Mindful Coach Backend MVP started!") 