import { useEffect, useState, useContext } from 'react';
import styles from './VisualAlertPlayer.module.css';
import { VisualAlert, ExtractedImage, ZipCache, Event, UserSpriteAssignment } from '@/commons/events';
import { AlertSystem } from '../alerts/alertplayer';
import { ChatEmotesContext } from '@/ApplicationContext';
import PubSub from 'pubsub-js';
import { ChatEmotes } from '@/commons/emotes';
import { joinWithSpace } from '../../commons/helper';
import { EmoteComponentSimple } from '../emote/emote';
import JSZip from 'jszip';
import { getUserSpriteAssignment, saveUserSpriteAssignment, completeReroll } from '@/api/sprites';

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

// Cache for extracted zip files (LRU cache with max 10 entries)
const zipCache: ZipCache[] = [];
const MAX_CACHE_SIZE = 10;

// These functions will be implemented by the backend
// For now, we'll use the userSeed directly for deterministic selection

// Check if a file is a supported image type
const isImageFile = (filename: string): boolean => {
  const lowerName = filename.toLowerCase();
  return lowerName.endsWith('.png') || 
         lowerName.endsWith('.jpg') || 
         lowerName.endsWith('.jpeg') || 
         lowerName.endsWith('.gif') || 
         lowerName.endsWith('.webp') || 
         lowerName.endsWith('.apng');
};

// Generate a simple hash from a string
const generateSimpleHash = (input: string): number => {
  let hash = 0;
  if (input.length === 0) return hash;
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash);
};

// Extract weight from filename (e.g., "48_whatever.jpg" => 48)
const extractWeightFromFilename = (filename: string): number | null => {
  const match = filename.match(/^(\d+)_/);
  if (match && match[1]) {
    const weight = parseInt(match[1], 10);
    return weight > 0 ? weight : null;
  }
  return null;
};

