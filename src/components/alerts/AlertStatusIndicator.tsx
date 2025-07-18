import { useEffect, useState, ReactNode } from 'react';
import { AlertSystem } from './alertplayer';
import { Tooltip, Indicator } from '@mantine/core';
import { useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';

export interface AlertStatusIndicatorProps {
  inline?: boolean; // Add a prop to control if the indicator should be inline or fixed
  children?: ReactNode; // Optional children to wrap with the indicator
}

export function AlertStatusIndicator(props: AlertStatusIndicatorProps) {
  const [isAlertSystemRunning, setIsAlertSystemRunning] = useState<boolean>(AlertSystem.status());
  const config = useContext(ConfigContext);

  useEffect(() => {
    // Check the alert system status periodically
    const intervalId = setInterval(() => {
      setIsAlertSystemRunning(AlertSystem.status());
    }, 1000); // Check every second

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // If children are provided, wrap them with an Indicator
  if (props.children) {
    return (
      <Indicator 
        size={8} 
        offset={2} 
        color={isAlertSystemRunning ? 'green' : 'red'} 
        processing={!isAlertSystemRunning} 
        disabled={!config?.playAlerts}
      >
        {props.children}
      </Indicator>
    );
  }

  // Alert system indicator
  const alertIndicatorStyle: React.CSSProperties = {
    ...(props.inline ? {} : { right: '10px' }),
    backgroundColor: isAlertSystemRunning ? 'transparent' : '#DB32BC',
    display: isAlertSystemRunning ? 'none' : 'block',
  };

  // If inline, render in a container div
  if (props.inline) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
        {!isAlertSystemRunning && (
          <Tooltip label="Alert System is not running">
            <div style={alertIndicatorStyle} />
          </Tooltip>
        )}
      </div>
    );
  }
  
  // Otherwise render as fixed position indicator
  return (
    <>
      {!isAlertSystemRunning && (
        <Tooltip label="Alert System is not running">
          <div style={alertIndicatorStyle} />
        </Tooltip>
      )}
    </>
  );
}
