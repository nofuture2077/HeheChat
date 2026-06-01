import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import BrowserSource from './BrowserSourceApp';
import { useVersionCheck } from './hooks/useVersionCheck';
import { AlertSystem } from './components/alerts/alertplayer';

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

function AlertRoot({ token, preview }: { token: string | undefined; preview: boolean }) {
  const pendingReload = useRef(false);

  useVersionCheck({
    checkInterval: 30 * 60 * 1000,
    remoteManifestUrl: `${import.meta.env.VITE_SINK_URL}/manifest.json`,
    onNewVersionDetected: (_current, latest) => {
      if (latest) localStorage.setItem('hehe-current-version', latest);
      pendingReload.current = true;
    },
  });

  useEffect(() => {
    const id = setInterval(() => {
      if (pendingReload.current && AlertSystem.idle()) {
        window.location.reload();
      }
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return <BrowserSource token={token} preview={preview} />;
}

// Extract token from hash
const query = window.location.hash.substring(1);
const token = getQueryVariable(query, "token");
const preview = !!getQueryVariable(query, "preview");
localStorage.setItem('hehe-sink', token || '');
localStorage.setItem('hehe-mode', 'browsersource');

ReactDOM.createRoot(document.getElementById('alert')!).render(<AlertRoot token={token} preview={preview}/>);
