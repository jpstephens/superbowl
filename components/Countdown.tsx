'use client';

import { useEffect, useState, useRef } from 'react';
import { Play } from 'lucide-react';

interface CountdownProps {
  targetDate: Date;
  variant?: 'default' | 'compact' | 'large';
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function Countdown({ targetDate, variant = 'default' }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLive, setIsLive] = useState(false);
  const prevValuesRef = useRef<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsLive(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60 * 60)) / 1000),
      };
    };

    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);
    prevValuesRef.current = initialTime;

    const timer = setInterval(() => {
      prevValuesRef.current = timeLeft;
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      if (newTimeLeft.days === 0 && newTimeLeft.hours === 0 && newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
        setIsLive(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (isLive) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-lg animate-pulse">
          <Play className="h-6 w-6" />
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Game is Live!</h2>
            <p className="text-sm opacity-90">Watch for real-time updates</p>
          </div>
        </div>
      </div>
    );
  }

  const isCompact = variant === 'compact';
  const isLarge = variant === 'large';

  const timeUnits = [
    { label: 'Days', value: timeLeft.days, prevValue: prevValuesRef.current.days },
    { label: 'Hours', value: timeLeft.hours, prevValue: prevValuesRef.current.hours },
    { label: 'Minutes', value: timeLeft.minutes, prevValue: prevValuesRef.current.minutes },
    { label: 'Seconds', value: timeLeft.seconds, prevValue: prevValuesRef.current.seconds },
  ];

  return (
    <div className={`grid grid-cols-4 gap-3 sm:gap-4 ${isLarge ? 'max-w-4xl' : 'max-w-2xl'} mx-auto`}>
      {timeUnits.map(({ label, value, prevValue }) => {
        const isChanging = value !== prevValue;
        return (
          <div
            key={label}
            className={`bg-gradient-to-br from-white to-gray-50 border-2 border-primary/20 rounded-xl p-3 sm:p-4 text-center shadow-sm hover:shadow-md transition-all duration-300 ${
              isChanging ? 'scale-105 border-primary/40' : ''
            }`}
          >
            <div
              className={`font-bold text-primary mb-1 transition-all duration-300 ${
                isLarge
                  ? 'text-5xl sm:text-6xl'
                  : isCompact
                  ? 'text-2xl sm:text-3xl'
                  : 'text-3xl sm:text-4xl lg:text-5xl'
              } ${isChanging ? 'animate-pulse' : ''}`}
            >
              {String(value).padStart(2, '0')}
            </div>
            <div className={`text-muted-foreground uppercase font-medium ${isCompact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
