import ReactDOM from 'react-dom/client';
import BrowserSource from './BrowserSourceApp';

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
const preview = !!getQueryVariable(query, "preview");
localStorage.setItem('hehe-sink', token || '');
localStorage.setItem('hehe-mode', 'browsersource');

ReactDOM.createRoot(document.getElementById('alert')!).render(<BrowserSource token={token} preview={preview}/>);
