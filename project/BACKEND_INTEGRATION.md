# Backend Integration Guide

## Overview
This guide explains how to integrate your backend with the Mindful Coach frontend application. The frontend is now prepared to work with a backend that provides meditation and visualization services using OpenAI and Eleven Labs APIs.

## Frontend Setup

### 1. Environment Configuration
Create a `.env.local` file in your project root with the following variables:

```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Development Configuration
NEXT_PUBLIC_APP_ENV=development
```

### 2. Frontend Features Ready for Backend
- ✅ API layer with comprehensive endpoints
- ✅ State management with Zustand
- ✅ Error handling and loading states
- ✅ Backend connectivity monitoring
- ✅ Audio playback integration
- ✅ Session management
- ✅ User profile management

## Backend API Requirements

### Base URL
```
http://localhost:8000/api
```

### Required Endpoints

#### 1. Health Check
```
GET /health
```
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### 2. Meditation Endpoints

**Start Meditation Session:**
```
POST /meditate
```
**Request Body:**
```json
{
  "mood": "stressed",
  "duration": 600,
  "quizAnswers": {
    "question1": "answer1",
    "question2": "answer2"
  },
  "voiceId": "optional-voice-id"
}
```
**Response:**
```json
{
  "sessionId": "session-123",
  "audioUrl": "https://example.com/audio.mp3",
  "script": "Your personalized meditation script...",
  "duration": 600,
  "backgroundMusic": "optional-background-url",
  "mood": "stressed",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Get Meditation Session:**
```
GET /meditate/session/{sessionId}
```

**Complete Meditation Session:**
```
POST /meditate/session/{sessionId}/complete
```
**Request Body:**
```json
{
  "rating": 5,
  "notes": "Great session!"
}
```

#### 3. Visualization Endpoints

**Start Visualization Session:**
```
POST /visualize/start
```
**Request Body:**
```json
{
  "goal": "Start my own business",
  "answers": {
    "question1": "Detailed answer...",
    "question2": "Another answer..."
  },
  "voiceId": "optional-voice-id"
}
```
**Response:**
```json
{
  "sessionId": "session-456",
  "script": "Your visualization script...",
  "questions": ["Question 1", "Question 2"],
  "audioUrl": "https://example.com/audio.mp3",
  "goal": "Start my own business",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Complete Visualization Session:**
```
POST /visualize/session/{sessionId}/complete
```

#### 4. Audio Generation Endpoints

**Generate Audio:**
```
POST /audio/generate
```
**Request Body:**
```json
{
  "text": "Your meditation script text",
  "voiceId": "voice-id",
  "model": "eleven_monolingual_v1",
  "stability": 0.5,
  "similarityBoost": 0.75
}
```
**Response:**
```json
{
  "audioUrl": "https://example.com/generated-audio.mp3",
  "duration": 120,
  "voiceId": "voice-id"
}
```

**Get Available Voices:**
```
GET /audio/voices
```
**Response:**
```json
[
  {
    "id": "voice-id-1",
    "name": "Sarah",
    "category": "meditation",
    "description": "Calm and soothing voice"
  }
]
```

#### 5. User Management Endpoints

**Get User Profile:**
```
GET /user/profile
```
**Response:**
```json
{
  "id": "user-123",
  "name": "John Doe",
  "email": "john@example.com",
  "preferences": {
    "preferredSessionLength": 600,
    "favoriteThemes": ["stress-relief", "focus"],
    "reminderSettings": {
      "enabled": true,
      "time": "09:00",
      "frequency": "daily"
    },
    "voicePreferences": {
      "preferredVoiceId": "voice-1",
      "speed": 1.0
    }
  },
  "stats": {
    "totalSessions": 25,
    "totalMinutes": 1500,
    "streakDays": 7,
    "favoriteMood": "peaceful"
  }
}
```

**Update User Profile:**
```
PUT /user/profile
```

**Get Session History:**
```
GET /user/sessions?limit=20&offset=0
```

**Get User Stats:**
```
GET /user/stats
```

#### 6. Quiz Endpoints

**Get Quiz Questions:**
```
GET /quiz/questions
```
**Response:**
```json
[
  {
    "id": "q1",
    "question": "How stressed do you feel right now?",
    "type": "scale",
    "required": true
  }
]
```

**Submit Quiz:**
```
POST /quiz/submit
```

## Backend Implementation Guidelines

### 1. Technology Stack Recommendations
- **Framework**: FastAPI, Express.js, or Django
- **Database**: PostgreSQL, MongoDB, or SQLite
- **AI Integration**: OpenAI API for script generation
- **Voice Generation**: Eleven Labs API for audio
- **Authentication**: JWT tokens (optional for MVP)

### 2. OpenAI Integration
```python
# Example Python implementation
import openai

def generate_meditation_script(mood: str, duration: int) -> str:
    prompt = f"""
    Create a {duration//60}-minute meditation script for someone feeling {mood}.
    The script should be calming, personalized, and include breathing guidance.
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a meditation expert."},
            {"role": "user", "content": prompt}
        ]
    )
    
    return response.choices[0].message.content
```

### 3. Eleven Labs Integration
```python
# Example Python implementation
import requests

def generate_audio(text: str, voice_id: str) -> str:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": "your-api-key"
    }
    
    data = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }
    
    response = requests.post(url, json=data, headers=headers)
    
    # Save audio file and return URL
    audio_url = save_audio_file(response.content)
    return audio_url
```

### 4. Error Handling
Implement proper error handling with HTTP status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (if using auth)
- `404` - Not Found
- `500` - Internal Server Error

### 5. CORS Configuration
Enable CORS for your frontend domain:
```python
# FastAPI example
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Testing the Integration

### 1. Start Your Backend
```bash
# Example with Python FastAPI
cd backend
uvicorn main:app --reload --port 8000
```

### 2. Start Your Frontend
```bash
# In another terminal
cd project
npm run dev
```

### 3. Test Endpoints
Use tools like Postman or curl to test your backend endpoints:
```bash
curl http://localhost:8000/api/health
```

### 4. Frontend Testing
- Navigate to the meditation page
- Check if backend connection status is shown
- Try starting a meditation session
- Verify audio playback works

## Common Issues and Solutions

### 1. CORS Errors
- Ensure your backend has CORS properly configured
- Check that the frontend URL is in the allowed origins

### 2. Audio Playback Issues
- Verify audio URLs are accessible
- Check browser autoplay policies
- Ensure audio format is supported (MP3, WAV)

### 3. API Timeout Issues
- Implement proper timeout handling
- Consider using streaming for long audio generation
- Add loading states in the frontend

### 4. Environment Variables
- Double-check API URLs in `.env.local`
- Ensure backend is running on the correct port
- Verify API keys are properly configured

## Next Steps

1. **Implement the backend** using the provided API specifications
2. **Test each endpoint** individually before integrating
3. **Add authentication** if needed for user management
4. **Implement error handling** and logging
5. **Add monitoring** for API usage and performance
6. **Deploy both frontend and backend** to production

## Support

If you encounter issues during integration:
1. Check the browser console for frontend errors
2. Check backend logs for server errors
3. Verify all environment variables are set correctly
4. Test API endpoints independently
5. Ensure both services are running on the correct ports 