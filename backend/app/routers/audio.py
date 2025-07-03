from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.config import settings
import requests
import os
import uuid

router = APIRouter()

MOCK_VOICES = [
    {
        "id": "21m00Tcm4TlvDq8ikWAM",
        "name": "Sarah (Calm)",
        "category": "meditation",
        "description": "Soothing and peaceful voice",
        "previewUrl": "https://cdn.elevenlabs.io/preview1.mp3"
    },
    {
        "id": "AZnzlk1XvdvUeBnXmlld",
        "name": "Michael (Guided)",
        "category": "visualization",
        "description": "Clear and motivational voice",
        "previewUrl": "https://cdn.elevenlabs.io/preview2.mp3"
    }
]

class AudioGenerationRequest(BaseModel):
    text: str
    voiceId: str
    sessionType: str
    mood: str = None
    goal: str = None

class AudioGenerationResponse(BaseModel):
    audioUrl: str
    duration: float
    voiceId: str
    sessionId: str

@router.get("/voices", response_model=List[dict])
def get_voices():
    return MOCK_VOICES

@router.post("/generate", response_model=AudioGenerationResponse)
def generate_audio(req: AudioGenerationRequest):
    url = f"{settings.eleven_labs_base_url}/text-to-speech/{req.voiceId}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": settings.eleven_labs_api_key
    }
    data = {
        "text": req.text,
        "model_id": settings.eleven_labs_model,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }
    response = requests.post(url, json=data, headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to generate audio from ElevenLabs")
    session_id = str(uuid.uuid4())
    filename = f"{session_id}.mp3"
    file_path = os.path.join(settings.upload_dir, filename)
    with open(file_path, "wb") as f:
        f.write(response.content)
    audio_url = f"/uploads/{filename}"
    return AudioGenerationResponse(
        audioUrl=audio_url,
        duration=120.0,
        voiceId=req.voiceId,
        sessionId=session_id
    ) 