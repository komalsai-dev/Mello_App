from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from datetime import datetime
from app.config import settings
import openai
import uuid
import requests
import os

router = APIRouter()
openai.api_key = settings.openai_api_key

class MeditationQuestionRequest(BaseModel):
    mood: str
    previousAnswers: Dict[str, Any]
    currentQuestionIndex: int

class DynamicQuestionResponse(BaseModel):
    nextQuestion: str
    questionType: str
    isLastQuestion: bool
    totalQuestions: int
    questionId: str

@router.post("/questions", response_model=DynamicQuestionResponse)
def get_next_meditation_question(req: MeditationQuestionRequest):
    try:
        # Create context from previous answers
        context = ""
        if req.previousAnswers:
            context = "Previous answers:\n"
            for question_id, answer in req.previousAnswers.items():
                context += f"- {question_id}: {answer}\n"
        
        # Generate dynamic question based on mood and previous answers
        prompt = f"""
        You are a meditation coach conducting an intake session. The user feels {req.mood}.
        
        {context}
        
        Current question number: {req.currentQuestionIndex + 1} of 5
        
        Generate the next personalized question for meditation intake. The question should:
        - Be relevant to their mood: {req.mood}
        - Build upon their previous answers
        - Help understand their meditation needs
        - Be conversational and empathetic
        
        Return only the question text, nothing else.
        """
        
        response = openai.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a meditation expert who asks thoughtful, personalized questions to understand a person's meditation needs."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=100,
            temperature=0.7,
        )
        
        question = response.choices[0].message.content.strip()
        
        # Determine question type based on content
        question_type = "text"
        if any(word in question.lower() for word in ["how long", "how much", "how many"]):
            question_type = "number"
        elif any(word in question.lower() for word in ["where", "location", "place"]):
            question_type = "text"
        elif any(word in question.lower() for word in ["yes", "no", "are you", "do you"]):
            question_type = "single"
        elif len(question) > 100:
            question_type = "textarea"
        
        return DynamicQuestionResponse(
            nextQuestion=question,
            questionType=question_type,
            isLastQuestion=(req.currentQuestionIndex >= 4),
            totalQuestions=5,
            questionId=f"q{req.currentQuestionIndex+1}"
        )
        
    except Exception as e:
        print(f"Error generating question: {e}")
        # Fallback questions - only used if OpenAI fails
        fallback_questions = [
            ("How long have you been feeling {mood}?", "text"),
            ("What is your main stressor today?", "textarea"),
            ("Where do you feel tension in your body?", "text"),
            ("What would you like to feel after this meditation?", "text"),
            ("Are you in a quiet place?", "single")
        ]
        
        idx = req.currentQuestionIndex
        if idx >= len(fallback_questions):
            idx = len(fallback_questions) - 1
            
        q, qtype = fallback_questions[idx]
        return DynamicQuestionResponse(
            nextQuestion=q.format(mood=req.mood),
            questionType=qtype,
            isLastQuestion=(idx == len(fallback_questions) - 1),
            totalQuestions=len(fallback_questions),
            questionId=f"q{idx+1}"
        )

class MeditationStartRequest(BaseModel):
    mood: str
    voiceId: str
    duration: int = 600
    allAnswers: Dict[str, Any]

class MeditationResponse(BaseModel):
    sessionId: str
    audioUrl: str
    script: str
    duration: int
    backgroundMusic: str = ""
    mood: str
    createdAt: str
    voiceId: str

class VoiceOption(BaseModel):
    voice_id: str
    name: str
    description: str
    category: str

@router.get("/voices", response_model=List[VoiceOption])
def get_available_voices():
    """Get available voices for meditation guidance"""
    try:
        url = "https://api.elevenlabs.io/v1/voices"
        headers = {
            "Accept": "application/json",
            "xi-api-key": settings.eleven_labs_api_key
        }
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            voices_data = response.json()
            meditation_voices = []
            
            # Filter for voices suitable for meditation
            meditation_keywords = ["calm", "soothing", "gentle", "peaceful", "meditation", "relaxing", "soft"]
            
            for voice in voices_data.get("voices", []):
                voice_name = voice.get("name", "").lower()
                voice_description = voice.get("labels", {}).get("description", "").lower()
                
                # Check if voice is suitable for meditation
                is_meditation_voice = any(keyword in voice_name or keyword in voice_description 
                                        for keyword in meditation_keywords)
                
                if is_meditation_voice or len(meditation_voices) < 8:  # Limit to 8 voices
                    meditation_voices.append(VoiceOption(
                        voice_id=voice.get("voice_id"),
                        name=voice.get("name"),
                        description=voice.get("labels", {}).get("description", "Meditation guide voice"),
                        category="meditation"
                    ))
            
            return meditation_voices[:8]  # Return max 8 voices
            
        else:
            print(f"ElevenLabs API error: {response.status_code} - {response.text}")
            # Return default voices if API fails
            return [
                VoiceOption(
                    voice_id="21m00Tcm4TlvDq8ikWAM",  # Rachel - calm and soothing
                    name="Rachel",
                    description="Calm and soothing meditation guide",
                    category="meditation"
                ),
                VoiceOption(
                    voice_id="AZnzlk1XvdvUeBnXmlld",  # Domi - warm and gentle
                    name="Domi",
                    description="Warm and gentle meditation guide",
                    category="meditation"
                ),
                VoiceOption(
                    voice_id="EXAVITQu4vr4xnSDxMaL",  # Bella - peaceful and serene
                    name="Bella",
                    description="Peaceful and serene meditation guide",
                    category="meditation"
                )
            ]
            
    except Exception as e:
        print(f"Error fetching voices: {e}")
        # Return default voices if there's an error
        return [
            VoiceOption(
                voice_id="21m00Tcm4TlvDq8ikWAM",
                name="Rachel",
                description="Calm and soothing meditation guide",
                category="meditation"
            ),
            VoiceOption(
                voice_id="AZnzlk1XvdvUeBnXmlld",
                name="Domi", 
                description="Warm and gentle meditation guide",
                category="meditation"
            )
        ]

