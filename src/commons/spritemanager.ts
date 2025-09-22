import { ExtractedImage, UserSpriteAssignment, Event } from './events';
// Update ZipCache interface to include sortedPrefixes
interface ZipCache {
  zipHash: string;
  images: ExtractedImage[];
  sortedPrefixes: number[];
  timestamp: number;
}
import { getUserSpriteAssignment, saveUserSpriteAssignment, completeReroll } from '@/api/sprites';
import JSZip from 'jszip';

// Cache for extracted zip files (LRU cache with max 10 entries)
const zipCache: ZipCache[] = [];
const MAX_CACHE_SIZE = 10;

/**
 * SpriteManager handles sprite selection, zip extraction, and user sprite assignments
 */
export class SpriteManager {
  private static instance: SpriteManager;

  private constructor() {}

  /**
   * Get the singleton instance of SpriteManager
   */
  public static getInstance(): SpriteManager {
    if (!SpriteManager.instance) {
      SpriteManager.instance = new SpriteManager();
    }
    return SpriteManager.instance;
  }

  /**
   * Check if a file is a supported image type
   */
  private isImageFile(filename: string): boolean {
    const lowerName = filename.toLowerCase();
    return lowerName.endsWith('.png') || 
           lowerName.endsWith('.jpg') || 
           lowerName.endsWith('.jpeg') || 
           lowerName.endsWith('.gif') || 
           lowerName.endsWith('.webp') || 
           lowerName.endsWith('.apng');
  }

