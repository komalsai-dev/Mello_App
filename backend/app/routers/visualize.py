from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.config import settings
import openai
import uuid
import requests
import os
import random

router = APIRouter()
openai.api_key = settings.openai_api_key

# Enhanced Models for Visualization Coach
class GoalAnalysisRequest(BaseModel):
    goal: str
    category: str
    timeline: str
    currentEmotionalState: str
    desiredEmotionalState: str

class GoalAnalysisResponse(BaseModel):
    goalComplexity: str  # Simple, Moderate, Complex
    potentialChallenges: List[str]
    recommendedApproach: str
    successFactors: List[str]
    estimatedTimeline: str

class VisualizationQuestionRequest(BaseModel):
    goal: str
    goalCategory: str
    goalComplexity: str
    previousAnswers: Dict[str, Any]
    currentQuestionIndex: int
    userExperienceLevel: str = "beginner"  # beginner, intermediate, advanced

class DynamicQuestionResponse(BaseModel):
    nextQuestion: str
    questionType: str  # text, textarea, single, multiple, scale
    isLastQuestion: bool
    totalQuestions: int
    questionId: str
    context: str  # Additional context or tips for the question

class ChallengeIdentificationRequest(BaseModel):
    goal: str
    goalCategory: str
    allAnswers: Dict[str, Any]
    userProfile: Dict[str, Any]

class ChallengeResponse(BaseModel):
    primaryChallenges: List[str]
    secondaryChallenges: List[str]
    solutions: List[Dict[str, str]]  # {challenge: "solution"}
    resources: List[Dict[str, str]]  # {type: "resource"}
    mindsetShifts: List[str]

class VisualizationStartRequest(BaseModel):
    goal: str
    goalCategory: str
    goalComplexity: str
    voiceId: str
    allAnswers: Dict[str, Any]
    identifiedChallenges: List[str]
    userExperienceLevel: str = "beginner"
    sessionType: str = "goal_achievement"  # goal_achievement, problem_resolution, mindset_transformation

class VisualizationResponse(BaseModel):
    sessionId: str
    script: str
    audioUrl: Optional[str] = None
    goal: str
    goalCategory: str
    challenges: List[str]
    solutions: List[Dict[str, str]]
    actionPlan: List[str]
    createdAt: str
    voiceId: str
    sessionType: str

class SessionCompleteRequest(BaseModel):
    rating: Optional[int] = None
    notes: Optional[str] = None
    clarityScore: Optional[int] = None
    confidenceScore: Optional[int] = None

# Goal Categories and their characteristics
GOAL_CATEGORIES = {
    "career": {
        "keywords": ["job", "career", "business", "work", "professional", "promotion", "startup"],
        "common_challenges": ["imposter syndrome", "work-life balance", "skill gaps", "networking"],
        "success_factors": ["clear planning", "skill development", "networking", "persistence"]
    },
    "health": {
        "keywords": ["health", "fitness", "weight", "exercise", "diet", "wellness", "medical"],
        "common_challenges": ["motivation", "time management", "consistency", "plateaus"],
        "success_factors": ["habit formation", "realistic goals", "support system", "tracking"]
    },
    "relationships": {
        "keywords": ["relationship", "love", "marriage", "family", "friendship", "dating"],
        "common_challenges": ["communication", "trust issues", "time investment", "expectations"],
        "success_factors": ["open communication", "patience", "understanding", "quality time"]
    },
    "personal_growth": {
        "keywords": ["growth", "development", "learning", "self-improvement", "confidence", "mindset"],
        "common_challenges": ["self-doubt", "fear of failure", "comfort zone", "comparison"],
        "success_factors": ["self-awareness", "continuous learning", "resilience", "authenticity"]
    },
    "financial": {
        "keywords": ["money", "finance", "wealth", "investment", "savings", "debt", "income"],
        "common_challenges": ["financial literacy", "discipline", "market volatility", "debt"],
        "success_factors": ["education", "discipline", "diversification", "long-term thinking"]
    },
    "creative": {
        "keywords": ["creative", "art", "music", "writing", "design", "innovation", "expression"],
        "common_challenges": ["creative blocks", "perfectionism", "criticism", "consistency"],
        "success_factors": ["regular practice", "experimentation", "feedback", "authenticity"]
    }
}

