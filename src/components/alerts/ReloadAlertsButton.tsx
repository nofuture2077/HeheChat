import { useEffect, useState } from 'react';
import { AlertSystem } from './alertplayer';
import { Button } from '@mantine/core';
import { useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';
import { IconRefresh } from '@tabler/icons-react';

export function ReloadAlertsButton() {
  const [isAlertSystemRunning, setIsAlertSystemRunning] = useState<boolean>(AlertSystem.status());
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const config = useContext(ConfigContext);

  useEffect(() => {
    // Check the alert system status periodically
    const intervalId = setInterval(() => {
      const currentStatus = AlertSystem.status();
      setIsAlertSystemRunning(currentStatus);
      
      // If status changes to red (not running), make the button visible
      if (!currentStatus && !isVisible) {
        setIsVisible(true);
      }
      
      // If status changes to green (running), hide the button
      if (currentStatus && isVisible) {
        setIsVisible(false);
      }
    }, 1000); // Check every second

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [isVisible]);

  // Handle button click
  const handleClick = () => {
    // Initialize the alert system
    if (!isAlertSystemRunning) {
      AlertSystem.initialize();
    }
    
    // Hide the button
    setIsVisible(false);
  };

  // Only show the button when alerts are enabled, the system is not running, and the button is set to visible
  if (!config?.playAlerts || isAlertSystemRunning || !isVisible) {
    return null;
  }

  // Render a large, touch-friendly button
  return (
    <Button
      size="xl"
      radius="xl"
      color="#ff1493"
      leftSection={<IconRefresh size={24} />}
      onClick={handleClick}
      style={{
        padding: '16px 24px',
        fontSize: '18px',
        width: '100%',
        height: '200px',
        maxWidth: '400px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'center',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
      }}
    >
      Activate Alerts
    </Button>
  );
}
