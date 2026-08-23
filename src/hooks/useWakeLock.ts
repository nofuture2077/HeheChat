import { useCallback, useEffect, useRef, useState } from 'react';

interface WakeLockState {
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
}

export function useWakeLock() {
  const [state, setState] = useState<WakeLockState>({
    isSupported: 'wakeLock' in navigator,
    isActive: false,
    error: null,
  });

  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const requestingRef = useRef(false);

  const requestWakeLock = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Wake Lock API is not supported in this browser' }));
      return;
    }

    // Don't request if we already have an active wake lock or a request in flight
    if (wakeLockRef.current || requestingRef.current) {
      return;
    }

    requestingRef.current = true;

    try {
      const sentinel = await navigator.wakeLock.request('screen');
      wakeLockRef.current = sentinel;

      setState(prev => ({
        ...prev,
        isActive: true,
        error: null
      }));

      // Listen for wake lock release (e.g. iOS releasing it on visibility loss)
      sentinel.addEventListener('release', () => {
        if (wakeLockRef.current === sentinel) {
          wakeLockRef.current = null;
        }
        setState(prev => ({
          ...prev,
          isActive: false
        }));
      });

      console.log('Screen wake lock activated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request wake lock';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isActive: false
      }));
      console.error('Failed to request wake lock:', error);
    } finally {
      requestingRef.current = false;
    }
  }, [state.isSupported]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setState(prev => ({
          ...prev,
          isActive: false,
          error: null
        }));
        console.log('Screen wake lock released');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to release wake lock';
        setState(prev => ({
          ...prev,
          error: errorMessage
        }));
        console.error('Failed to release wake lock:', error);
      }
    }
  }, []);

  // Reacquire the wake lock when the page becomes visible again (iOS releases it on backgrounding)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current) {
        void requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [requestWakeLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    requestWakeLock,
    releaseWakeLock,
  };
}
