import { Component, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import CyclingHud, { type CyclingData } from './components/cycling/CyclingHud';
import { useMoblinCyclingHud } from './hooks/useMoblinCyclingHud';

// ponytail: fallback so the design still renders when opened outside a Moblin browser source
const previewData: CyclingData = {
  speedKmh: 27.4,
  dayDistanceKm: 42.8,
  totalDistanceKm: 1834.2,
  location: 'Aachen, Deutschland',
  gradientPercent: 6.5,
  elevationGainM: 312,
  elevationLossM: 128,
};

interface BannerProps {
  background: string;
  color: string;
  children: ReactNode;
}

function Banner({ background, color, children }: BannerProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '10px 16px',
        background,
        color,
        fontFamily: 'sans-serif',
        fontSize: 14,
        zIndex: 9999,
      }}
    >
      {children}
    </div>
  );
}

// a bad telemetry field must never take the whole overlay down with it
class HudErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <Banner background="#c62828" color="#fff">HUD-Renderfehler: {this.state.error.message}</Banner>;
    }
    return this.props.children;
  }
}

function DebugPanel({ status, debug }: { status: string; debug: ReturnType<typeof useMoblinCyclingHud>['debug'] }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        padding: '8px 12px',
        background: 'rgba(0,0,0,0.75)',
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: 12,
        lineHeight: 1.5,
        zIndex: 9999,
        whiteSpace: 'pre',
      }}
    >
      {`status: ${status}
telemetry messages: ${debug.telemetryCount}
chat messages: ${debug.chatCount}
last chat user: ${debug.lastChatUser ?? '-'}
last chat text: ${debug.lastChatText ?? '-'}
last rejected user: ${debug.lastRejectedUser ?? '-'}`}
    </div>
  );
}

function CyclingRoot() {
  const { data, config, status, error, debug } = useMoblinCyclingHud();
  return (
    <>
      {status === 'error' && (
        <Banner background="#c62828" color="#fff">Moblin-Verbindung fehlgeschlagen: {error}</Banner>
      )}
      {status === 'subscribed' && !data && (
        <Banner background="#f9a825" color="#000">Mit Moblin verbunden, warte auf erste Telemetriedaten...</Banner>
      )}
      <HudErrorBoundary>
        <CyclingHud data={data ?? previewData} config={config} />
      </HudErrorBoundary>
      <DebugPanel status={status} debug={debug} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('cycling')!).render(<CyclingRoot />);
