import { useEffect, useRef, useState } from 'react';

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

  const requestWakeLock = async () => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Wake Lock API is not supported in this browser' }));
      return;
    }

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      
      setState(prev => ({ 
        ...prev, 
        isActive: true, 
        error: null 
      }));

      // Listen for wake lock release
      wakeLockRef.current.addEventListener('release', () => {
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
    }
  };

  const releaseWakeLock = async () => {
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
  };

  // Handle visibility change - reacquire wake lock when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && state.isActive && !wakeLockRef.current) {
        // Reacquire wake lock when page becomes visible again
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

  return {
    ...state,
    requestWakeLock,
    releaseWakeLock,
  };
}
