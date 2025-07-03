'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Default voice
const STEP_DURATION = 30; // 30 seconds per step

export default function QuickReliefPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [step, setStep] = useState(0);
  const [stepTimeLeft, setStepTimeLeft] = useState(STEP_DURATION);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);

  // Dynamic script steps state
  const [scriptSteps, setScriptSteps] = useState<string[]>([]);

  // Fetch audio and script for quick relief session
  const fetchAudioAndScript = async () => {
    setLoadingAudio(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/one-tap/start`, {
        sessionType: 'quick-relief',
        voiceId: VOICE_ID,
      });
      setAudioUrl(BACKEND_URL + response.data.audioUrl);
      setScriptSteps(response.data.steps || []);
    } catch (e) {
      setAudioUrl(null);
    } finally {
      setLoadingAudio(false);
    }
  };

  // Fetch script and audio on mount
  useEffect(() => {
    fetchAudioAndScript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle step timer
  useEffect(() => {
    if (!isPlaying || !autoAdvance) return;
    
    const interval = setInterval(() => {
      setStepTimeLeft((prev) => {
        if (prev <= 1) {
          // Move to next step
          if (step < scriptSteps.length - 1) {
            setStep(step + 1);
            return STEP_DURATION;
          } else {
            // Session complete
            setIsPlaying(false);
            setSessionComplete(true);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, autoAdvance, step, scriptSteps.length]);

  // Handle main timer
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsPlaying(false);
          setSessionComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Control functions
  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (step < scriptSteps.length - 1) {
      setStep(step + 1);
      setStepTimeLeft(STEP_DURATION);
    }
  };

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1);
      setStepTimeLeft(STEP_DURATION);
    }
  };

  const handleRestart = () => {
    setStep(0);
    setTimeLeft(180);
    setStepTimeLeft(STEP_DURATION);
    setIsPlaying(false);
    setSessionComplete(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === ' ') {
        e.preventDefault();
        handlePlayPause();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPlaying, step, scriptSteps.length]);

  // Swipe navigation
  const handlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrevious,
    trackMouse: true
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Timer progress
  const timerProgress = 1 - timeLeft / 180;
  const stepProgress = 1 - stepTimeLeft / STEP_DURATION;

  // Audio controls
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying && audioUrl) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, audioUrl]);

  // Pause audio when unmounting
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Session completion modal
  if (sessionComplete) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ background: 'linear-gradient(120deg, #ffe0c3 0%, #ffb6b9 50%, #fcdffb 100%)' }}
        />
        <div className="max-w-lg w-full mx-auto py-10 px-4 flex-1 flex flex-col justify-center items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="h-20 w-20 flex items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-500 mb-6 shadow-lg mx-auto">
              <span className="text-white text-4xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Session Complete!</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              You've completed your Quick Relief meditation. Take this calm with you.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={handleRestart} size="lg" className="bg-gradient-to-r from-orange-500 to-pink-500">
                <RotateCcw className="mr-2 h-5 w-5" />
                Start Again
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ background: 'linear-gradient(120deg, #ffe0c3 0%, #ffb6b9 50%, #fcdffb 100%)' }}
      >
        {/* Floating shapes */}
        <motion.div
          className="absolute top-10 left-10 w-32 h-32 rounded-full bg-pink-200 opacity-30"
          animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-orange-200 opacity-20"
          animate={{ y: [0, -20, 0], x: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Home Button */}
      <div className="absolute top-4 left-4 z-20">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Home
          </Link>
        </Button>
      </div>

      {/* Timer */}
      <div className="absolute top-4 right-4 z-20">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="absolute top-0 left-0" width="64" height="64">
            <circle cx="32" cy="32" r="28" stroke="#fdba74" strokeWidth="6" fill="none" opacity="0.2" />
            <circle
              cx="32" cy="32" r="28"
              stroke="#fdba74"
              strokeWidth="6"
              fill="none"
              strokeDasharray={2 * Math.PI * 28}
              strokeDashoffset={(1 - timerProgress) * 2 * Math.PI * 28}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s' }}
            />
          </svg>
          <span className="absolute text-orange-700 font-bold text-lg">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="max-w-lg w-full mx-auto py-10 px-4 flex-1 flex flex-col justify-center items-center relative z-10">
        {/* Icon and Title */}
        <motion.div
          className="flex flex-col items-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            className="h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-500 mb-4 shadow-lg"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-white text-4xl">⚡</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">Quick Relief</h1>
          <p className="text-lg text-orange-700 dark:text-orange-200 text-center">3-minute emergency stress relief</p>
        </motion.div>

        {/* Progress Bar */}
        <div className="w-full mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {step + 1} of {scriptSteps.length}</span>
            <span>{formatTime(stepTimeLeft)}</span>
          </div>
          <div className="w-full bg-orange-200 rounded-full h-2">
            <motion.div
              className="bg-orange-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${stepProgress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Stepper Card */}
        <div className="w-full flex flex-col items-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              {...handlers}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full"
            >
              <Card className="mb-6 border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-md">
                <CardContent className="p-8 text-center">
                  <p className="text-lg text-gray-700 dark:text-gray-200 leading-relaxed min-h-[120px] flex items-center justify-center">
                    {loadingAudio && scriptSteps.length === 0 ? "Loading..." : scriptSteps[step]}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Progress Dots */}
          <div className="flex gap-2 mb-6">
            {scriptSteps.map((_, i) => (
              <span 
                key={i} 
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i === step ? 'bg-orange-500 scale-125' : 
                  i < step ? 'bg-orange-400' : 'bg-orange-200'
                }`} 
              />
            ))}
          </div>

          {/* Control Buttons */}
          <div className="flex gap-4 mb-8">
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handlePrevious} 
              disabled={step === 0}
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-8"
              onClick={handlePlayPause}
              disabled={loadingAudio}
            >
              {loadingAudio ? (
                'Loading...'
              ) : isPlaying ? (
                <>
                  <Pause className="mr-2 h-5 w-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Play
                </>
              )}
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleNext} 
              disabled={step === scriptSteps.length - 1}
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          {/* Auto-advance toggle */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="autoAdvance"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
              className="w-4 h-4 text-orange-500"
            />
            <label htmlFor="autoAdvance" className="text-sm text-gray-600">
              Auto-advance cards
            </label>
          </div>
        </div>

        {/* Audio element */}
        <audio
          ref={audioRef}
          src={audioUrl ? audioUrl : undefined}
          onEnded={() => setIsPlaying(false)}
          preload="auto"
        />
      </div>
    </div>
  );
}
