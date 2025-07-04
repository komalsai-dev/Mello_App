'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';

interface BreathingAnimationProps {
  isActive: boolean;
  onToggle: () => void;
  breathingPattern?: {
    inhale: number;
    hold: number;
    exhale: number;
    pause: number;
  };
}

export function BreathingAnimation({ 
  isActive, 
  onToggle, 
  breathingPattern = { inhale: 4, hold: 4, exhale: 6, pause: 2 } 
}: BreathingAnimationProps) {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [count, setCount] = useState(0);

  const totalCycleTime = breathingPattern.inhale + breathingPattern.hold + 
                        breathingPattern.exhale + breathingPattern.pause;

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setCount(prev => {
        const newCount = (prev + 0.1) % totalCycleTime;
        
        if (newCount < breathingPattern.inhale) {
          setPhase('inhale');
        } else if (newCount < breathingPattern.inhale + breathingPattern.hold) {
          setPhase('hold');
        } else if (newCount < breathingPattern.inhale + breathingPattern.hold + breathingPattern.exhale) {
          setPhase('exhale');
        } else {
          setPhase('pause');
        }
        
        return newCount;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, breathingPattern, totalCycleTime]);

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return 'Breathe In';
      case 'hold': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'pause': return 'Pause';
    }
  };

  const getScale = () => {
    switch (phase) {
      case 'inhale': return 1.5;
      case 'hold': return 1.5;
      case 'exhale': return 1;
      case 'pause': return 1;
    }
  };

  const getAnimationDuration = () => {
    switch (phase) {
      case 'inhale': return breathingPattern.inhale;
      case 'hold': return breathingPattern.hold;
      case 'exhale': return breathingPattern.exhale;
      case 'pause': return breathingPattern.pause;
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      {/* Breathing Circle */}
      <div className="relative">
        <motion.div
          className="h-64 w-64 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 opacity-20"
          animate={{ scale: isActive ? getScale() : 1 }}
          transition={{
            duration: getAnimationDuration(),
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-700 opacity-40"
          animate={{ 
            scale: isActive ? getScale() * 0.8 : 0.8,
            rotate: isActive ? 360 : 0,
          }}
          transition={{
            scale: {
              duration: getAnimationDuration(),
              ease: "easeInOut",
            },
            rotate: {
              duration: totalCycleTime,
              repeat: Infinity,
              ease: "linear",
            },
          }}
        />
        <motion.div
          className="absolute inset-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-800 opacity-60"
          animate={{ scale: isActive ? getScale() * 0.6 : 0.6 }}
          transition={{
            duration: getAnimationDuration(),
            ease: "easeInOut",
          }}
        />
        <div className="absolute inset-16 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/90">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {isActive ? getPhaseText() : 'Ready'}
            </div>
            {isActive && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {Math.ceil(getAnimationDuration() - (count % getAnimationDuration()))}s
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="text-center space-y-4">
        <Button
          onClick={onToggle}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isActive ? (
            <>
              <Pause className="mr-2 h-5 w-5" />
              Pause Breathing
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Start Breathing
            </>
          )}
        </Button>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
          Follow the circle as it expands and contracts. Breathe in as it grows, 
          hold when it pauses, and breathe out as it shrinks.
        </p>
      </div>
    </div>
  );
}