import { useEffect, useState, ReactNode } from 'react';
import { Indicator } from '@mantine/core';
import { useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';

export interface ConnectionStatusIndicatorProps {
  connectionStatus?: {
    status: string;
    reconnectAttempts: number;
    lastHeartbeat: string | null;
  };
  children?: ReactNode; // Optional children to wrap with the indicator
}

export function ConnectionStatusIndicator(props: ConnectionStatusIndicatorProps) {
  const [localConnectionStatus, setLocalConnectionStatus] = useState(props.connectionStatus);
  const { connectionStatus } = props;
  const config = useContext(ConfigContext);

  // Log when connectionStatus prop changes
  useEffect(() => {
    console.log('ConnectionStatusIndicator: connectionStatus changed', connectionStatus);
    setLocalConnectionStatus(connectionStatus);
  }, [connectionStatus]);

  // If children are provided, wrap them with an Indicator
  if (props.children) {
    return (
      <Indicator 
        size={8} 
        offset={2} 
        color={getConnectionStatusColor(localConnectionStatus?.status)} 
        processing={localConnectionStatus?.status !== 'CONNECTED'} 
        disabled={!localConnectionStatus}
      >
        {props.children}
      </Indicator>
    );
  }
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
