import { useEffect, useState, useContext } from 'react';
import styles from './VisualAlertPlayer.module.css';
import { VisualAlert } from '@/commons/events';
import { AlertSystem } from '../alerts/alertplayer';
import { ChatEmotesContext } from '@/ApplicationContext';
import PubSub from 'pubsub-js';
import { ChatEmotes } from '@/commons/emotes';
import { joinWithSpace } from '../../commons/helper';
import { EmoteComponentSimple } from '../emote/emote';

interface HighlightedTextProps {
  text: string;
}

function HighlightedText({ text }: HighlightedTextProps) {
  const parts = text ? text.split(/##(.*?)##/) : [];
  return (
    <>
      {parts.map((part, index) => {
        // Replace spaces with non-breaking spaces
        const processedPart = part.replace(/ /g, '\u00A0');
        
        // Every odd index is highlighted text (inside ##)
        if (index % 2 === 1) {
          return (
            <span key={index} className="highlight">
              {processedPart.split('').map((char, charIndex) => (
                <span key={`${index}-${charIndex}`}>{char}</span>
              ))}
            </span>
          );
        }
        // Every even index is regular text
        return processedPart;
      })}
    </>
  );
}

function formatText(text: string, emotes: ChatEmotes, channel: string) {
  return joinWithSpace(text.split(' ').map((word, index) => {
      if (word.startsWith('image//')) {
        const url = word.substring(5);
        return <EmoteComponentSimple imageUrl={url} largeImageUrl={url} name='emote' type=''/>
      }
      return emotes.checkEmote(channel, word, "" + index, true);
  }));
}

export default function VisualAlertPlayer() {
  const [currentAlert, setCurrentAlert] = useState<VisualAlert | null>(null);
  const chatEmotes = useContext(ChatEmotesContext);
  const [isVisible, setIsVisible] = useState(false);
  const [timestamp, setTimestamp] = useState(0);

  const getMediaData = (ref: string, channel: string) => {
    if (AlertSystem.alertConfig?.[channel]?.data?.files?.[ref]) {
      const file = AlertSystem.alertConfig[channel].data.files[ref];
      return {
        src: `data:${file.mime};base64,${file.data}`,
        type: file.type,
        mime: file.mime
      };
    }
    return null;
  };

  const isVideoMimeType = (mime: string) => {
    return mime.startsWith('video/') || mime === 'video/webm' || mime === 'video/mp4' || mime === 'video/ogg';
  };

  useEffect(() => {
    let alertTimeoutId: number | undefined;
    
    // Subscribe to new alerts
    const alertToken = PubSub.subscribe('ALERT_SHOW', (_, data) => {
      // Clear any existing timeout
      if (alertTimeoutId) {
        clearTimeout(alertTimeoutId);
      }
      
      setCurrentAlert(data);
      setIsVisible(true);
      setTimestamp(Date.now());

      // Set timeout to hide alert
      alertTimeoutId = setTimeout(() => {
        setIsVisible(false);
        setCurrentAlert(null);
        alertTimeoutId = undefined;
      }, data.duration) as unknown as number;
    });

    // Cleanup subscriptions and any pending timeouts
    return () => {
      PubSub.unsubscribe(alertToken);
      if (alertTimeoutId) {
        clearTimeout(alertTimeoutId);
      }
      setIsVisible(false);
      setCurrentAlert(null);
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
        {currentAlert.image && (() => {
          const mediaData = getMediaData(currentAlert.image, currentAlert.channel);
          if (!mediaData) return null;
          
          if (mediaData.type === 'video' || isVideoMimeType(mediaData.mime)) {
            return (
              <video 
                className={styles.image}
                src={mediaData.src}
                autoPlay
                muted
                loop
                playsInline
                key={"video-" + timestamp}
                style={{ backgroundColor: 'transparent' }}
              />
            );
          } else {
            return (
              <img 
                className={styles.image}
                src={mediaData.src} 
                alt="Alert" 
                key={"image-" + timestamp}
              />
            );
          }
        })()}
        <div className={styles.text}>
          <p><HighlightedText text={currentAlert.headline} /></p>
          <p>{formatText(currentAlert.text, chatEmotes, currentAlert.channel)}</p>
        </div>
      </div>
    </div>
  );
}
