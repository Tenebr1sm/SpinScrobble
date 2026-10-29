import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export function useTrackPoller() {
  const [track, setTrack] = useState(null);
  const [history, setHistory] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('spinscrobble_history');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [connectionError, setConnectionError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusPhase, setStatusPhase] = useState('waiting'); // 'waiting' | 'detected' | 'playing'
  const [isPolling, setIsPolling] = useState(true);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const currentTrackKeyRef = useRef(null);
  const transitionTimeoutRef = useRef(null);
  const detectedTimeoutRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.setItem('spinscrobble_history', JSON.stringify(history));
    }
  }, [history]);

  const showDetectedThenClean = useCallback((confirmedTrack) => {
    setTrack(confirmedTrack);
    setStatusPhase('detected');
    setSnackbarMessage(
      `New song detected: ${confirmedTrack.title} by ${confirmedTrack.artist}`
    );

    if (detectedTimeoutRef.current) {
      clearTimeout(detectedTimeoutRef.current);
    }
    detectedTimeoutRef.current = setTimeout(() => {
      setStatusPhase('playing');
    }, 5000);
  }, []);

  const refreshTrack = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/current-track`);
      if (!response.ok) {
        throw new Error(`Dashboard API returned ${response.status}`);
      }

      const data = await response.json();
      const incoming = data.track;

      if (!incoming) {
        currentTrackKeyRef.current = null;
        setTrack(null);
        setStatusPhase('waiting');
      } else {
        const incomingKey = `${incoming.artist}-${incoming.title}`;
        const previousKey = currentTrackKeyRef.current;

        if (incomingKey !== previousKey) {
          const hadPreviousTrack = previousKey !== null;
          currentTrackKeyRef.current = incomingKey;

          const confirmedAt = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          const confirmedTrack = { ...incoming, confirmedAt };
          const historyEntry = {
            ...confirmedTrack,
            id: `${incomingKey}-${Date.now()}`,
          };

          setHistory((prevHistory) => [historyEntry, ...prevHistory]);

          if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current);
          }

          if (hadPreviousTrack) {
            setStatusPhase('waiting');
            transitionTimeoutRef.current = setTimeout(() => {
              showDetectedThenClean(confirmedTrack);
            }, 2500);
          } else {
            showDetectedThenClean(confirmedTrack);
          }
        }
      }

      setConnectionError(false);
      setLoading(false);
    } catch {
      setConnectionError(true);
      setLoading(false);
    }
  }, [showDetectedThenClean]);

  useEffect(() => {
    refreshTrack();
    if (!isPolling) return;

    const interval = setInterval(refreshTrack, 2000);
    return () => clearInterval(interval);
  }, [isPolling, refreshTrack]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      if (detectedTimeoutRef.current) clearTimeout(detectedTimeoutRef.current);
    };
  }, []);

  const togglePolling = () => {
    setIsPolling((prev) => {
      const next = !prev;
      setSnackbarMessage(next ? 'Live polling resumed' : 'Live polling paused');
      return next;
    });
  };

  const clearHistory = () => setHistory([]);

  return {
    track,
    history,
    clearHistory,
    connectionError,
    loading,
    statusPhase,
    isPolling,
    togglePolling,
    refreshTrack,
    snackbarMessage,
    setSnackbarMessage,
  };
}