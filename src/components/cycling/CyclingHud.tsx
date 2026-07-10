import styles from './CyclingHud.module.css';

export interface CyclingData {
  speedKmh: number;
  distanceKm: number;
  splitDistanceKm: number;
  location: string;
  gradientPercent: number;
  elevationGainM: number;
  elevationLossM: number;
  splitElevationGainM: number;
  splitElevationLossM: number;
}

export interface CyclingHudVisibility {
  speed: boolean;
  distance: boolean;
  location: boolean;
  gradient: boolean;
  elevation: boolean;
  // when on, distance/elevation also show today's split values alongside the overall ones
  split: boolean;
}

export interface CyclingHudConfig {
  visible: CyclingHudVisibility;
  // dynamic elements hide themselves below these thresholds
  minSpeedKmh: number;
  minGradientPercent: number;
}

const defaultConfig: CyclingHudConfig = {
  visible: {
    speed: true,
    distance: true,
    location: true,
    gradient: true,
    elevation: true,
    split: false,
  },
  minSpeedKmh: 1,
  minGradientPercent: 2,
};

function fmt(n: number, digits = 0) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

// ponytail: inline icons instead of an icon library, this is the entire icon set the HUD needs
function IconPin() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21s7-6.4 7-11.5A7 7 0 0 0 5 9.5C5 14.6 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function IconRoute() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="5" cy="6" r="2" />
      <circle cx="19" cy="18" r="2" />
      <path d="M5 8v4a4 4 0 0 0 4 4h6" />
    </svg>
  );
}

function IconSpeed() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 15a8 8 0 1 1 16 0" />
      <path d="M12 15l4-4" />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconIncline() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 17l7-9 4 5 7-9" />
      <path d="M17 4h4v4" />
    </svg>
  );
}

function IconElevationUp() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </svg>
  );
}

function IconElevationDown() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14" />
      <path d="M6 13l6 6 6-6" />
    </svg>
  );
}

function Gauge({
  accentClass,
  big,
  icon,
  value,
  unit,
  secondaryValue,
}: {
  accentClass: string;
  big?: boolean;
  icon?: React.ReactNode;
  value: string;
  unit: string;
  secondaryValue?: string;
}) {
  return (
    <div
      className={`${styles.gauge} ${big ? styles.gaugeBig : ''} ${
        secondaryValue ? styles.gaugeHasSecondary : ''
      } ${accentClass}`}
    >
      <div className={styles.gaugeMain}>
        {secondaryValue ? (
          <>
            <span className={styles.gaugeIconUnit}>
              {icon}
              <span className={styles.gaugeUnitSmall}>{unit}</span>
            </span>
            <span className={styles.gaugeValue}>{value}</span>
          </>
        ) : (
          <>
            {icon}
            <span className={styles.gaugeValue}>{value}</span>
            <span className={styles.gaugeUnit}>{unit}</span>
          </>
        )}
      </div>
      {secondaryValue && <span className={styles.gaugeSecondary}>{secondaryValue}</span>}
    </div>
  );
}

export default function CyclingHud({
  data,
  config = defaultConfig,
}: {
  data: CyclingData;
  config?: CyclingHudConfig;
}) {
  const { visible } = config;
  const showSpeed = visible.speed && data.speedKmh >= config.minSpeedKmh;
  const gradientAboveThreshold = Math.abs(data.gradientPercent) >= config.minGradientPercent;
  const showGradient = visible.gradient && gradientAboveThreshold;
  const showElevation = visible.elevation;
  const showTopChips = visible.location || visible.distance;
  const showBottomGauges = showSpeed || showGradient || showElevation;

  return (
    <div className={styles.root}>
      {showTopChips && (
        <div className={`${styles.chipCluster} ${styles.topLeft}`}>
          {visible.location && (
            <div className={`${styles.chip} ${styles.location}`}>
              <span className={styles.chipIcon}>
                <IconPin />
              </span>
              <span className={styles.text}>{data.location}</span>
            </div>
          )}
          <div className={styles.chipRow}>
            {visible.distance && (
              <div className={`${styles.chip} ${styles.distance}`}>
                <span className={styles.chipIcon}>
                  <IconRoute />
                </span>
                <span className={styles.chipValues}>
                  <span className={styles.value}>
                    {fmt(visible.split ? data.splitDistanceKm : data.distanceKm, 1)}
                    <span className={styles.unit}>km</span>
                  </span>
                  {visible.split && (
                    <span className={styles.chipSecondary}>
                      {fmt(data.distanceKm, 1)}
                      <span className={styles.unit}>km</span>
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {showBottomGauges && (
        <div className={`${styles.gaugeRow} ${styles.bottomRight}`}>
          {showElevation && (
            <div className={styles.elevationPair}>
              <Gauge
                accentClass={styles.gain}
                icon={<IconElevationUp />}
                value={fmt(visible.split ? data.splitElevationGainM : data.elevationGainM)}
                unit="m"
                secondaryValue={visible.split ? fmt(data.elevationGainM) : undefined}
              />
              <Gauge
                accentClass={styles.loss}
                icon={<IconElevationDown />}
                value={fmt(visible.split ? data.splitElevationLossM : data.elevationLossM)}
                unit="m"
                secondaryValue={visible.split ? fmt(data.elevationLossM) : undefined}
              />
            </div>
          )}
          {showGradient && (
            <Gauge accentClass={styles.gradient} icon={<IconIncline />} value={fmt(data.gradientPercent, 1)} unit="%" />
          )}
          {showSpeed && <Gauge accentClass={styles.speed} big icon={<IconSpeed />} value={fmt(data.speedKmh, 0)} unit="km/h" />}
        </div>
      )}
    </div>
  );
}
