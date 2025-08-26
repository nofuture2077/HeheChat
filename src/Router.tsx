import { HomePage } from './pages/Home.page';
import { ChatPage } from './pages/Chat.page';
import { LoginContextContext } from './ApplicationContext';
import { useContext, useEffect } from 'react';
import PubSub from 'pubsub-js';

interface RouterProps {
  connectionStatus?: {
    status: string;
    reconnectAttempts: number;
    lastHeartbeat: string | null;
  };
}

export function Router({ connectionStatus }: RouterProps) {
  const loginContext = useContext(LoginContextContext);
  
  useEffect(() => {
    if (window.location.pathname === '/massban' && loginContext.isLoggedIn()) {
      const channelId = loginContext.user?.id || '';
      const channelName = loginContext.user?.name || '';
      
      PubSub.publish("OPEN_MASSBAN", { channelId, channelName });
    }

    if (window.location.pathname === '/premium' && loginContext.isLoggedIn()) {
      PubSub.publish("OPEN_PREMIUM");
    }
  }, [loginContext]);
  
  if (!loginContext.isLoggedIn()) {
    return <HomePage/>
  }
  return <ChatPage connectionStatus={connectionStatus} />;
}
