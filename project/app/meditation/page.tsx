'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/navigation';
import { MoodSelector } from '@/components/mood-selector';
import { VoiceSelector } from '@/components/voice-selector';
import { BreathingAnimation } from '@/components/meditation/breathing-animation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Heart, Timer, Play, Pause, Volume2, VolumeX, Brain, CheckCircle, Star, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useBackend } from '@/hooks/use-backend';
import { api, DynamicQuestion } from '@/lib/api';
import { toast } from 'sonner';
import { BACKEND_URL } from '@/lib/config';

type MeditationStep = 'mood' | 'voice' | 'questions' | 'summary' | 'breathing' | 'session' | 'complete';

export default function MeditationPage() {
  const [currentStep, setCurrentStep] = useState<MeditationStep>('mood');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [isBreathing, setIsBreathing] = useState(false);
  const [sessionDuration] = useState(600); // 10 minutes
  const [currentTime, setCurrentTime] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');

  // Dynamic questions state
  const [currentQuestion, setCurrentQuestion] = useState<DynamicQuestion | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);

  const { startMeditationSession, completeSession, isLoading, error } = useAppStore();
  const { isConnected } = useBackend();

  const steps = [
    { id: 'mood', title: 'Select Mood', progress: 14 },
    { id: 'voice', title: 'Choose Voice', progress: 28 },
    { id: 'questions', title: 'Personalization', progress: 42 },
    { id: 'summary', title: 'Session Summary', progress: 56 },
    { id: 'breathing', title: 'Breathing Exercise', progress: 70 },
    { id: 'session', title: 'Meditation Session', progress: 84 },
    { id: 'complete', title: 'Complete', progress: 100 },
  ];

  const currentStepData = steps.find(step => step.id === currentStep);

  // Handle session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isSessionActive && currentTime < sessionDuration) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          if (newTime >= sessionDuration) {
            setIsSessionActive(false);
            handleSessionComplete();
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionActive, currentTime, sessionDuration]);

  // Handle audio element
  useEffect(() => {
    if (audioElement) {
      audioElement.addEventListener('ended', () => {
        setIsAudioPlaying(false);
      });
      
      audioElement.addEventListener('play', () => {
        setIsAudioPlaying(true);
      });
      
      audioElement.addEventListener('pause', () => {
        setIsAudioPlaying(false);
      });
    }

    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  // Load first question when entering questions step
  useEffect(() => {
    if (currentStep === 'questions' && selectedMood && currentQuestionIndex === 0) {
      loadNextQuestion();
    }
  }, [currentStep, selectedMood]);

  useEffect(() => {
    if (currentStep === 'questions' && selectedMood) {
      loadNextQuestion();
    }
    // eslint-disable-next-line
  }, [currentQuestionIndex]);

  const loadNextQuestion = async () => {
    if (!selectedMood) return;

    try {
      setIsLoadingQuestion(true);
      const question = await api.getNextMeditationQuestion({
        mood: selectedMood,
        previousAnswers: questionAnswers,
        currentQuestionIndex: currentQuestionIndex,
      });
      
      setCurrentQuestion(question);
    } catch (error) {
      toast.error('Failed to load question');
      console.error('Error loading question:', error);
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const handleAnswerChange = (answer: string) => {
    if (currentQuestion) {
      setQuestionAnswers(prev => ({
        ...prev,
        [currentQuestion.questionId]: answer
      }));
    }
  };

  const handleNextQuestion = async () => {
    if (!currentQuestion) return;

    // Save current answer
    if (currentQuestion.questionId) {
      setQuestionAnswers(prev => ({
        ...prev,
        [currentQuestion.questionId]: questionAnswers[currentQuestion.questionId] || ''
      }));
    }

    if (currentQuestion.isLastQuestion) {
      setCurrentStep('summary');
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Helper to get full audio URL
  const getFullAudioUrl = (audioUrl: string) => {
    if (!audioUrl) return '';
    if (audioUrl.startsWith('http')) return audioUrl;
    return `${BACKEND_URL}${audioUrl}`;
  };

  const handleNext = async () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    
    if (currentStep === 'mood' && selectedMood) {
      setCurrentStep('voice');
    } else if (currentStep === 'voice' && selectedVoiceId) {
      setCurrentStep('questions');
    } else if (currentStep === 'questions') {
      // Questions are handled by handleNextQuestion
      return;
    } else if (currentStep === 'summary') {
      setCurrentStep('breathing');
    } else if (currentStep === 'breathing') {
      try {
        // Start meditation session with backend - pass all required data
        const response = await startMeditationSession(
          selectedMood!, 
          sessionDuration,
          selectedVoiceId!, // Pass the selected voice
          questionAnswers   // Pass all question answers
        );
        
        // Store the generated script and session ID
        setGeneratedScript(response.script);
        setSessionId(response.sessionId);
        
        // Set up audio if available
        if (response.audioUrl) {
          const audioObj = new Audio(getFullAudioUrl(response.audioUrl));
          setAudioElement(audioObj);
        }
        
        setCurrentStep('session');
      } catch (error) {
        toast.error('Failed to start meditation session. Please try again.');
        console.error('Meditation session error:', error);
      }
    } else if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id as MeditationStep);
    }
  };

  const handlePrevious = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id as MeditationStep);
    }
  };

  const handleSessionComplete = async () => {
    try {
      // Complete the session
      await completeSession(sessionId, rating || undefined, notes || undefined);
      setCurrentStep('complete');
      toast.success('Meditation session completed!');
    } catch (error) {
      toast.error('Failed to complete session. Please try again.');
      console.error('Session completion error:', error);
    }
  };

  const toggleAudio = () => {
    if (audioElement) {
      if (isAudioPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'mood':
        return selectedMood !== null && isConnected;
      case 'voice':
        return selectedVoiceId !== null;
      case 'questions':
        return currentQuestion && questionAnswers[currentQuestion.questionId]?.trim().length > 0;
      case 'summary':
        return true;
      case 'breathing':
        return true;
      case 'session':
        return true;
      default:
        return true;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVoiceSelect = (voiceId: string, voiceName: string) => {
    setSelectedVoiceId(voiceId);
    setSelectedVoiceName(voiceName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <Navigation />
      
      {/* Backend Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Backend service is not available. Some features may be limited.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Meditation Journey
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Heart className="h-4 w-4" />
              <span>{currentStepData?.title}</span>
            </div>
          </div>
          <Progress value={currentStepData?.progress || 0} className="h-2" />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 'mood' && (
              <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <MoodSelector
                    selectedMood={selectedMood}
                    onMoodSelect={setSelectedMood}
                  />
                </CardContent>
              </Card>
            )}

            {currentStep === 'voice' && (
              <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <VoiceSelector
                    selectedVoiceId={selectedVoiceId}
                    onVoiceSelect={handleVoiceSelect}
                    sessionType="meditation"
                  />
                </CardContent>
              </Card>
            )}

            {currentStep === 'questions' && (
              <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    <Brain className="h-6 w-6" />
                    Personalize Your Experience
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300">
                    Help us create a meditation tailored to your needs
                  </p>
                </CardHeader>
                <CardContent className="p-8">
                  {isLoadingQuestion ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading your personalized question...</p>
                    </div>
                  ) : currentQuestion ? (
                    <div className="space-y-6">
                      <div>
                        <label className="text-lg font-medium text-gray-900 dark:text-white mb-4 block">
                          {currentQuestion.nextQuestion}
                        </label>
                        {currentQuestion.questionType === 'textarea' ? (
                          <Textarea
                            placeholder="Take your time to reflect and answer honestly..."
                            value={questionAnswers[currentQuestion.questionId] || ''}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                            className="min-h-[120px] text-base"
                          />
                        ) : (
                          <Input
                            placeholder="Your answer..."
                            value={questionAnswers[currentQuestion.questionId] || ''}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                            className="text-lg py-3"
                          />
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                          Question {currentQuestionIndex + 1} of {currentQuestion.totalQuestions}
                        </span>
                        <span>
                          {Object.keys(questionAnswers).length} answered
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No questions available at the moment.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === 'summary' && (
              <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    Session Summary
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300">
                    Review your selections before starting your meditation
                  </p>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Your Mood</h3>
                        <p className="text-blue-700 dark:text-blue-300 capitalize">{selectedMood}</p>
                      </div>
                      
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Voice Guide</h3>
                        <p className="text-purple-700 dark:text-purple-300">{selectedVoiceName || 'Selected voice'}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Your Answers</h3>
                      <div className="space-y-2">
                        {Object.entries(questionAnswers).map(([questionId, answer], index) => (
                          <div key={questionId} className="flex justify-between items-start">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Q{index + 1}:
                            </span>
                            <span className="text-sm text-gray-900 dark:text-white text-right max-w-xs">
                              {answer}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Session Details</h3>
                      <p className="text-green-700 dark:text-green-300">
                        Duration: {sessionDuration / 60} minutes
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'breathing' && (
              <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Breathing Exercise</CardTitle>
                  <p className="text-gray-600 dark:text-gray-300">
                    Let's prepare your mind with some focused breathing
                  </p>
                </CardHeader>
                <CardContent className="p-8">
                  <BreathingAnimation
                    isActive={isBreathing}
                    onToggle={() => setIsBreathing(!isBreathing)}
                  />
                </CardContent>
              </Card>
            )}

            {currentStep === 'session' && (
              <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Meditation Session</CardTitle>
                  <p className="text-gray-600 dark:text-gray-300">
                    Your personalized meditation for feeling {selectedMood}
                  </p>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Timer and Controls */}
                    <div className="text-center space-y-4">
                    <div className="relative">
                      <div className="h-32 w-32 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        {isSessionActive ? (
                          <Pause className="h-12 w-12 text-white" />
                        ) : (
                          <Play className="h-12 w-12 text-white" />
                        )}
                      </div>
                      <motion.div
                        className="absolute inset-0 h-32 w-32 mx-auto rounded-full border-4 border-primary"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    
                    <div>
                      <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        {formatTime(sessionDuration - currentTime)}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300">
                        {isSessionActive ? 'Meditation in progress...' : 'Find a comfortable position and close your eyes'}
                      </p>
                    </div>
                    
                    <Progress value={(currentTime / sessionDuration) * 100} className="h-2" />
                      
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        onClick={() => setIsSessionActive(!isSessionActive)}
                        disabled={isLoading}
                      >
                        {isSessionActive ? 'Pause Session' : 'Start Session'}
                      </Button>
                    </div>
                    
                    {/* Audio Controls */}
                    {audioElement && (
                      <div className="border-t pt-6">
                        <div className="flex items-center justify-center gap-4 mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleAudio}
                          className="flex items-center gap-2"
                        >
                          {isAudioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          {isAudioPlaying ? 'Pause Audio' : 'Play Audio'}
                        </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Script Display */}
                    {generatedScript && (
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Your Meditation Script
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-64 overflow-y-auto">
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                            {generatedScript}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          You can read along or just listen to the audio guide
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'complete' && (
              <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <div className="h-24 w-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center mb-6">
                      <Heart className="h-12 w-12 text-white" />
                    </div>
                  </motion.div>
                  
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Meditation Complete!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-8">
                    Well done! You've completed your meditation session. 
                    Take a moment to notice how you feel.
                  </p>
                  
                  {/* Rating and Feedback */}
                  <div className="space-y-6 mb-8">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        How was your session?
                      </h3>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`p-2 rounded-full transition-colors ${
                              rating && rating >= star
                                ? 'text-yellow-400'
                                : 'text-gray-300 hover:text-yellow-400'
                            }`}
                          >
                            <Star className="h-6 w-6 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Any thoughts or notes? (optional)
                      </label>
                      <Textarea
                        placeholder="How are you feeling? What did you notice?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="max-w-md mx-auto"
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => setCurrentStep('mood')}>
                      Start Another Session
                    </Button>
                    <Button onClick={handleSessionComplete}>
                      Save & Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {currentStep !== 'complete' && (
          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 'mood'}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            {currentStep === 'questions' ? (
              <Button
                onClick={handleNextQuestion}
                disabled={!canProceed() || isLoadingQuestion}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoadingQuestion ? (
                  'Loading...'
                ) : currentQuestion?.isLastQuestion ? (
                  'Complete Questions'
                ) : (
                  <>
                    Next Question
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? (
                  'Loading...'
                ) : (
                  <>
                    {currentStep === 'session' ? 'Complete' : 'Next'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}