import { HomePage } from './pages/Home.page';
import { ChatPage } from './pages/Chat.page';
import { LoginContextContext } from './ApplicationContext';
import { useContext } from 'react';

interface RouterProps {
  connectionStatus?: {
    status: string;
    reconnectAttempts: number;
    lastHeartbeat: string | null;
  };
}

export function Router({ connectionStatus }: RouterProps) {
  const loginContext = useContext(LoginContextContext);
  if (!loginContext.isLoggedIn()) {
    return <HomePage/>
  }
  return <ChatPage connectionStatus={connectionStatus} />;
}
