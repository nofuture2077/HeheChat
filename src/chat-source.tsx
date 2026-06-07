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
const showSystem = getQueryVariable(query, 'showSystem') !== undefined;
const maxMessages = parseInt(getQueryVariable(query, 'maxMessages') ?? '50', 10);
const fontSize = parseInt(getQueryVariable(query, 'fontSize') ?? '14', 10);
const width = getQueryVariable(query, 'width') ?? '100%';
const height = getQueryVariable(query, 'height') ?? '100%';
const padding = parseInt(getQueryVariable(query, 'padding') ?? '4', 10);

localStorage.setItem('hehe-sink', token || '');
localStorage.setItem('hehe-mode', 'browsersource');

ReactDOM.createRoot(document.getElementById('chat')!).render(
  <ChatSourceApp
    token={token}
    showSystem={showSystem}
    maxMessages={maxMessages}
    fontSize={fontSize}
    width={width}
    height={height}
    padding={padding}
  />
);
