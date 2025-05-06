import { useEffect, useState } from 'react';
import { AlertSystem } from './alertplayer';
import { Tooltip } from '@mantine/core';

export interface AlertStatusIndicatorProps {
  connectionStatus?: {
    status: string;
    reconnectAttempts: number;
    lastHeartbeat: string | null;
  };
}

export function AlertStatusIndicator(props: AlertStatusIndicatorProps) {
  const [isAlertSystemRunning, setIsAlertSystemRunning] = useState<boolean>(AlertSystem.status());
  const { connectionStatus } = props;

  useEffect(() => {
    // Check the alert system status periodically
    const intervalId = setInterval(() => {
      setIsAlertSystemRunning(AlertSystem.status());
    }, 1000); // Check every second

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // Base style for the indicator dots
  const baseIndicatorStyle: React.CSSProperties = {
    position: 'fixed',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    zIndex: 9999, // Ensure it's above other elements
  };

  // Alert system indicator
  const alertIndicatorStyle: React.CSSProperties = {
    ...baseIndicatorStyle,
    bottom: '10px',
    right: '10px',
    backgroundColor: isAlertSystemRunning ? 'transparent' : '#DB32BC',
    display: isAlertSystemRunning ? 'none' : 'block',
  };

  // Connection status indicator
  const connectionIndicatorStyle: React.CSSProperties = {
    ...baseIndicatorStyle,
    bottom: '10px',
    right: '30px', // Position to the left of the alert indicator
    backgroundColor: getConnectionStatusColor(connectionStatus?.status),
    display: connectionStatus ? 'block' : 'none',
  };

  // Get tooltip text for connection status
  const getConnectionTooltip = () => {
    if (!connectionStatus) return '';
    
    const { status, reconnectAttempts, lastHeartbeat } = connectionStatus;
    let tooltipText = `Connection: ${status}`;
    
    if (status === 'DISCONNECTED' || status === 'RECONNECTING') {
      tooltipText += `, Reconnect attempts: ${reconnectAttempts}`;
    }
    
    if (lastHeartbeat) {
      tooltipText += `, Last heartbeat: ${new Date(lastHeartbeat).toLocaleTimeString()}`;
    }
    
    return tooltipText;
  };

  return (
    <>
      {!isAlertSystemRunning && (
        <Tooltip label="Alert System is not running">
          <div style={alertIndicatorStyle} />
        </Tooltip>
      )}
      
      {connectionStatus && (
        <Tooltip label={getConnectionTooltip()}>
          <div style={connectionIndicatorStyle} />
        </Tooltip>
      )}
    </>
  );
}

// Helper function to determine the color based on connection status
function getConnectionStatusColor(status?: string): string {
  switch (status) {
    case 'CONNECTED':
      return '#4CAF50'; // Green
    case 'CONNECTING':
      return '#FFC107'; // Yellow
    case 'RECONNECTING':
      return '#FF9800'; // Orange
    case 'DISCONNECTED':
      return '#F44336'; // Red
    default:
      return '#9E9E9E'; // Grey for unknown status
  }
}
