import { useEffect, useRef } from 'react';
import PubSub from 'pubsub-js';
import VisualAlertPlayer from './VisualAlertPlayer';

interface BrowserSourceProps {
  token: string | undefined;
}

export default function BrowserSource({ token }: BrowserSourceProps) {
  const workerRef = useRef<Worker>();

  useEffect(() => {
    // Initialize the worker
    workerRef.current = new Worker(
      new URL('../webworker/backendworker.ts', import.meta.url),
      { type: 'module' }
    );

    // Set up message handler
    workerRef.current.onmessage = (event) => {
      const data = event.data;
      
      if (data.type === 'sharedata') {
        const profile = data.profile;
        // Publish alert configs
        PubSub.publish('ALERT_CONFIG', data.shares);
      }
      
      if (data.type === 'alert') {
        // Publish alert data
        PubSub.publish('ALERT_SHOW', data.data);
      }
    };

    // Send initial subscription message
    workerRef.current.postMessage({
      type: 'SEND',
      data: {
        type: 'sink',
        token
      }
    });

    // Cleanup worker on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'STOP' });
        workerRef.current.terminate();
      }
    };
  }, [token]);

  return <VisualAlertPlayer />;
}
