import { HomePage } from './pages/Home.page';
import { ChatPage } from './pages/Chat.page';
import { LoginContextContext } from './ApplicationContext';
import { useContext } from 'react';


export function Router() {
  const loginContext = useContext(LoginContextContext);
  if (!loginContext.isLoggedIn()) {
    return <HomePage/>
  }
  return <ChatPage />;
}
