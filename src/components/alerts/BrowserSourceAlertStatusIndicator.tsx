import { useEffect, useState } from 'react';
import { AlertSystem } from './alertplayer';
import { useVersionCheck } from '../../hooks/useVersionCheck';

interface BrowserSourceAlertStatusIndicatorProps {
  // Optional props can be added here if needed
}

export function BrowserSourceAlertStatusIndicator(_props: BrowserSourceAlertStatusIndicatorProps) {
  const [isAlertSystemRunning, setIsAlertSystemRunning] = useState<boolean>(AlertSystem.status());
  const [updateCountdown, setUpdateCountdown] = useState<number>(0);

  // Use version check hook with custom remote URL
  const { 
    newVersionAvailable, 
    currentVersion, 
    latestVersion, 
    isChecking 
  } = useVersionCheck({
    checkInterval: 30 * 60 * 1000, // Check every 30 minutes
    remoteManifestUrl: `${import.meta.env.VITE_SINK_URL}/manifest.json`,
    onNewVersionDetected: (current, latest) => {
      console.log(`New version detected: ${current} -> ${latest}`);
      // Start countdown for update
      setUpdateCountdown(1); // 30 seconds countdown
    }
  });

  useEffect(() => {
    // Check the alert system status periodically
    const intervalId = setInterval(() => {
      setIsAlertSystemRunning(AlertSystem.status());
    }, 1000); // Check every second

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // Handle update countdown and refresh logic
  useEffect(() => {
    if (updateCountdown > 0) {
      const countdownInterval = setInterval(() => {
        setUpdateCountdown(prev => {
          if (prev <= 1) {
            // Check if it's safe to update (no alerts playing and queue is empty)
            const isPlaying = AlertSystem.playing;
            const queueLength = AlertSystem.quequeLength();
            
            if (!isPlaying && queueLength === 0) {
              // Safe to update - store new version and reload
              if (latestVersion) {
                localStorage.setItem('hehe-current-version', latestVersion);
              }
              window.location.reload();
            } else {
              // Not safe to update yet, reset countdown to check again in 30 seconds
              console.log(`Update delayed: playing=${isPlaying}, queue=${queueLength}`);
              return 10;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [updateCountdown, latestVersion]);

  // Determine indicator color and message based on state
  const getIndicatorState = () => {
    if (newVersionAvailable && updateCountdown > 0) {
      return {
        color: '#ffa500', // Orange for pending update
        title: `Updating in ${updateCountdown}s`,
        show: true
      };
    }
    
    if (!isAlertSystemRunning) {
      return {
        color: '#ff1493', // Pink/red for alert system not running
        title: 'Alert System is not running',
        show: true
      };
    }
    
    return {
      color: '#00ff00', // Green for all good
      title: 'All systems running',
      show: false // Don't show when everything is working
    };
  };

  const indicatorState = getIndicatorState();

  // Don't show indicator if everything is working normally
  if (!indicatorState.show) {
    return null;
  }

  // Style for the status indicator
  const indicatorStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '10px',
    right: '10px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: indicatorState.color,
    zIndex: 9999, // Ensure it's above other elements
    boxShadow: '0 0 4px rgba(0,0,0,0.3)',
  };

  return <div style={indicatorStyle} title={indicatorState.title} />;
}
