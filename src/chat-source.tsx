import ReactDOM from 'react-dom/client';
import ChatSourceApp from './ChatSourceApp';

function getQueryVariable(query: string, variable: string): string | undefined {
  const vars = query.split('&');
  for (const pair of vars) {
    const [key, value] = pair.split('=');
    if (decodeURIComponent(key) === variable) {
      return value !== undefined ? decodeURIComponent(value) : '';
    }
  }
}

const query = window.location.hash.substring(1);
const token = getQueryVariable(query, 'token');

localStorage.setItem('hehe-sink', token || '');
localStorage.setItem('hehe-mode', 'browsersource');

ReactDOM.createRoot(document.getElementById('chat')!).render(
  <ChatSourceApp token={token} />
);