def generate_audio_with_elevenlabs(text: str, voice_id: str) -> str:
    """Generate audio using ElevenLabs API"""
    try:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": settings.eleven_labs_api_key
        }
        
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }
        
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 200:
            # Save audio file
            session_id = str(uuid.uuid4())
            audio_filename = f"{session_id}.mp3"
            audio_path = os.path.join("uploads", audio_filename)
            
            # Ensure uploads directory exists
            os.makedirs("uploads", exist_ok=True)
            
            with open(audio_path, "wb") as f:
                f.write(response.content)
            
            return f"/uploads/{audio_filename}"
        else:
            print(f"ElevenLabs API error: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"Error generating audio: {e}")
        return None

@router.post("/start", response_model=MeditationResponse)
def start_meditation(req: MeditationStartRequest):
    try:
        # Create detailed context from all answers
        answers_context = ""
        if req.allAnswers:
            answers_context = "User's detailed responses:\n"
            for question_id, answer in req.allAnswers.items():
                answers_context += f"- {question_id}: {answer}\n"
        
        # Generate personalized meditation script using OpenAI
        prompt = f"""
        Create a {req.duration//60}-minute personalized meditation script for someone feeling {req.mood}.
        
        {answers_context}
        
        The script should be:
        - Deeply personalized based on their mood ({req.mood}) and all their answers
        - Include specific references to their stressors, body tension, and desired outcomes
        - Use calming, soothing language that matches their emotional state
        - Include breathing guidance and relaxation techniques
        - Written in a conversational, empathetic tone
        - Approximately {req.duration//60} minutes when spoken at a calm pace
        - Include natural pauses for breathing (indicated by "...")
        - Address their specific needs mentioned in the intake
        
        Make it feel like you truly understand their situation and are speaking directly to them.
        Return only the meditation script text.
        """
        
        response = openai.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a meditation expert who creates deeply personalized, calming meditation scripts that address specific user needs and emotions."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1200,
            temperature=0.7,
        )
        script = response.choices[0].message.content.strip()
        
        # Generate audio using ElevenLabs
        audio_url = generate_audio_with_elevenlabs(script, req.voiceId)
        
        if not audio_url:
            # Fallback if audio generation fails
            audio_url = f"/uploads/fallback_{str(uuid.uuid4())}.mp3"
            
    except Exception as e:
        print(f"Error in meditation generation: {e}")
        # Fallback script if OpenAI fails
        script = f"""
        Welcome to your {req.duration//60}-minute meditation session for feeling {req.mood}.
        
        Take a deep breath in... and let it out slowly...
        
        As you settle into this moment, remember that you are safe and supported. 
        This time is yours to find peace and clarity.
        
        Continue breathing deeply and allow yourself to be present in this moment...
        """
        audio_url = f"/uploads/fallback_{str(uuid.uuid4())}.mp3"
    
    session_id = str(uuid.uuid4())
    
    return MeditationResponse(
        sessionId=session_id,
        audioUrl=audio_url,
        script=script,
        duration=req.duration,
        backgroundMusic="",
        mood=req.mood,
        createdAt=datetime.utcnow().isoformat(),
        voiceId=req.voiceId
    ) 

class SessionCompleteRequest(BaseModel):
    rating: int | None = None
    notes: str | None = None

@router.post("/session/{session_id}/complete")
def complete_meditation_session(session_id: str, req: SessionCompleteRequest):
    """Complete a meditation session with optional rating and notes"""
    try:
        # In a real application, you would save this to a database
        # For now, we'll just return a success response
        completion_data = {
            "sessionId": session_id,
            "completedAt": datetime.utcnow().isoformat(),
            "rating": req.rating,
            "notes": req.notes,
            "status": "completed"
        }
        
        print(f"Session completed: {completion_data}")
        
        return {
            "success": True,
            "message": "Session completed successfully",
            "data": completion_data
        }
        
    except Exception as e:
        print(f"Error completing session: {e}")
        raise HTTPException(status_code=500, detail="Failed to complete session") 