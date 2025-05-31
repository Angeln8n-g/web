
import { useState, useEffect, useCallback, useRef } from 'react';
import { PomodoroSettings, PomodoroMode } from '../types';
import { useAppContext } from '../contexts/AppContext';

const BEEP_SOUND_URL = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVhvT18AAAAAAAAAAAAAAAAAAAAAAAD//wIA/f8EAAEzAREAAAAA//8CAP3/BAABMwERAAAAAP//AgD9/wQAAXMBERAAAAA="; // Simple beep

export const usePomodoro = (initialTask?: { id: string, title: string }) => {
  const { settings, addPomodoroSession } = useAppContext();
  const { workDuration, shortBreakDuration, longBreakDuration, sessionsBeforeLongBreak } = settings.pomodoro; // soundNotifications removed from here

  const [mode, setMode] = useState<PomodoroMode>('work');
  const [timeLeft, setTimeLeft] = useState(workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [currentFocusedTask, setCurrentFocusedTask] = useState(initialTask);

  const timerRef = useRef<number | null>(null); // Changed NodeJS.Timeout to number
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (settings.soundNotifications) { // Access soundNotifications directly from settings
      audioRef.current = new Audio(BEEP_SOUND_URL);
    } else {
      audioRef.current = null;
    }
  }, [settings.soundNotifications]); // Dependency updated
  
  const playSound = useCallback(() => {
    if (audioRef.current && settings.soundNotifications) { // Access soundNotifications directly from settings
      audioRef.current.play().catch(error => console.warn("Audio play failed:", error));
    }
  }, [settings.soundNotifications]); // Dependency updated

  const switchMode = useCallback((nextMode: PomodoroMode, completedSessionType?: PomodoroMode) => {
    setIsActive(false);
    if (completedSessionType) {
      const sessionDuration = completedSessionType === 'work' ? workDuration : (completedSessionType === 'shortBreak' ? shortBreakDuration : longBreakDuration);
      addPomodoroSession({
        taskId: currentFocusedTask?.id,
        taskTitle: currentFocusedTask?.title,
        startTime: new Date(Date.now() - sessionDuration * 60 * 1000).toISOString(),
        endTime: new Date().toISOString(),
        duration: sessionDuration,
        type: completedSessionType,
      });
    }
    
    setMode(nextMode);
    let newTimeLeft;
    if (nextMode === 'work') {
      newTimeLeft = workDuration * 60;
    } else if (nextMode === 'shortBreak') {
      newTimeLeft = shortBreakDuration * 60;
    } else { // longBreak
      newTimeLeft = longBreakDuration * 60;
    }
    setTimeLeft(newTimeLeft);
    playSound();
  }, [workDuration, shortBreakDuration, longBreakDuration, addPomodoroSession, playSound, currentFocusedTask]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setTimeout(() => { // Explicitly use window.setTimeout
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      const completedMode = mode;
      if (mode === 'work') {
        setSessionCount(prev => prev + 1);
        if ((sessionCount + 1) % sessionsBeforeLongBreak === 0) {
          switchMode('longBreak', completedMode);
        } else {
          switchMode('shortBreak', completedMode);
        }
      } else { // break ended
        switchMode('work', completedMode);
      }
    }
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current); // Explicitly use window.clearTimeout
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, timeLeft, mode, sessionCount, sessionsBeforeLongBreak, switchMode]);

  useEffect(() => {
    // Reset timer when settings change
    setIsActive(false);
    const newDuration = mode === 'work' ? workDuration : mode === 'shortBreak' ? shortBreakDuration : longBreakDuration;
    setTimeLeft(newDuration * 60);
  }, [workDuration, shortBreakDuration, longBreakDuration, mode]);


  const startTimer = useCallback(() => setIsActive(true), []);
  const pauseTimer = useCallback(() => setIsActive(false), []);
  
  const resetTimer = useCallback(() => {
    setIsActive(false);
    const currentModeDuration = mode === 'work' ? workDuration : mode === 'shortBreak' ? shortBreakDuration : longBreakDuration;
    setTimeLeft(currentModeDuration * 60);
  }, [mode, workDuration, shortBreakDuration, longBreakDuration]);

  const skipTimer = useCallback(() => {
    const skippedMode = mode;
    if (mode === 'work') {
      setSessionCount(prev => prev + 1); // Count as completed work session for logic
      if ((sessionCount + 1) % sessionsBeforeLongBreak === 0) {
        switchMode('longBreak', skippedMode);
      } else {
        switchMode('shortBreak', skippedMode);
      }
    } else { // break ended
      switchMode('work', skippedMode);
    }
  }, [mode, sessionCount, sessionsBeforeLongBreak, switchMode]);

  const selectTaskToFocus = useCallback((task?: {id: string, title: string}) => {
    setCurrentFocusedTask(task);
  }, []);


  return {
    timeLeft,
    mode,
    isActive,
    sessionCount,
    startTimer,
    pauseTimer,
    resetTimer,
    skipTimer,
    currentFocusedTask,
    selectTaskToFocus,
    pomodoroSettings: settings.pomodoro,
  };
};