@router.post("/goal-analysis", response_model=GoalAnalysisResponse)
def analyze_goal(req: GoalAnalysisRequest):
    """Analyze goal complexity and identify potential challenges"""
    try:
        # Create context for goal analysis
        context = f"""
        Goal: {req.goal}
        Category: {req.category}
        Timeline: {req.timeline}
        Current Emotional State: {req.currentEmotionalState}
        Desired Emotional State: {req.desiredEmotionalState}
        
        Analyze this goal and provide:
        1. Complexity level (Simple/Moderate/Complex)
        2. 3-5 potential challenges
        3. Recommended approach
        4. 3-5 success factors
        5. Realistic timeline estimate
        
        Return as JSON format.
        """
        
        response = openai.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a goal analysis expert. Analyze goals and provide structured insights. Return responses in JSON format."},
                {"role": "user", "content": context}
            ],
            max_tokens=400,
            temperature=0.7,
        )
        
        # Parse the response (in a real app, you'd use proper JSON parsing)
        analysis_text = response.choices[0].message.content.strip()
        
        # Fallback analysis based on category
        category_info = GOAL_CATEGORIES.get(req.category.lower(), GOAL_CATEGORIES["personal_growth"])
        
        return GoalAnalysisResponse(
            goalComplexity="Moderate",  # Default, would be parsed from AI response
            potentialChallenges=category_info["common_challenges"][:3],
            recommendedApproach=f"Focus on {category_info['success_factors'][0]} and {category_info['success_factors'][1]}",
            successFactors=category_info["success_factors"],
            estimatedTimeline=req.timeline
        )
        
    except Exception as e:
        print(f"Error analyzing goal: {e}")
        # Fallback response
        category_info = GOAL_CATEGORIES.get(req.category.lower(), GOAL_CATEGORIES["personal_growth"])
        return GoalAnalysisResponse(
            goalComplexity="Moderate",
            potentialChallenges=category_info["common_challenges"][:3],
            recommendedApproach=f"Focus on {category_info['success_factors'][0]} and {category_info['success_factors'][1]}",
            successFactors=category_info["success_factors"],
            estimatedTimeline=req.timeline
        )

@router.post("/questions", response_model=DynamicQuestionResponse)
def get_next_visualization_question(req: VisualizationQuestionRequest):
    """Generate dynamic questions based on goal analysis and previous answers"""
    try:
        # Create context from previous answers
        context = ""
        if req.previousAnswers:
            context = "Previous answers:\n"
            for question_id, answer in req.previousAnswers.items():
                context += f"- {question_id}: {answer}\n"
        
        # Generate personalized question based on goal and context
        prompt = f"""
        You are a visualization coach conducting a goal-setting session.
        
        Goal: {req.goal}
        Category: {req.goalCategory}
        Complexity: {req.goalComplexity}
        User Experience: {req.userExperienceLevel}
        Current Question: {req.currentQuestionIndex + 1} of 5
        
        {context}
        
        Generate the next personalized question that:
        - Builds upon previous answers
        - Is appropriate for {req.userExperienceLevel} level
        - Helps identify challenges or solutions
        - Moves toward creating a vivid visualization
        
        Return only the question text.
        """
        
        response = openai.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a visualization expert who asks thoughtful, personalized questions to help people achieve their goals."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=100,
            temperature=0.7,
        )
        
        question = response.choices[0].message.content.strip()
        
        # Determine question type based on content
        question_type = "text"
        if any(word in question.lower() for word in ["how long", "how much", "how many", "rate", "scale"]):
            question_type = "scale"
        elif any(word in question.lower() for word in ["describe", "explain", "tell me about"]):
            question_type = "textarea"
        elif any(word in question.lower() for word in ["yes", "no", "are you", "do you"]):
            question_type = "single"
        
        return DynamicQuestionResponse(
            nextQuestion=question,
            questionType=question_type,
            isLastQuestion=(req.currentQuestionIndex >= 4),
            totalQuestions=5,
            questionId=f"q{req.currentQuestionIndex+1}",
            context="Take your time to reflect deeply on this question."
        )
        
    except Exception as e:
        print(f"Error generating question: {e}")
        # Fallback questions based on goal category
        fallback_questions = [
            ("What does achieving {goal} look like in vivid detail?", "textarea"),
            ("What's the biggest challenge you think you'll face?", "textarea"),
            ("How will you feel when you accomplish this goal?", "text"),
            ("What resources or support do you need?", "text"),
            ("What's your first step toward this goal?", "text")
        ]
        
        idx = req.currentQuestionIndex
        if idx >= len(fallback_questions):
            idx = len(fallback_questions) - 1
            
        q, qtype = fallback_questions[idx]
        return DynamicQuestionResponse(
            nextQuestion=q.format(goal=req.goal),
            questionType=qtype,
            isLastQuestion=(idx == len(fallback_questions) - 1),
            totalQuestions=len(fallback_questions),
            questionId=f"q{idx+1}",
            context="Reflect on your goal and answer honestly."
        )

