from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.config import settings
import requests
import os
import uuid
import random
import json

router = APIRouter()

class OneTapRequest(BaseModel):
    sessionType: str  # 'quick-relief', 'daily-practice', 'deep-dive'
    voiceId: str = "21m00Tcm4TlvDq8ikWAM"  # Default voice

class OneTapResponse(BaseModel):
    audioUrl: str
    script: str
    steps: list[str]  # Individual steps for frontend

# Fixed scripts for each session type
ONE_TAP_SCRIPTS = {
    "quick-relief": [
        "Hey love, you're safe now. Let's take just 3 minutes together to settle your breath and heart...",
        "Close your eyes gently. Inhale slowly, feeling the air fill your chest... Exhale, letting your shoulders drop...",
        "Notice your heartbeat. It's okay to feel what you're feeling. You are not alone. With every breath, imagine a soft, warm light wrapping around you, calming your body and mind...",
        "If thoughts come, let them float by like clouds. Bring your attention back to your breath, back to this gentle moment...",
        "You are loved. You are safe. You are enough. Let's finish with one deep breath together...",
        "When you're ready, gently open your eyes. Carry this calm with you."
    ],
    "daily-practice": [
        "Welcome back. Let's center into your breath, body, and being. You're doing beautifully...",
        "Find a comfortable seat. Let your hands rest softly. Close your eyes or lower your gaze.",
        "Begin to notice your breath. Inhale through your nose, slow and gentle. Exhale, letting go of any tension.",
        "With each breath, feel your body settle. Notice the sounds around you—maybe birds, a gentle breeze, or the quiet hum of life.",
        "If your mind wanders, that's okay. Gently bring it back to your breath, to this moment.",
        "Imagine a soft bell ringing, inviting you deeper into calm. Let your thoughts drift like leaves on water.",
        "You are present. You are enough. Let's finish with gratitude for this time you've given yourself.",
        "When you're ready, open your eyes and carry this clarity into your day."
    ],
    "deep-dive": [
        "Close your eyes. We're going deeper now... Let this stillness hold you completely...",
        "Feel the gentle rhythm of your breath, like waves caressing the shore. With every inhale, draw in peace. With every exhale, release what no longer serves you.",
        "Let your body grow heavy, sinking into the support beneath you. Imagine a vast ocean, endless and calm, holding you in its embrace.",
        "Thoughts may drift in and out, like tides. Let them come and go, returning always to the soothing sound of your breath.",
        "If you wish, invite a sense of healing or deep rest. Trust this moment. Trust yourself.",
        "You are safe. You are whole. You are deeply cared for. Let yourself float in this gentle darkness, nourished by the quiet.",
        "When you're ready, slowly return, bringing this peace with you into the world."
    ],
}

def get_random_existing_audio_url():
    upload_dir = getattr(settings, "upload_dir", "uploads")
    try:
        files = [f for f in os.listdir(upload_dir) if f.endswith('.mp3')]
        if not files:
            return None
        filename = random.choice(files)
        return f"/uploads/{filename}"
    except Exception as e:
        print(f"Error selecting fallback audio: {e}")
        return None

@router.post("/one-tap/start", response_model=OneTapResponse)
def start_one_tap(req: OneTapRequest):
    steps = ONE_TAP_SCRIPTS.get(req.sessionType)
    if not steps:
        raise HTTPException(status_code=400, detail="Invalid sessionType")
    
    # Join steps for full audio generation
    full_script = "\n".join(steps)
    
    # Check if audio already exists for this session/voice
    safe_voice = req.voiceId.replace("/", "_")
    filename = f"{req.sessionType}_full_{safe_voice}.mp3"
    upload_dir = getattr(settings, "upload_dir", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, filename)
    audio_url = f"/uploads/{filename}"
    
    # If audio exists, return it
    if os.path.exists(file_path):
        return OneTapResponse(audioUrl=audio_url, script=full_script, steps=steps)
    
    # Generate audio for full script
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{req.voiceId}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": settings.eleven_labs_api_key
    }
    data = {
        "text": full_script,
        "model_id": getattr(settings, "eleven_labs_model", "eleven_monolingual_v1"),
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }
    
    response = requests.post(url, json=data, headers=headers)
    
    if response.status_code == 200:
        with open(file_path, "wb") as f:
            f.write(response.content)
        
        return OneTapResponse(audioUrl=audio_url, script=full_script, steps=steps)
    else:
        # Fallback: use a random existing audio file if available
        fallback_url = get_random_existing_audio_url()
        if not fallback_url:
            raise HTTPException(status_code=500, detail="Failed to generate audio from ElevenLabs and no fallback audio available")
        
        return OneTapResponse(audioUrl=fallback_url, script=full_script, steps=steps)

@router.post("/one-tap/step-audio")
def one_tap_step_audio(
    req: OneTapRequest,
    stepIndex: int = Query(..., description="Index of the script step (0-based)")
):
    script = ONE_TAP_SCRIPTS.get(req.sessionType)
    if not script:
        raise HTTPException(status_code=400, detail="Invalid sessionType")
    # Split script into steps by line breaks
    steps = [s.strip() for s in script.split("\n") if s.strip()]
    if stepIndex < 0 or stepIndex >= len(steps):
        raise HTTPException(status_code=400, detail="Invalid stepIndex")
    step_text = steps[stepIndex]
    # Cache filename
    safe_voice = req.voiceId.replace("/", "_")
    filename = f"{req.sessionType}_{stepIndex}_{safe_voice}.mp3"
    upload_dir = getattr(settings, "upload_dir", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, filename)
    audio_url = f"/uploads/{filename}"
    # If file exists, return it
    if os.path.exists(file_path):
        return {"audioUrl": audio_url, "scriptStep": step_text}
    # Otherwise, generate audio for this step
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{req.voiceId}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": settings.eleven_labs_api_key
    }
    data = {
        "text": step_text,
        "model_id": getattr(settings, "eleven_labs_model", "eleven_monolingual_v1"),
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }
    response = requests.post(url, json=data, headers=headers)
    if response.status_code == 200:
        with open(file_path, "wb") as f:
            f.write(response.content)
        return {"audioUrl": audio_url, "scriptStep": step_text}
    else:
        # Fallback: use a random existing audio file if available
        fallback_url = get_random_existing_audio_url()
        if not fallback_url:
            raise HTTPException(status_code=500, detail="Failed to generate audio and no fallback available")
        return {"audioUrl": fallback_url, "scriptStep": step_text}

@router.get("/one-tap/step-timing/{session_type}/{step_index}")
def get_step_timing(session_type: str, step_index: int, voice_id: str = Query(..., alias="voiceId")):
    """Get timing information for a specific step"""
    script = ONE_TAP_SCRIPTS.get(session_type)
    if not script:
        raise HTTPException(status_code=400, detail="Invalid sessionType")
    
    steps = [s.strip() for s in script.split("\n") if s.strip()]
    if step_index < 0 or step_index >= len(steps):
        raise HTTPException(status_code=400, detail="Invalid stepIndex")
    
    step_timings = estimate_step_timings(script)
    if step_index < len(step_timings):
        return step_timings[step_index]
    
    raise HTTPException(status_code=404, detail="Step timing not found")
