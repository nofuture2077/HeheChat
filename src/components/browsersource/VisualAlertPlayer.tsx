import { useEffect, useState, useContext } from 'react';
import styles from './VisualAlertPlayer.module.css';
import { VisualAlert, Event } from '@/commons/events';
import { AlertSystem } from '../alerts/alertplayer';
import { ChatEmotesContext } from '@/ApplicationContext';
import PubSub from 'pubsub-js';
import { ChatEmotes } from '@/commons/emotes';
import { joinWithSpace } from '../../commons/helper';
import { EmoteComponentSimple } from '../emote/emote';
import { spriteManager } from '@/commons/spritemanager';

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
  const [mediaData, setMediaData] = useState<{ 
    src: string; 
    type: string; 
    mime: string; 
    prefixClass?: string;
    selectedFilename?: string;
  } | null>(null);

  const getMediaData = async (ref: string, channel: string, event?: Event) => {
    if (!AlertSystem.alertConfig?.[channel]?.data?.files?.[ref]) {
      return null;
    }
    
    const file = AlertSystem.alertConfig[channel].data.files[ref];
    
    // Check if file is a zip file and we have a pre-selected sprite filename
    if (file.mime === 'application/zip' && event?.selectedSpriteFilename) {
      try {
        // Use the SpriteManager's getSpriteData method which already handles caching
        // This avoids unzipping the same data repeatedly
        const spriteData = await spriteManager.getSpriteData(
          file.data,
          channel,
          event.username,
          event.userSeed
        );
        
        if (!spriteData) {
          console.error('Failed to get sprite data');
          return null;
        }
        
        // Return the image data
        return {
          src: `data:${spriteData.selectedImage.mime};base64,${spriteData.selectedImage.data}`,
          type: 'image',
          mime: spriteData.selectedImage.mime,
          prefixClass: spriteData.prefixClass,
          selectedFilename: spriteData.selectedFilename
        };
      } catch (err) {
        console.error('Error processing sprite data:', err);
        return null;
      }
    }
    
    // Not a zip file, return as before
    return {
      src: `data:${file.mime};base64,${file.data}`,
      type: file.type,
      mime: file.mime,
      prefixClass: '' // No prefix class for non-zip files
    };
  };

  const isVideoMimeType = (mime: string) => {
    return mime.startsWith('video/') || mime === 'video/webm' || mime === 'video/mp4' || mime === 'video/ogg';
  };

  // Load media data when currentAlert changes
  useEffect(() => {
    const loadMediaData = async () => {
      if (currentAlert?.image) {
        // Get the event data from AlertSystem
        const eventData = AlertSystem.currentlyPlaying || {} as Event;
        
        // Use the pre-selected sprite data from AlertSystem
        const data = await getMediaData(currentAlert.image, currentAlert.channel, eventData);
        setMediaData(data);
      } else {
        setMediaData(null);
      }
    };
    
    loadMediaData();
  }, [currentAlert]);

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
        setMediaData(null);
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
      setMediaData(null);
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
        {currentAlert.image && mediaData && (() => {
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
            // Extract prefix class from filename for styling (e.g., "48_whatever.jpg" => "prefix-48")
            const prefixClass = mediaData.selectedFilename ? mediaData.prefixClass || '' : '';
            
            return (
              <img 
                className={`${styles.image} ${prefixClass ? styles[prefixClass] : ''}`}
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
