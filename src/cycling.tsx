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
  const { data, config } = useMoblinCyclingHud();
  return <CyclingHud data={data ?? previewData} config={config} />;
}

ReactDOM.createRoot(document.getElementById('cycling')!).render(<CyclingRoot />);
