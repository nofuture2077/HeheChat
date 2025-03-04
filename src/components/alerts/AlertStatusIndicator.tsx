import { useEffect, useState } from 'react';
import { AlertSystem } from './alertplayer';

interface AlertStatusIndicatorProps {
  // Optional props can be added here if needed
}

export function AlertStatusIndicator(_props: AlertStatusIndicatorProps) {
  const [isAlertSystemRunning, setIsAlertSystemRunning] = useState<boolean>(AlertSystem.status());

  useEffect(() => {
    // Check the alert system status periodically
    const intervalId = setInterval(() => {
      setIsAlertSystemRunning(AlertSystem.status());
    }, 1000); // Check every second

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // If the alert system is running, don't show the indicator
  if (isAlertSystemRunning) {
    return null;
  }

  // Style for the red dot indicator
  const indicatorStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '10px',
    right: '10px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#DB32BC',
    zIndex: 9999, // Ensure it's above other elements
  };

  return <div style={indicatorStyle} title="Alert System is not running" />;
}
