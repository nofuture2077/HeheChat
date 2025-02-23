import ReactDOM from 'react-dom/client';
import HeheChat from '@/HeheChatApp';

document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
ReactDOM.createRoot(document.getElementById('root')!).render(<HeheChat />);
