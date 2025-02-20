import ReactDOM from 'react-dom/client';
import ReplayApp from './ReplayApp';

function getQueryVariable(query: string, variable: string): string | undefined {
  const vars = query.split('&');
  for (const pair of vars) {
    const [key, value] = pair.split('=');
    if (decodeURIComponent(key) === variable) {
      return decodeURIComponent(value);
    }
  }
  console.log('Query variable %s not found', variable);
}

// Extract token from hash
const query = window.location.hash.substring(1);
const token = getQueryVariable(query, "token");
localStorage.setItem('hehe-sink', token || '');

ReactDOM.createRoot(document.getElementById('replay')!).render(<ReplayApp token={token}/>);