  /**
   * Generate a simple hash from a string
   */
  private generateSimpleHash(input: string): number {
    let hash = 0;
    if (input.length === 0) return hash;
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash);
  }

  /**
   * Extract weight from filename (e.g., "48_whatever.jpg" => 48)
   */
  private extractWeightFromFilename(filename: string): number | null {
    const match = filename.match(/^(\d+)_/);
    if (match && match[1]) {
      const weight = parseInt(match[1], 10);
      return weight > 0 ? weight : null;
    }
    return null;
  }

  /**
   * Extract all numerical prefixes from images and return them sorted
   */
  private extractAllPrefixesFromImages(images: ExtractedImage[]): number[] {
    const prefixes = new Set<number>();
    
    images.forEach(image => {
      const prefix = this.extractWeightFromFilename(image.name);
      if (prefix !== null) {
        prefixes.add(prefix);
      }
    });
    
    return Array.from(prefixes).sort((a, b) => a - b);
  }

  /**
   * Get the rank of a prefix in the sorted list of all prefixes
   * Returns 0 for files without prefix, otherwise 1-based index
   */
  private getPrefixRank(filename: string, sortedPrefixes: number[]): number {
    const prefix = this.extractWeightFromFilename(filename);
    
    if (prefix === null) {
      return 0; // Files without prefix get rank 0
    }
    
    const index = sortedPrefixes.indexOf(prefix);
    return index + 1; // Convert to 1-based indexing
  }

  /**
   * Extract images from a zip file
   */
  public async extractImagesFromZip(zipData: string): Promise<ExtractedImage[]> {
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
        if (file.dir || !this.isImageFile(filename)) return;

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
  }

  /**
   * Create a deterministic shuffle using userHash as seed
   */
  private deterministicShuffle<T>(array: T[], seed: number): T[] {
    // Clone the array to avoid modifying the original
    const result = [...array];
    
    // Fisher-Yates shuffle algorithm with seeded random
    for (let i = result.length - 1; i > 0; i--) {
      // Simple LCG (Linear Congruential Generator) using the seed
      seed = (seed * 9301 + 49297) % 233280;
      const randomValue = seed / 233280;
      
      // Get random index based on seeded random value
      const j = Math.floor(randomValue * (i + 1));
      
      // Swap elements
      [result[i], result[j]] = [result[j], result[i]];
    }
    
    return result;
  }

  /**
   * Select an image with weighting based on filename prefixes
   */
  public selectImageWithWeighting(
    images: ExtractedImage[],
    userHash: number,
    mod?: number
  ): ExtractedImage {
    // Create a weighted pool of images
    const weightedPool: { image: ExtractedImage; weight: number }[] = [];
    
    // Process each image and determine its weight
    images.forEach(image => {
      const weight = this.extractWeightFromFilename(image.name);
      if (mod && (weight || 0) < mod) return;
      if (weight !== null) {
        // If filename has a weight prefix (e.g., "48_whatever.jpg"),
        // add it to the pool with 1/weight of normal chance
        weightedPool.push({ image, weight: 1 / weight });
      } else {
        // No prefix means normal weight (1.0)
        weightedPool.push({ image, weight: 1.0 });
      }
    });
    
    // Shuffle the weightedPool using a deterministic shuffle based on userHash
    // This ensures images with equal weights have equal chances regardless of order
    const shuffledPool = this.deterministicShuffle(weightedPool, userHash);
    
    // Calculate total weight
    const totalWeight = shuffledPool.reduce((sum, item) => sum + item.weight, 0);
    
    // Use the hash to select an image based on weighted probability
    let targetValue = (userHash % 1000) / 1000 * totalWeight;
    let cumulativeWeight = 0;
    
    for (const item of shuffledPool) {
      cumulativeWeight += item.weight;
      if (targetValue <= cumulativeWeight) {
        return item.image;
      }
    }
    
    // Fallback to the first image if something goes wrong
    return images[0];
  }

  /**
   * Handle reroll if pending
   */
  public async handleRerollIfPending(
    sortedImages: ExtractedImage[], 
    spriteAssignment: UserSpriteAssignment,
    channel: string,
    username: string
  ): Promise<ExtractedImage> {
    console.log(`Reroll pending for ${username} in ${channel}`);
    
    // Select a new image (different from current) using weighted selection
    const currentFilename = spriteAssignment.selectedFilename;
    const availableImages = sortedImages.filter(img => img.name !== currentFilename);
    
    let selectedImage: ExtractedImage;
    
    if (availableImages.length > 0) {
      // Use weighted selection for reroll too
      const userHash = this.generateSimpleHash(`${username}${channel}${Date.now()}`); // Add timestamp for different result
      selectedImage = this.selectImageWithWeighting(availableImages, userHash, spriteAssignment.mod);
      
      // Report back to server that reroll is complete
      // The backend will keep selectedFilename unchanged and set lastFilename to the new sprite
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
  }

  /**
   * Get sprite data for a user
   * Returns the selected image and additional metadata
   */
  public async getSpriteData(
    zipData: string,
    channel: string,
    username: string,
    useLast: boolean,
    userSeed?: string,
  ): Promise<{
    selectedImage: ExtractedImage;
    prefixClass: string;
    selectedFilename: string;
  } | null> {
    try {
      // Generate a hash for the zip file to use as cache key
      const zipHash = this.generateSimpleHash(zipData.substring(0, 1000)).toString();
      
      // Check if we have this zip in cache
      let cacheEntry = zipCache.find(entry => entry.zipHash === zipHash);
      
      // If not in cache or cache is empty, extract images and cache them
      if (!cacheEntry || cacheEntry.images.length === 0) {
        const extractedImages = await this.extractImagesFromZip(zipData);
        
        if (extractedImages.length === 0) {
          console.warn('No valid images found in zip file');
          return null;
        }
        
        // Create new cache entry with sorted prefixes
        cacheEntry = {
          zipHash,
          images: extractedImages,
          sortedPrefixes: this.extractAllPrefixesFromImages(extractedImages),
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
        selectedImage = await this.handleRerollIfPending(sortedImages, spriteAssignment, channel, username);
      }
      // Check if we should explicitly use lastFilename based on event flag
      else if (useLast && spriteAssignment?.lastFilename) {
        const foundImage = sortedImages.find(img => img.name === spriteAssignment.lastFilename);
        if (foundImage) {
          selectedImage = foundImage;
          console.log(`Using lastFilename "${spriteAssignment.lastFilename}" for ${username} in ${channel} (explicit flag)`);
        } else {
          // Fall back to selectedFilename if lastFilename not found
          console.log(`Last sprite "${spriteAssignment.lastFilename}" not found, falling back to selectedFilename`);
          
          // Use existing assignment if available
          if (spriteAssignment.selectedFilename) {
            const selectedFoundImage = sortedImages.find(img => img.name === spriteAssignment.selectedFilename);
            if (selectedFoundImage) {
              selectedImage = selectedFoundImage;
            } else {
              // If assigned image no longer exists, use the first image for display
              console.log(`Selected sprite "${spriteAssignment.selectedFilename}" not found in current sprite pack for ${username} in ${channel}. Using fallback for display only.`);
              selectedImage = sortedImages[0]; // Use first image as fallback for display
              
              // Important: Override the display image's name with the user's actual selection
              selectedImage = {
                ...selectedImage,
                name: spriteAssignment.selectedFilename // Preserve the original filename
              };
            }
          } else {
            // No valid selectedFilename either, use first image
            selectedImage = sortedImages[0];
          }
        }
      }
      // Use existing assignment if available
      else if (spriteAssignment?.selectedFilename) {
        const foundImage = sortedImages.find(img => img.name === spriteAssignment.selectedFilename);
        if (foundImage) {
          selectedImage = foundImage;
        } else {
          // If assigned image no longer exists, use the first image for display
          // but keep the user's selected filename in the database
          console.log(`Selected sprite "${spriteAssignment.selectedFilename}" not found in current sprite pack for ${username} in ${channel}. Using fallback for display only.`);
          selectedImage = sortedImages[0]; // Use first image as fallback for display
          
          // Important: Override the display image's name with the user's actual selection
          // This ensures we don't lose their selection when the sprite pack changes
          selectedImage = {
            ...selectedImage,
            name: spriteAssignment.selectedFilename // Preserve the original filename
          };
          
          // Don't set newAssignment = true, as we want to keep their existing selection
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
        const userHash = this.generateSimpleHash(`${username}${channel}`);
        
        // Apply weighted selection based on filename prefixes
        selectedImage = this.selectImageWithWeighting(sortedImages, userHash);
        newAssignment = true;
      }
      
      // Save new assignment if needed
      if (newAssignment) {
        await saveUserSpriteAssignment(channel, username, selectedImage.name)
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
      
      // Get the rank of the prefix for the selected image
      const prefixRank = this.getPrefixRank(selectedImage.name, cacheEntry.sortedPrefixes);
      const prefixClass = `prefix-${prefixRank}`;
      
      return {
        selectedImage,
        prefixClass,
        selectedFilename: selectedImage.name
      };
    } catch (err) {
      console.error('Error processing sprites:', err);
      return null;
    }
  }
}

// Export singleton instance
export const spriteManager = SpriteManager.getInstance();
