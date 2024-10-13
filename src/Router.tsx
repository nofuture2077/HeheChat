import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from './pages/Home.page';
import { ChatPage } from './pages/Chat.page';
import { LoginContextContext } from './ApplicationContext';
import { useContext } from 'react';

const router = createBrowserRouter([
  {
    path: '/',
    element: <ChatPage />,
  }
], {
  basename: '#{import.meta.env.VITE_BUILDNUMBER}'
});

export function Router() {
  const loginContext = useContext(LoginContextContext);
  if (!loginContext.isLoggedIn()) {
    return <HomePage/>
  }
  return <RouterProvider router={router} />;
}
