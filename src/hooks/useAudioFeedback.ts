import { useCallback, useRef } from "react";

/**
 * Hook for playing audio feedback sounds using Web Audio API
 */
export const useAudioFeedback = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTimerComplete = useCallback(() => {
    try {
      const audioContext = getAudioContext();
      
      // Resume context if suspended (required for user gesture)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Create a pleasant chime sound (three ascending notes)
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 - major chord
      const now = audioContext.currentTime;

      notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        const startTime = now + index * 0.15;
        const duration = 0.4;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });
    } catch (error) {
      console.debug("Audio feedback not available:", error);
    }
  }, [getAudioContext]);

  const playButtonClick = useCallback(() => {
    try {
      const audioContext = getAudioContext();
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 440; // A4
      oscillator.type = 'sine';

      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      oscillator.start(now);
      oscillator.stop(now + 0.1);
    } catch (error) {
      console.debug("Audio feedback not available:", error);
    }
  }, [getAudioContext]);

  const playSuccess = useCallback(() => {
    try {
      const audioContext = getAudioContext();
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Two-note success sound
      const notes = [440, 554.37]; // A4, C#5
      const now = audioContext.currentTime;

      notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        const startTime = now + index * 0.1;
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
      });
    } catch (error) {
      console.debug("Audio feedback not available:", error);
    }
  }, [getAudioContext]);

  const playWarning = useCallback(() => {
    try {
      const audioContext = getAudioContext();
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 300;
      oscillator.type = 'triangle';

      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      oscillator.start(now);
      oscillator.stop(now + 0.3);
    } catch (error) {
      console.debug("Audio feedback not available:", error);
    }
  }, [getAudioContext]);

  return {
    playTimerComplete,
    playButtonClick,
    playSuccess,
    playWarning,
  };
};
