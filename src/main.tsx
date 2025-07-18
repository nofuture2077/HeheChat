import ReactDOM from 'react-dom/client';
import HeheChat from '@/HeheChatApp';

localStorage.setItem('hehe-mode', 'app');

ReactDOM.createRoot(document.getElementById('root')!).render(<HeheChat />);