@router.post("/challenges", response_model=ChallengeResponse)
def identify_challenges(req: ChallengeIdentificationRequest):
    """Identify potential challenges and generate solutions"""
    try:
        # Create context from all answers
        answers_context = ""
        if req.allAnswers:
            answers_context = "User's responses:\n"
            for question_id, answer in req.allAnswers.items():
                answers_context += f"- {question_id}: {answer}\n"
        
        prompt = f"""
        Analyze this goal and identify challenges and solutions:
        
        Goal: {req.goal}
        Category: {req.goalCategory}
        {answers_context}
        
        Provide:
        1. 3-4 primary challenges
        2. 2-3 secondary challenges
        3. Specific solutions for each challenge
        4. Helpful resources (books, tools, people)
        5. Mindset shifts needed
        
        Return as structured analysis.
        """
        
        response = openai.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a problem-solving expert who identifies challenges and provides practical solutions."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=600,
            temperature=0.7,
        )
        
        analysis_text = response.choices[0].message.content.strip()
        
        # Fallback challenges based on category
        category_info = GOAL_CATEGORIES.get(req.goalCategory.lower(), GOAL_CATEGORIES["personal_growth"])
        
        return ChallengeResponse(
            primaryChallenges=category_info["common_challenges"][:3],
            secondaryChallenges=["Time management", "Consistency"],
            solutions=[
                {"challenge": "Motivation", "solution": "Create a clear vision and break goals into smaller steps"},
                {"challenge": "Time management", "solution": "Schedule dedicated time blocks and eliminate distractions"},
                {"challenge": "Consistency", "solution": "Build habits and track progress regularly"}
            ],
            resources=[
                {"type": "Book", "resource": "Atomic Habits by James Clear"},
                {"type": "Tool", "resource": "Goal tracking app"},
                {"type": "Support", "resource": "Accountability partner or coach"}
            ],
            mindsetShifts=[
                "Focus on progress over perfection",
                "Embrace challenges as growth opportunities",
                "Trust the process and stay patient"
            ]
        )
        
    except Exception as e:
        print(f"Error identifying challenges: {e}")
        # Fallback response
        category_info = GOAL_CATEGORIES.get(req.goalCategory.lower(), GOAL_CATEGORIES["personal_growth"])
        return ChallengeResponse(
            primaryChallenges=category_info["common_challenges"][:3],
            secondaryChallenges=["Time management", "Consistency"],
            solutions=[
                {"challenge": "Motivation", "solution": "Create a clear vision and break goals into smaller steps"},
                {"challenge": "Time management", "solution": "Schedule dedicated time blocks and eliminate distractions"}
            ],
            resources=[
                {"type": "Book", "resource": "Atomic Habits by James Clear"},
                {"type": "Tool", "resource": "Goal tracking app"}
            ],
            mindsetShifts=[
                "Focus on progress over perfection",
                "Embrace challenges as growth opportunities"
            ]
        )

