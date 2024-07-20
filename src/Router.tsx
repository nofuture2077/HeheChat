import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from './pages/Home.page';
import { ChatPage } from './pages/Chat.page';
import { LoginContext } from './ApplicationContext';
import { useContext } from 'react';

const router = createBrowserRouter([
  {
    path: '/',
    element: <ChatPage />,
  }
]);

export function Router() {
  const loginContext = useContext(LoginContext);
  if (!loginContext.isLoggedIn()) {
    return <HomePage/>
  }
  return <RouterProvider router={router} />;
}
