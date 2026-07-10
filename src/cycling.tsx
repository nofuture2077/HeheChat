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

function CyclingRoot() {
  const { data, config, status, error } = useMoblinCyclingHud();
  return (
    <>
      {status === 'error' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            padding: '10px 16px',
            background: '#c62828',
            color: '#fff',
            fontFamily: 'sans-serif',
            fontSize: 14,
            zIndex: 9999,
          }}
        >
          Moblin-Verbindung fehlgeschlagen: {error}
        </div>
      )}
      {status === 'subscribed' && !data && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            padding: '10px 16px',
            background: '#f9a825',
            color: '#000',
            fontFamily: 'sans-serif',
            fontSize: 14,
            zIndex: 9999,
          }}
        >
          Mit Moblin verbunden, warte auf erste Telemetriedaten...
        </div>
      )}
      <CyclingHud data={data ?? previewData} config={config} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('cycling')!).render(<CyclingRoot />);
