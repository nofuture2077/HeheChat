import { useEffect, useState, useRef } from 'react';
import styles from './Alert.module.css';
import { VisualAlert, EventAlertConfig } from '@/commons/events' 

interface AlertConfigs {
  [key: string]: EventAlertConfig;
}

// Define all possible classes for reference
const AVAILABLE_CLASSES = {
  position: {
    vertical: ['top', 'middle', 'bottom'],
    horizontal: ['left', 'center', 'right']
  },
  layout: {
    alignment: ['align-left', 'align-center', 'align-right'],
    headlineSizes: ['headline-xs', 'headline-sm', 'headline-md', 'headline-lg', 'headline-xl'],
    textSizes: ['text-xs', 'text-sm', 'text-md', 'text-lg', 'text-xl'],
    effects: ['effect-bounce', 'effect-wave', 'effect-shake', 'effect-pulse', 'effect-glitch'],
    colors: ['yellow', 'green', 'red', 'blue', 'orange', 'pink', 'teal']
  }
};

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

interface HighlightedTextProps {
  text: string;
}

function HighlightedText({ text }: HighlightedTextProps) {
  const parts = text.split(/##(.*?)##/);
  return (
    <>
      {parts.map((part, index) => {
        // Every odd index is highlighted text (inside ##)
        if (index % 2 === 1) {
          return (
            <span key={index} className="highlight">
              {part.split('').map((char, charIndex) => (
                <span key={`${index}-${charIndex}`}>{char}</span>
              ))}
            </span>
          );
        }
        // Every even index is regular text
        return part;
      })}
    </>
  );
}

export default function Alert() {
  const [alertConfigs, setAlertConfigs] = useState<AlertConfigs>({});
  const [currentAlert, setCurrentAlert] = useState<VisualAlert | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const getImage = (ref: string, channel: string) => {
    if (alertConfigs?.[channel]?.data?.files?.[ref]) {
      const file = alertConfigs[channel].data.files[ref];
      return `data:${file.mime};base64,${file.data}`;
    }
    return "";
  };

  const showAlert = (alert: VisualAlert) => {
    setCurrentAlert(alert);
    setIsVisible(true);

    // Log all available classes
    console.log('Available Alert Classes:', {
      position: {
        description: 'Use in position prop as "vertical horizontal", e.g. "top center"',
        vertical: AVAILABLE_CLASSES.position.vertical,
        horizontal: AVAILABLE_CLASSES.position.horizontal,
        examples: [
          'top left',
          'middle center',
          'bottom right'
        ]
      },
      layout: {
        description: 'Use in layout prop, can combine multiple with spaces',
        alignment: AVAILABLE_CLASSES.layout.alignment,
        headlineSizes: AVAILABLE_CLASSES.layout.headlineSizes,
        textSizes: AVAILABLE_CLASSES.layout.textSizes,
        effects: AVAILABLE_CLASSES.layout.effects,
        colors: AVAILABLE_CLASSES.layout.colors,
        examples: [
          'headline-xl text-lg align-center effect-bounce yellow',
          'headline-md text-sm align-left effect-wave blue',
          'headline-lg text-md align-right effect-glitch pink'
        ]
      }
    });

    // Log current alert classes
    const positionClasses = (alert.position?.split(' ') || []).map(p => styles[p]);
    const layoutClasses = (alert.layout?.split(' ') || []).map(l => styles[l]);
    
    console.log('Current Alert Classes:', {
      position: alert.position,
      positionClasses,
      layout: alert.layout,
      layoutClasses,
      finalClasses: [
        styles.alertContainer,
        styles.visible,
        ...positionClasses,
        ...layoutClasses
      ].filter(Boolean).join(' ')
    });

    setTimeout(() => {
      setIsVisible(false);
    }, alert.duration);
  };

  const workerRef = useRef<Worker>();

  useEffect(() => {
    // Initialize the worker
    workerRef.current = new Worker(
      new URL('../webworker/backendworker.ts', import.meta.url),
      { type: 'module' }
    );

    // Set up message handler
    workerRef.current.onmessage = (event) => {
      const data = event.data;
      
      if (data.type === 'sharedata') {
        const profile = data.profile;
        setAlertConfigs(data.shares);
      }
      
      if (data.type === 'alert') {
        showAlert(data.data);
      }
    };

    // Send initial subscription message
    const query = window.location.hash.substring(1);
    workerRef.current.postMessage({
      type: 'SEND',
      data: {
        type: 'sink',
        token: getQueryVariable(query, "token")
      }
    });

    // Cleanup worker on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'STOP' });
        workerRef.current.terminate();
      }
    };
  }, []);

  if (!currentAlert) return null;

  const containerClasses = [
    styles.alertContainer,
    isVisible && styles.visible,
    ...(currentAlert.position?.split(' ') || []).map(p => styles[p]),
    ...(currentAlert.layout?.split(' ') || []).map(l => styles[l])
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {currentAlert.image && (
        <img 
          src={getImage(currentAlert.image, currentAlert.channel)} 
          alt="Alert" 
        />
      )}
      <div className={styles.text}>
        <p><HighlightedText text={currentAlert.headline} /></p>
        <p>{currentAlert.text}</p>
      </div>
    </div>
  );
}