// Extract images from a zip file
const extractImagesFromZip = async (zipData: string): Promise<ExtractedImage[]> => {
  try {
    // Convert base64 to array buffer
    const binaryString = atob(zipData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Load zip file
    const zip = await JSZip.loadAsync(bytes.buffer);
    const images: ExtractedImage[] = [];
    
    // Process each file in the zip
    const promises = Object.keys(zip.files).map(async (filename) => {
      const file = zip.files[filename];
      
      // Skip directories and non-image files
      if (file.dir || !isImageFile(filename)) return;

      if (filename.includes("__MACOSX/")) return;
      
      try {
        // Get file as array buffer
        const content = await file.async('arraybuffer');
        
        // Determine mime type based on extension
        let mime = 'image/png'; // Default
        const lowerName = filename.toLowerCase();
        if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
          mime = 'image/jpeg';
        } else if (lowerName.endsWith('.gif')) {
          mime = 'image/gif';
        } else if (lowerName.endsWith('.webp')) {
          mime = 'image/webp';
        } else if (lowerName.endsWith('.apng')) {
          mime = 'image/apng';
        }
        
        // Convert to base64 data URL
        const base64 = btoa(
          new Uint8Array(content)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        
        images.push({
          name: filename,
          data: base64,
          mime
        });
      } catch (err) {
        console.error(`Error processing file ${filename} in zip:`, err);
      }
    });
    
    await Promise.all(promises);
    return images;
  } catch (err) {
    console.error('Error extracting images from zip:', err);
    return [];
  }
};

export default function VisualAlertPlayer() {
  const [currentAlert, setCurrentAlert] = useState<VisualAlert | null>(null);
  const chatEmotes = useContext(ChatEmotesContext);
  const [isVisible, setIsVisible] = useState(false);
  const [timestamp, setTimestamp] = useState(0);
  const [mediaData, setMediaData] = useState<{ src: string; type: string; mime: string; prefixClass?: string; } | null>(null);

  // Handle reroll if pending
const handleRerollIfPending = (
  sortedImages: ExtractedImage[], 
  spriteAssignment: UserSpriteAssignment,
  channel: string,
  username: string
): ExtractedImage => {
  console.log(`Reroll pending for ${username} in ${channel}`);
  
  // Select a new image (different from current) using weighted selection
  const currentFilename = spriteAssignment.selectedFilename;
  const availableImages = sortedImages.filter(img => img.name !== currentFilename);
  
  let selectedImage: ExtractedImage;
  
  if (availableImages.length > 0) {
    // Use weighted selection for reroll too
    const userHash = generateSimpleHash(`${username}${channel}${Date.now()}`); // Add timestamp for different result
    selectedImage = selectImageWithWeighting(availableImages, userHash);
    
    // Report back to server that reroll is complete
    completeReroll(channel, username, selectedImage.name)
      .then(success => {
        if (success) {
          console.log(`Reroll completed for ${username} in ${channel}`);
        } else {
          console.error(`Failed to complete reroll for ${username} in ${channel}`);
        }
      })
      .catch(error => {
        console.error('Error completing reroll:', error);
      });
  } else {
    // If no other images available, keep current
    const foundImage = sortedImages.find(img => img.name === currentFilename);
    selectedImage = foundImage || sortedImages[0];
  }
  
  return selectedImage;
};

// Select an image with weighting based on filename prefixes
const selectImageWithWeighting = (
  images: ExtractedImage[],
  userHash: number
): ExtractedImage => {
  // Create a weighted pool of images
  const weightedPool: { image: ExtractedImage; weight: number }[] = [];
  
  // Process each image and determine its weight
  images.forEach(image => {
    const weight = extractWeightFromFilename(image.name);
    
    if (weight !== null) {
      // If filename has a weight prefix (e.g., "48_whatever.jpg"),
      // add it to the pool with 1/weight of normal chance
      weightedPool.push({ image, weight: 1 / weight });
    } else {
      // No prefix means normal weight (1.0)
      weightedPool.push({ image, weight: 1.0 });
    }
  });
  
  // Calculate total weight
  const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
  
  // Use the hash to select an image based on weighted probability
  let targetValue = (userHash % 1000) / 1000 * totalWeight;
  let cumulativeWeight = 0;
  
  for (const item of weightedPool) {
    cumulativeWeight += item.weight;
    if (targetValue <= cumulativeWeight) {
      return item.image;
    }
  }
  
  // Fallback to the first image if something goes wrong
  return images[0];
};

const getMediaData = async (ref: string, channel: string, username?: string, userSeed?: string) => {
    if (!AlertSystem.alertConfig?.[channel]?.data?.files?.[ref] || !username) {
      return null;
    }
    
    const file = AlertSystem.alertConfig[channel].data.files[ref];
    
    // Check if file is a zip file
    if (file.mime === 'application/zip') {
      try {
        // Generate a hash for the zip file to use as cache key
        const zipHash = generateSimpleHash(file.data.substring(0, 1000)).toString();
        
        // Check if we have this zip in cache
        let cacheEntry = zipCache.find(entry => entry.zipHash === zipHash);
        
        // If not in cache or cache is empty, extract images and cache them
        if (!cacheEntry || cacheEntry.images.length === 0) {
          const extractedImages = await extractImagesFromZip(file.data);
          
          if (extractedImages.length === 0) {
            console.warn('No valid images found in zip file');
            return null;
          }
          
          // Create new cache entry
          cacheEntry = {
            zipHash,
            images: extractedImages,
            timestamp: Date.now()
          };
          
          // Add to cache (remove oldest entry if cache is full)
          if (zipCache.length >= MAX_CACHE_SIZE) {
            zipCache.sort((a, b) => a.timestamp - b.timestamp);
            zipCache.shift(); // Remove oldest entry
          }
          
          zipCache.push(cacheEntry);
        } else {
          // Update timestamp for LRU cache
          cacheEntry.timestamp = Date.now();
        }
        
        // Sort images by filename for consistent ordering
        const sortedImages = [...cacheEntry.images].sort((a, b) => a.name.localeCompare(b.name));
        
        // Check if user has a sprite assignment or reroll pending
        let spriteAssignment: UserSpriteAssignment | null = null;
        try {
          spriteAssignment = await getUserSpriteAssignment(channel, username);
        } catch (error) {
          console.error('Error fetching sprite assignment:', error);
        }
        
        let selectedImage: ExtractedImage;
        let newAssignment = false;
        
        // Handle reroll if pending
        if (spriteAssignment?.rerollPending) {
          selectedImage = handleRerollIfPending(sortedImages, spriteAssignment, channel, username);
        }
        // Use existing assignment if available
        else if (spriteAssignment?.selectedFilename) {
          const foundImage = sortedImages.find(img => img.name === spriteAssignment.selectedFilename);
          if (foundImage) {
            selectedImage = foundImage;
          } else {
            // If assigned image no longer exists, select new one using weighted selection
            const userHash = generateSimpleHash(`${username}${channel}`);
            selectedImage = selectImageWithWeighting(sortedImages, userHash);
            newAssignment = true;
          }
        }
        // If userSeed is a filename that exists in the zip, use that image directly
        else if (userSeed && sortedImages.some(img => img.name === userSeed)) {
          const foundImage = sortedImages.find(img => img.name === userSeed);
          selectedImage = foundImage || sortedImages[0]; // Fallback to first image if not found
          newAssignment = true;
        }
        // Otherwise, select based on hash with filename-based weighting
        else {
          // Generate deterministic hash from username and channel
          const userHash = generateSimpleHash(`${username}${channel}`);
          
          // Apply weighted selection based on filename prefixes
          selectedImage = selectImageWithWeighting(sortedImages, userHash);
          newAssignment = true;
        }
        
        // Save new assignment if needed
        if (newAssignment) {
          saveUserSpriteAssignment(channel, username, selectedImage.name)
            .then(success => {
              if (success) {
                console.log(`Saved sprite assignment for ${username} in ${channel}: ${selectedImage.name}`);
              } else {
                console.error(`Failed to save sprite assignment for ${username} in ${channel}`);
              }
            })
            .catch(error => {
              console.error('Error saving sprite assignment:', error);
            });
        }
        
        // Extract number prefix if it exists for glow effect
        const prefixMatch = selectedImage.name.match(/^(\d+)_/);
        const prefixClass = prefixMatch ? `prefix-${prefixMatch[1]}` : '';
        
        return {
          src: `data:${selectedImage.mime};base64,${selectedImage.data}`,
          type: 'image',
          mime: selectedImage.mime,
          prefixClass: prefixClass
        };
      } catch (err) {
        console.error('Error processing zip file:', err);
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
        // Get the event data from AlertSystem to access username and userSeed
        const eventData = AlertSystem.currentlyPlaying || {} as Event;
        const username = eventData.username || '';
        const userSeed = eventData.userSeed || '';
        
        // If the event has rerollPending flag, trigger a reroll on the server
        if (eventData.rerollPending && username) {
          try {
            // This is a fallback in case the server didn't set the reroll flag
            // It ensures the reroll will be processed when we fetch the sprite assignment
            await completeReroll(currentAlert.channel, username, '');
            console.log(`Triggered reroll for ${username} from event data`);
          } catch (error) {
            console.error('Error triggering reroll from event:', error);
          }
        }
        
        const data = await getMediaData(currentAlert.image, currentAlert.channel, username, userSeed);
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
            // Use the prefixClass that was determined in getMediaData
            const prefixClass = mediaData.prefixClass || '';
            
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
