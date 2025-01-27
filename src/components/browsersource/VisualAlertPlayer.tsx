import { useEffect, useState } from 'react';
import styles from './Alert.module.css';
import { VisualAlert, EventAlertConfig } from '@/commons/events';
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
  const [alertConfigs, setAlertConfigs] = useState<{ [key: string]: EventAlertConfig }>({});
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

    setTimeout(() => {
      setIsVisible(false);
    }, alert.duration);
  };

  useEffect(() => {
    // Subscribe to alert config updates
    const configToken = PubSub.subscribe('ALERT_CONFIG', (_, data) => {
      setAlertConfigs(data);
    });

    // Subscribe to new alerts
    const alertToken = PubSub.subscribe('ALERT_SHOW', (_, data) => {
      showAlert(data);
    });

    // Cleanup subscriptions
    return () => {
      PubSub.unsubscribe(configToken);
      PubSub.unsubscribe(alertToken);
    };
  }, []);

  if (!currentAlert) return null;

  const containerClasses = [
    styles.alertContainer,
    isVisible && styles.visible,
    ...(currentAlert.position?.split(' ') || []).map(p => styles[p]),
    ...(currentAlert.layout?.split(' ') || []).map(l => styles[l])
  ].filter(Boolean).concat(styles['font-bangers']).join(' ');

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