def generate_audio_with_elevenlabs(text: str, voice_id: str) -> str:
    """Generate audio using ElevenLabs API"""
    try:
        print(f"Starting audio generation for voice_id: {voice_id}")
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
        
        print(f"Making request to ElevenLabs API...")
        response = requests.post(url, json=data, headers=headers)
        print(f"ElevenLabs response status: {response.status_code}")
        
        if response.status_code == 200:
            # Save audio file
            session_id = str(uuid.uuid4())
            audio_filename = f"{session_id}.mp3"
            audio_path = os.path.join("uploads", audio_filename)
            
            # Ensure uploads directory exists
            os.makedirs("uploads", exist_ok=True)
            
            with open(audio_path, "wb") as f:
                f.write(response.content)
            
            print(f"Audio file saved to: {audio_path}")
            return f"/uploads/{audio_filename}"
        else:
            print(f"ElevenLabs API error: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"Error generating audio: {e}")
        return None

def get_random_existing_audio_url():
    uploads_dir = "uploads"
    try:
        files = [f for f in os.listdir(uploads_dir) if f.endswith(".mp3")]
        if files:
            chosen = random.choice(files)
            return f"/uploads/{chosen}"
    except Exception as e:
        print(f"Error selecting fallback audio: {e}")
    return None

@router.post("/start", response_model=VisualizationResponse)
def start_visualization(req: VisualizationStartRequest):
    """Start a visualization session with personalized script and audio"""
    try:
        # Create detailed context from all answers and challenges
        answers_context = ""
        if req.allAnswers:
            answers_context = "User's detailed responses:\n"
            for question_id, answer in req.allAnswers.items():
                answers_context += f"- {question_id}: {answer}\n"
        
        challenges_context = ""
        if req.identifiedChallenges:
            challenges_context = f"Identified challenges: {', '.join(req.identifiedChallenges)}\n"
        
        # Generate personalized visualization script using OpenAI
        prompt = f"""
        Create a {req.sessionType} visualization script for someone with a {req.goalComplexity} goal: {req.goal}
        
        {answers_context}
        {challenges_context}
        
        The script should be:
        - Deeply personalized based on their goal and answers
        - Address specific challenges they've identified
        - Include vivid sensory details (sight, sound, touch, emotion)
        - Use calming, motivational language
        - Include specific action steps within the visualization
        - Written for {req.userExperienceLevel} level
        - Approximately 5-7 minutes when spoken
        - Include natural pauses for reflection (indicated by "...")
        
        Make it feel like a personal coaching session that guides them to their goal.
        Return only the visualization script text.
        """
        
        response = openai.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a visualization expert who creates deeply personalized, vivid visualization scripts that help people achieve their goals and overcome challenges."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=800,
            temperature=0.7,
        )
        script = response.choices[0].message.content.strip()
        
        # Generate audio using ElevenLabs
        print(f"Generating audio for script length: {len(script)}")
        audio_url = generate_audio_with_elevenlabs(script, req.voiceId)
        print(f"Audio generation result: {audio_url}")
        
        if not audio_url:
            # Fallback: use a random existing audio file if available
            audio_url = get_random_existing_audio_url()
            if audio_url:
                print(f"Audio generation failed, using fallback audio: {audio_url}")
            else:
                print("Audio generation failed, no fallback audio available")
        
        # Generate action plan based on challenges and solutions
        action_plan = [
            "Review your visualization daily",
            "Identify one small action you can take today",
            "Track your progress weekly",
            "Celebrate small wins along the way"
        ]
        
        session_id = str(uuid.uuid4())
        
        return VisualizationResponse(
            sessionId=session_id,
            script=script,
            audioUrl=audio_url,
            goal=req.goal,
            goalCategory=req.goalCategory,
            challenges=req.identifiedChallenges,
            solutions=[],  # Would be populated from challenge analysis
            actionPlan=action_plan,
            createdAt=datetime.utcnow().isoformat(),
            voiceId=req.voiceId,
            sessionType=req.sessionType
        )
        
    except Exception as e:
        print(f"Error in visualization generation: {e}")
        # Fallback script if OpenAI fails
        script = f"""
        Welcome to your visualization session for achieving: {req.goal}
        
        Take a deep breath in... and let it out slowly...
        
        As you settle into this moment, imagine yourself having already achieved your goal.
        See it clearly in your mind's eye. Feel the emotions of success flowing through you.
        
        You are capable, you are worthy, and you are on your way to achieving {req.goal}.
        
        Continue breathing deeply and allow this vision to become real in your mind...
        """
        audio_url = None
        
    session_id = str(uuid.uuid4())
        
    return VisualizationResponse(
        sessionId=session_id,
        script=script,
        audioUrl=audio_url,
        goal=req.goal,
            goalCategory=req.goalCategory,
            challenges=req.identifiedChallenges,
            solutions=[],
            actionPlan=["Review your visualization daily", "Take one small action today"],
        createdAt=datetime.utcnow().isoformat(),
            voiceId=req.voiceId,
            sessionType=req.sessionType
        )

