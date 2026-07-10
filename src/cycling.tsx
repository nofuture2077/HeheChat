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

function CyclingRoot() {
  const { data, config, status, error } = useMoblinCyclingHud();
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
    </>
  );
}

ReactDOM.createRoot(document.getElementById('cycling')!).render(<CyclingRoot />);
