import { useEffect, useState } from 'react';
import styles from './VisualAlertPlayer.module.css';
import { VisualAlert } from '@/commons/events';
import { AlertSystem } from '../alerts/alertplayer';
import PubSub from 'pubsub-js';

interface HighlightedTextProps {
  text: string;
}

function HighlightedText({ text }: HighlightedTextProps) {
  const parts = text ? text.split(/##(.*?)##/) : [];
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

export default function VisualAlertPlayer() {
  const [currentAlert, setCurrentAlert] = useState<VisualAlert | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [timestamp, setTimestamp] = useState(0);

  const getImage = (ref: string, channel: string) => {
    if (AlertSystem.alertConfig?.[channel]?.data?.files?.[ref]) {
      const file = AlertSystem.alertConfig[channel].data.files[ref];
      return `data:${file.mime};base64,${file.data}`;
    }
    return "";
  };

  const showAlert = (alert: VisualAlert) => {
    setCurrentAlert(alert);
    setIsVisible(true);

    setTimeout(() => {
      setIsVisible(false);
      setCurrentAlert(null);
    }, alert.duration);
  };

  useEffect(() => {
    // Subscribe to new alerts
    const alertToken = PubSub.subscribe('ALERT_SHOW', (_, data) => {
      showAlert(data);
      setTimestamp(Date.now());
    });

    // Cleanup subscriptions
    return () => {
      PubSub.unsubscribe(alertToken);
    };
  }, []);

  if (!currentAlert) return null;

  const containerClasses = [
    styles.alertContainer,
    isVisible && styles.visible,
    ...(currentAlert.position?.split(' ') || []).map(p => styles[p]),
    ...(currentAlert.layout?.split(' ') || []).map(l => styles[l]),
    // Support for font classes like 'font-headline-bangers font-text-molle'
    ...(currentAlert.layout?.split(' ').filter(l => l.startsWith('font-')) || []).map(f => styles[f])
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <div className={styles.contentWrapper}>
        {currentAlert.image && (
          <img 
            className={styles.image}
            src={getImage(currentAlert.image, currentAlert.channel)} 
            alt="Alert" 
            key={"image-" + timestamp}
          />
        )}
        <div className={styles.text}>
          <p><HighlightedText text={currentAlert.headline} /></p>
          <p>{currentAlert.text}</p>
        </div>
      </div>
    </div>
  );
}