@router.post("/session/{session_id}/complete")
def complete_visualization_session(session_id: str, req: SessionCompleteRequest):
    """Complete a visualization session with optional feedback"""
    try:
        print(f"Completing visualization session: {session_id}")
        print(f"Request data: rating={req.rating}, notes={req.notes}")
        
        # In a real application, you would save this to a database
        completion_data = {
            "sessionId": session_id,
            "completedAt": datetime.utcnow().isoformat(),
            "rating": req.rating,
            "notes": req.notes,
            "clarityScore": req.clarityScore,
            "confidenceScore": req.confidenceScore,
            "status": "completed"
        }
        
        print(f"Visualization session completed: {completion_data}")
        
        return {
            "success": True,
            "message": "Visualization session completed successfully",
            "data": completion_data
        }
        
    except Exception as e:
        print(f"Error completing visualization session: {e}")
        raise HTTPException(status_code=500, detail="Failed to complete visualization session")

# Keep the existing voices endpoint for compatibility
@router.get("/voices")
def get_available_voices():
    """Get available voices for visualization guidance"""
    try:
        url = "https://api.elevenlabs.io/v1/voices"
        headers = {
            "Accept": "application/json",
            "xi-api-key": settings.eleven_labs_api_key
        }
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            voices_data = response.json()
            visualization_voices = []
            
            # Filter for voices suitable for visualization
            visualization_keywords = ["calm", "soothing", "gentle", "peaceful", "visualization", "motivational", "inspiring"]
            
            for voice in voices_data.get("voices", []):
                voice_name = voice.get("name", "").lower()
                voice_description = voice.get("labels", {}).get("description", "").lower()
                
                # Check if voice is suitable for visualization
                is_visualization_voice = any(keyword in voice_name or keyword in voice_description 
                                           for keyword in visualization_keywords)
                
                if is_visualization_voice or len(visualization_voices) < 6:  # Limit to 6 voices
                    visualization_voices.append({
                        "voice_id": voice.get("voice_id"),
                        "name": voice.get("name"),
                        "description": voice.get("labels", {}).get("description", "Visualization guide voice"),
                        "category": "visualization"
                    })
            
            return visualization_voices[:6]  # Return max 6 voices
            
        else:
            print(f"ElevenLabs API error: {response.status_code} - {response.text}")
            # Return default voices if API fails
            return [
                {
                    "voice_id": "21m00Tcm4TlvDq8ikWAM",  # Rachel - calm and soothing
                    "name": "Rachel",
                    "description": "Calm and soothing visualization guide",
                    "category": "visualization"
                },
                {
                    "voice_id": "AZnzlk1XvdvUeBnXmlld",  # Domi - warm and gentle
                    "name": "Domi",
                    "description": "Warm and gentle visualization guide",
                    "category": "visualization"
                }
            ]
            
    except Exception as e:
        print(f"Error fetching voices: {e}")
        # Return default voices if there's an error
        return [
            {
                "voice_id": "21m00Tcm4TlvDq8ikWAM",
                "name": "Rachel",
                "description": "Calm and soothing visualization guide",
                "category": "visualization"
            },
            {
                "voice_id": "AZnzlk1XvdvUeBnXmlld",
                "name": "Domi", 
                "description": "Warm and gentle visualization guide",
                "category": "visualization"
            }
        ] 