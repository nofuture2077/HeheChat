import { Event, EventAlertConfig, Base64FileReference, Base64File, EventAlert, EventMainType, EventTypeMapping, VisualAlert } from "@/commons/events";
import { spriteManager } from "@/commons/spritemanager";

import { Config } from "@/commons/config";
import { Profile } from "@/commons/profile";
import { formatString, deterministicSample } from "@/commons/helper";
import { silence } from "./silence";
import PubSub from 'pubsub-js';
import { AlertConfig } from "@/components/events/alertconfigstorage";
import { formatEventText } from "@/components/events/eventlist";
import { DEFAULT_CHAT_EMOTES } from "@/commons/emotes";
import { ParsedMessagePart } from "@/commons/message";
import { buildEmoteImageUrl } from '../../commons/twitch';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

interface AudioInfo {
    duration: number;
    audioBuffer?: AudioBuffer;
    audioUrl?: string;
    videoElement?: HTMLVideoElement;
}

let cheerPrefixes = ['Cheer', 'BibleThump', 'cheerwhal', 'Corgo', 'uni', 'ShowLove', 'Party', 'SeemsGood', 'Pride', 'Kappa', 'FrankerZ', 'HeyGuys', 'DansGame', 'EleGiggle', 'TriHard', 'Kreygasm', '4Head', 'SwiftRage', 'NotLikeThis', 'FailFish', 'VoHiYo', 'PJSalt', 'MrDestructoid', 'bday', 'RIPCheer', 'Shamrock'];
let cheerPrefixesRegExp = cheerPrefixes.map(x => new RegExp(`\\b${x}\\d+\\b`, "gi"))

class AlertPlayer {
    audioContext?: AudioContext;
    mainAudioGain?: GainNode;
    currentSource?: AudioBufferSourceNode | MediaElementAudioSourceNode;
    playing: boolean = false;
    paused: boolean = false;
    muted: boolean = false;
    queue: Event[] = [];
    index: number = 0;
    alertConfig: Record<string, EventAlertConfig> = {};
    preventBoxDisconnect?: (() => void) & _.Cancelable;
    config?: Config;
    profile?: Profile;
    currentlyPlaying?: Event;
    skipCurrent: boolean = false;
    mode?: 'app' | 'browsersource';
    queueCheckInterval?: number;
    isDestroyed: boolean = false;

    constructor() {
        // Use a safer approach for the queue check interval with the async function
        this.queueCheckInterval = setInterval(() => {
            // Only start a new check if we're not already playing something
            if (!this.playing) {
                this.checkQueue().catch(err => {
                    console.error("Error in queue check:", err);
                    this.playing = false; // Reset flag in case of error
                });
            }
        }, 1000) as unknown as number;
        
        setInterval(() => this.playSilenceIfQueueEmpty(), 120000);
        this.mode = (localStorage.getItem('hehe-mode') as 'app' | 'browsersource') || undefined;
        
        // Handle page unload to cleanup resources
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => this.destroy());
            window.addEventListener('pagehide', () => this.destroy());
        }
    }

    destroy() {
        this.isDestroyed = true;
        
        // Clear intervals
        if (this.queueCheckInterval) {
            clearInterval(this.queueCheckInterval);
            this.queueCheckInterval = undefined;
        }
        
        // Stop any playing audio
        this.stopPlaying();
        
        // Close audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close().catch(err => {
                console.log('Error closing audio context:', err);
            });
        }
        
        // Clear queue
        this.queue = [];
        this.index = 0;
        
        console.log('AlertPlayer destroyed');
    }

    status(): boolean {
        return this.audioContext !== undefined && this.audioContext.state === 'running';
    }

    interrupted(): boolean {
        //@ts-ignore
        return this.audioContext !== undefined && this.audioContext.state === 'interrupted';
    }

    initialize() {
        console.log('Alert system initialized');
        this.audioContext = new (window.AudioContext)();
        this.mainAudioGain = this.audioContext.createGain();
        this.mainAudioGain.gain.value = 0;
        this.mainAudioGain.connect(this.audioContext.destination);
        
        // Set media session metadata for album cover and artist info
        if ('mediaSession' in navigator) {
            this.updateMediaSessionMetadata();
        }
    }

    updateMediaSessionMetadata() {
        if (!('mediaSession' in navigator)) return;
        
        const profileName = this.profile?.name || 'HeheChat';
        
        navigator.mediaSession.metadata = new MediaMetadata({
            title: 'Alert Sound',
            artist: profileName,
            album: profileName,
            artwork: [
                { src: '/logo.png', sizes: '512x512', type: 'image/png' }
            ]
        });
    }

    async googleTTS(msg: string, channel: string, voice: string, state: string, sink: string): Promise<string> {
        const params = new URLSearchParams({
            text: encodeURIComponent(msg),
            state,
            sink,
            voice,
            channel
        });
        const response = await fetch(`${BASE_URL}/tts/generate?${params}`);
        const data = await response.json();
        return data.audioContent;
    }

    async aiTTS(msg: string, channel: string, voice: string, state: string, sink: string): Promise<string> {
        const params = new URLSearchParams({
            text: encodeURIComponent(msg),
            state,
            sink,
            voice,
            channel
        });
        const response = await fetch(`${BASE_URL}/tts/ai/generate?${params}`);
        const data = await response.json();
        return data.audioContent;
    }

    private preciseTimer(callback: () => void, delay: number) {
        const audioBuffer = this.audioContext!.createBuffer(1, this.audioContext!.sampleRate * delay / 1000, this.audioContext!.sampleRate);
        const source = this.audioContext!.createBufferSource();
        source.buffer = audioBuffer;
    
        source.onended = callback;
        source.connect(this.audioContext!.destination);
        source.start();
    }

    async playAudio(volume: number, audioInfo: AudioInfo | undefined, extra: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!audioInfo || this.skipCurrent || !this.audioContext) {
                resolve();
                return;
            }
            
            const { duration, audioBuffer, audioUrl, videoElement } = audioInfo;
            
            // Clean up any existing audio source
            this.cleanupCurrentSource();
            
            // Create a new gain node for this specific audio
            const gainNode = this.audioContext.createGain();
            // Apply the alert boost from config if available
            const boostFactor = this.config?.alertBoost || 1.0;
            gainNode.gain.value = this.muted ? 0 : (volume * boostFactor);
            gainNode.connect(this.audioContext.destination);
            
            // Setup error handling for unexpected interruptions
            const handleInterruption = () => {
                console.log("Audio playback interrupted");
                this.cleanupCurrentSource();
                this.playing = false; // Reset playing state
                resolve(); // Resolve the promise to allow queue to continue
            };
            
            // Handle video element as audio source
            if (videoElement) {
                try {
                    const source = this.audioContext.createMediaElementSource(videoElement);
                    source.connect(gainNode);
                    
                    this.currentSource = source;
                    
                    // Handle normal completion
                    videoElement.onended = () => {
                        this.cleanupCurrentSource();
                        setTimeout(() => resolve(), extra);
                    };
                    
                    // Handle errors
                    videoElement.onerror = () => {
                        console.error("Error playing video audio");
                        handleInterruption();
                    };
                    
                    videoElement.play();
                    
                    // Update media session metadata
                    if ('mediaSession' in navigator) {
                        this.updateMediaSessionMetadata();
                    }
                } catch (err) {
                    console.error("Error starting video audio playback:", err);
                    handleInterruption();
                }
            } else if (audioBuffer) {
                try {
                    // Play from decoded buffer
                    const source = this.audioContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(gainNode);
                    
                    this.currentSource = source;
                    
                    // Handle normal completion
                    source.onended = () => {
                        this.cleanupCurrentSource();
                        setTimeout(() => resolve(), extra);
                    };
                    
                    // AudioBufferSourceNode doesn't have onerror event
                    // We'll rely on try-catch for error handling
                    
                    source.start();
                    
                    // Update media session metadata when playing new audio
                    if ('mediaSession' in navigator) {
                        this.updateMediaSessionMetadata();
                    }
                } catch (err) {
                    console.error("Error starting audio playback:", err);
                    handleInterruption();
                }
            } else if (audioUrl) {
                // Fetch and decode the audio if we only have a URL
                fetch(audioUrl)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.arrayBuffer();
                    })
                    .then(arrayBuffer => this.audioContext!.decodeAudioData(arrayBuffer))
                    .then(decodedData => {
                        if (this.skipCurrent) {
                            resolve();
                            return;
                        }
                        
                        try {
                            const source = this.audioContext!.createBufferSource();
                            source.buffer = decodedData;
                            source.connect(gainNode);
                            
                            this.currentSource = source;
                            
                            // Handle normal completion
                            source.onended = () => {
                                this.cleanupCurrentSource();
                                setTimeout(() => resolve(), extra);
                            };
                            
                            // AudioBufferSourceNode doesn't have onerror event
                            // We'll rely on try-catch for error handling
                            
                            source.start();
                            
                            // Update media session metadata
                            if ('mediaSession' in navigator) {
                                this.updateMediaSessionMetadata();
                            }
                        } catch (err) {
                            console.error("Error starting audio playback:", err);
                            handleInterruption();
                        }
                    })
                    .catch(err => {
                        console.error("Error fetching or decoding audio:", err);
                        handleInterruption();
                    });
            } else {
                resolve(); // No audio to play
            }
        });
    }

    private isVideoFile(src: string): boolean {
        return src.includes('video/webm') || src.includes('video/mp4') || 
               src.includes('video/ogg') || src.includes('data:video/');
    }

    async getAudioInfo(src: string): Promise<AudioInfo | undefined> {
        return new Promise((resolve, reject) => {
            if (!src || !this.audioContext) {
                resolve(undefined);
                return;
            }
            
            // Handle video files
            if (this.isVideoFile(src)) {
                const video = document.createElement('video');
                video.src = src;
                video.preload = 'metadata';
                
                video.onloadedmetadata = () => {
                    resolve({
                        duration: video.duration,
                        videoElement: video
                    });
                };
                
                video.onerror = (err) => {
                    console.error("Error loading video metadata:", err);
                    reject(err);
                };
                
                return;
            }
            
            // For data URLs, decode directly
            if (src.startsWith('data:')) {
                // Convert base64 to array buffer
                const base64 = src.split(',')[1];
                const binaryString = atob(base64);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                // Decode the audio data
                this.audioContext.decodeAudioData(bytes.buffer)
                    .then(buffer => {
                        resolve({
                            duration: buffer.duration,
                            audioBuffer: buffer
                        });
                    })
                    .catch(err => {
                        console.error("Error decoding audio data:", err);
                        reject(err);
                    });
            } else {
                // For remote URLs, just store the URL and duration will be determined when fetched
                // This avoids CORS issues with remote audio files
                resolve({
                    duration: 0, // Will be updated when actually played
                    audioUrl: src
                });
            }
        });
    }

    pause() {
        this.paused = true;
        this.audioContext?.suspend();
    }

    resume() {
        this.paused = false;
        this.audioContext?.resume();
        
        // If we have a current source, ensure it continues playing
        if (this.currentSource && this.playing) {
            // Publish an update to refresh the UI
            PubSub.publish('AlertPlayer-update', {
                text: this.currentlyPlaying ? 
                    this.currentlyPlaying.username + " - " + formatEventText(this.currentlyPlaying) : 
                    'Playing'
            });
        }
    }

    mute() {
        this.muted = true;
        if (this.mainAudioGain) this.mainAudioGain.gain.value = 0;
        if (this.currentSource) {
            const gainNode = this.audioContext!.createGain();
            gainNode.gain.value = 0;
            this.currentSource.disconnect();
            this.currentSource.connect(gainNode);
            gainNode.connect(this.audioContext!.destination);
        }
    }

    unmute() {
        this.muted = false;
        if (this.mainAudioGain) this.mainAudioGain.gain.value = 1;
        
        // If there's a current source playing, reconnect it with proper gain
        if (this.currentSource && this.playing) {
            // Create a new gain node with proper volume
            const gainNode = this.audioContext!.createGain();
            // Apply the alert boost from config if available
            const boostFactor = this.config?.alertBoost || 1.0;
            gainNode.gain.value = boostFactor; // Apply volume boost
            
            // Disconnect from any existing connections and reconnect
            this.currentSource.disconnect();
            this.currentSource.connect(gainNode);
            gainNode.connect(this.audioContext!.destination);
            
            // Update UI to reflect unmuted state
            PubSub.publish('AlertPlayer-update');
        }
    }

    startPlaying() {
        this.skipCurrent = false;
        this.playing = true;
        if (this.mainAudioGain) {
            // Apply the alert boost from config if available
            const boostFactor = this.config?.alertBoost || 1.0;
            this.mainAudioGain.gain.value = boostFactor;
        }
    }

    // Helper method to safely clean up the current audio source
    private cleanupCurrentSource() {
        if (this.currentSource) {
            try {
                // For AudioBufferSourceNode
                if ('stop' in this.currentSource) {
                    this.currentSource.onended = null; // Remove event listener
                    this.currentSource.stop();
                }
                this.currentSource.disconnect();
            } catch (e) {
                // Ignore errors if source was already stopped
                console.log("Error cleaning up audio source:", e);
            }
            this.currentSource = undefined;
        }
    }

    // Handle audio context interruption with resume and fallback reinitialization
    private handleAudioInterruption(): void {
        console.log("Audio context interrupted, attempting to resume");
        this.stopPlaying();
        
        // Try to resume the audio context
        this.audioContext?.resume().then(() => {
            console.log("Audio context resumed successfully");
            PubSub.publish('AlertPlayer-update');
        }).catch(err => {
            console.error("Failed to resume audio context, reinitializing:", err);
            // If resume fails, create a new audio context
            try {
                this.initialize();
                console.log("Audio context reinitialized successfully");
                PubSub.publish('AlertPlayer-update');
            } catch (initErr) {
                console.error("Failed to reinitialize audio context:", initErr);
                PubSub.publish('AlertPlayer-update');
            }
        });
    }

    stopPlaying() {
        this.playing = false;
        this.paused = false;
        this.skipCurrent = false; // Reset skip flag
        this.cleanupCurrentSource();
        if (this.mainAudioGain) this.mainAudioGain.gain.value = 0;
    }

    endAudio() {
        this.cleanupCurrentSource();
        return Promise.resolve();
    }

    skip() {
        this.skipCurrent = true;
        this.cleanupCurrentSource();
        if (this.mainAudioGain) this.mainAudioGain.gain.value = 0;
        
        // Reset playing state to allow the queue to continue
        this.playing = false;
        
        // Update UI to reflect skipped state
        PubSub.publish('AlertPlayer-update', {
            text: 'Skipped'
        });
    }

    /**
     * Apply TTS replacements from the alert configuration
     * Supports word-based, case-insensitive matching with wildcard support
     */
    applyTTSReplacements(message: string, channel: string): string {
        const alertConfig = this.alertConfig[channel];
        const replacements = alertConfig?.data?.config?.ttsReplacements;
        
        if (!replacements || Object.keys(replacements).length === 0) {
            return message;
        }
        
        let processedMessage = message;
        
        // Process each replacement rule
        Object.entries(replacements).forEach(([searchPattern, replacement]) => {
            if (!searchPattern || replacement === undefined) return;
            
            // Check if the pattern consists only of special characters
            const isSpecialCharsOnly = /^[^\w\s]+$/.test(searchPattern);
            
            // Handle wildcard patterns
            if (searchPattern.includes('*')) {
                // Convert wildcard pattern to regex
                // Escape special regex characters except *
                const escapedPattern = searchPattern
                    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
                    .replace(/\*/g, '\\w*');
                
                // Create appropriate regex for matching
                // Don't use word boundaries for patterns that are only special characters
                const regexPattern = isSpecialCharsOnly 
                    ? escapedPattern 
                    : `\\b${escapedPattern}\\b`;
                    
                const regex = new RegExp(regexPattern, 'gi');
                processedMessage = processedMessage.replace(regex, replacement);
            } else {
                // Simple replacement (case-insensitive)
                // Don't use word boundaries for patterns that are only special characters
                const escapedPattern = searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                
                let regex;
                if (isSpecialCharsOnly) {
                    // For special characters like "^^", match them anywhere
                    regex = new RegExp(escapedPattern, 'gi');
                } else {
                    // For normal words, use word boundaries
                    regex = new RegExp(`\\b${escapedPattern}\\b`, 'gi');
                }
                
                processedMessage = processedMessage.replace(regex, replacement);
            }
        });
        
        return processedMessage;
    }

    cleanMessage(message: string, filterTTS: boolean, channel?: string) {
        // First clean cheer prefixes
        var cleanedMessage = cheerPrefixesRegExp.reduce(
            (accumulator, prefix) => accumulator.replaceAll(prefix, ""),
            message
        );
        // Then remove URLs
        cleanedMessage = cleanedMessage.replace(/https?:\/\/[^\s]+/g, "");

        // Apply TTS replacements if channel is provided
        if (channel && filterTTS) {
            cleanedMessage = this.applyTTSReplacements(cleanedMessage, channel);
        }

        // Replace multiple consecutive symbols with single instances
        // This array can be easily expanded with other symbols that cause TTS issues
        const symbolsToClean = [
            { symbol: '.', regex: /\.{2,}/g },     // Multiple dots (..)
            { symbol: '!', regex: /!{2,}/g },     // Multiple exclamation marks (!!!)
            { symbol: '?', regex: /\?{2,}/g },    // Multiple question marks (???)
            { symbol: ',', regex: /,{2,}/g },     // Multiple commas (,,,)
            { symbol: ';', regex: /;{2,}/g },     // Multiple semicolons (;;;)
            { symbol: ':', regex: /:{2,}/g },     // Multiple colons (:::)
            { symbol: '-', regex: /-{2,}/g },     // Multiple dashes (---)
            { symbol: '_', regex: /_{2,}/g },     // Multiple underscores (___)
        ];

        // Apply symbol cleaning
        symbolsToClean.forEach(({ symbol, regex }) => {
            cleanedMessage = cleanedMessage.replace(regex, symbol);
        });

        // Remove emotes if any of the skip emote flags are enabled
        if (filterTTS && (this.config?.skipEmotesInTTS || this.config?.skip7TVEmotesInTTS || this.config?.skipGlobalEmotesInTTS)) {
            // Get all channels
            const channels = this.config.channels || [];
            
            // Split message into words
            const words = cleanedMessage.split(/\s+/);
            
            // Filter out words that are emotes
            const filteredWords = words.filter(word => {
                // Skip empty words
                if (!word.trim()) return true;
                
                // Check if word is an emote in any channel
                for (const channel of channels) {
                    if (!DEFAULT_CHAT_EMOTES.emotes.has(channel)) continue;
                    
                    const channelEmotes = DEFAULT_CHAT_EMOTES.emotes.get(channel);
                    
                    // Check channel emotes (if skipEmotesInTTS is enabled)
                    if (this.config?.skipEmotesInTTS && channelEmotes?.channelEmotes?.get(word)) return false;
                    
                    // Check 7TV emotes (if skip7TVEmotesInTTS is enabled)
                    if (this.config?.skip7TVEmotesInTTS && channelEmotes?.sevenTVEmotes?.get(word)) return false;
                }
                
                // Check global emotes (if skipGlobalEmotesInTTS is enabled)
                if (this.config?.skipGlobalEmotesInTTS && DEFAULT_CHAT_EMOTES.emotes.has('global')) {
                    const globalEmotes = DEFAULT_CHAT_EMOTES.emotes.get('global');
                    if (globalEmotes?.channelEmotes?.get(word)) return false;
                }
                
                // Not an emote (or emote filtering not enabled for this type), keep the word
                return true;
            });
            
            // Join filtered words back into a string
            cleanedMessage = filteredWords.join(' ');
        }
        
        return cleanedMessage;
    }

    getAudioFileData(reference: Base64FileReference, alertConfig: EventAlertConfig) {
        const file = alertConfig?.data?.files[reference] as unknown as Base64File;
        if (file && file.data) {
            return 'data:audio/mp3;base64,' + file.data;
        }
        return "";
    }

    async addNewChannels(channels: string[]) {
        const newChannels: string[] = [];
        (channels || []).forEach(channel => {
            if (!this.alertConfig[channel]) {
                newChannels.push(channel);
            }
        });
        if (!newChannels.length) {
            return;
        }
        await this.loadAlertConfig(newChannels);
    }

    async loadAlertConfig(channels: string[]) {
        try {
            for (const channel of channels) {
                const config = await AlertConfig?.getConfig(channel);
                if (config) {
                    this.alertConfig[channel] = config;
                }
            }
        } catch (error) {
            console.error('Error loading alert config:', error);
        }
    }

    updateProfile(profile: Profile) {
        this.profile = profile;
        const config = profile.config;
        this.config = config;
        
        // Update media session metadata when profile changes
        if ('mediaSession' in navigator) {
            this.updateMediaSessionMetadata();
        }
    }

    async tts(ttsMessage: string, channel: string, voice: string, voiceType: string, state: string, sink: string) {
        // Skip if explicitly disabled
        if (voiceType === "none") return;

        // Resolve which voice to use
        let resolvedVoiceType = voiceType;
        let resolvedVoice = voice;

        if (voiceType === "default") {
            const defaultVoice = this.alertConfig[channel]?.data?.config?.defaultVoice;
            if (!defaultVoice) {
                console.warn("Default voice type specified but no defaultVoice config found");
                return;
            }
            resolvedVoiceType = defaultVoice.voiceType;
            resolvedVoice = defaultVoice.voiceSpecifier;
        }

        // Choose engine
        const audioData = resolvedVoiceType === "ai"
            ? await this.aiTTS(ttsMessage, channel, resolvedVoice, state, sink)
            : await this.googleTTS(ttsMessage, channel, resolvedVoice, state, sink);

        if (!audioData) return;
        return this.getAudioInfo("data:audio/mp3;base64," + audioData);

    }

    async wait(duration: number, minDuration: number): Promise<void> {
        return new Promise((resolve) => {
            if (duration < minDuration) {
                this.preciseTimer(resolve, (minDuration-duration) * 1000);
            } else {
                resolve();
            }
        });
    }

    getAlert(event: Event, eventData: any, alertConfig?: EventAlertConfig, config?: Config): EventAlert | undefined {
        if (event.eventtype === 'tts' && event.id !== -1) {
            if (!((config?.freeTTS || []).includes(event.username) || (config?.freeTTS || []).includes('all'))) {
                return undefined;
            }
        }
        if (event.eventAlert) {
            return event.eventAlert;
        }
        const eventMainType = EventTypeMapping[event.eventtype] as EventMainType;
        const alerts = alertConfig?.data?.alerts[eventMainType];
        if (!alerts) {
            return undefined;
        }
        const exactAlerts: Record<number, EventAlert[]> = {};
        const minAlerts: Record<number, EventAlert[]> = {};
        const matchesAlerts: EventAlert[] = [];

        alerts.filter(a => !config?.deactivatedAlerts[a.id]).forEach(alert => {
            const amount = Number(alert.specifier.amount || 0);
            if (alert.specifier.type === "exact") {
                if (exactAlerts[amount]) {
                    exactAlerts[amount].push(alert)
                } else {
                    exactAlerts[amount] = [alert];
                }
            }
            if (alert.specifier.type === "min") {
                if (minAlerts[amount]) {
                    minAlerts[amount].push(alert)
                } else {
                    minAlerts[amount] = [alert];
                }
            }
            if (alert.specifier.type === "matches" && alert.specifier.text && 
                alert.specifier.attribute && (eventData[alert.specifier.attribute] === alert.specifier.text)) {
                    matchesAlerts.push(alert);
            }
        });
        const eventAmount = Number(event.amount || 0);
        const exactAlertMatches = exactAlerts[eventAmount];
        if (exactAlertMatches && exactAlertMatches.length) {
            return deterministicSample(exactAlertMatches, event.triggerId || Math.random() + '');
        }
        if (matchesAlerts.length) {
            return deterministicSample(matchesAlerts, event.triggerId || Math.random() + '');
        }
        const minKeys = Object.keys(minAlerts).map(x => Number(x)).sort((a, b) => a - b);
        const step = minKeys.findLast(x => x <= eventAmount);
        if (step || step === 0) {
            return deterministicSample(minAlerts[step], event.triggerId || Math.random() + '');
        }
    }

    getEventData(item?: string): any {
        if (!item || !item.startsWith('{')) return {};
        try {
            return JSON.parse(item);
        } catch (ex) {
            return {};
        }
    }

    parsedPartsToTTSText(parsedParts: ParsedMessagePart[]) {
        return parsedParts.map((part, partIndex) => {
            if (part.type === 'emote' && this.config?.skipEmotesInTTS) {
                return '';
            }
            return part.text;
        }).filter(x => x).join(' ');
    }

    parsedPartsToText(parsedParts: ParsedMessagePart[]) {
        return parsedParts.map((part, partIndex) => {
            if (part.type === 'emote') {
                return "image" + buildEmoteImageUrl(part.emote?.id! || part.id || '', {size: '3.0'}).substring(6);
            }
            return part.text;
        }).filter(x => x).join(' ');
    }

    /**
     * Determines which alert to play for a given event
     * @param event The event to determine the alert for
     * @returns Object containing alert information or undefined if no alert should be played
     */
    async determineAlert(event: Event): Promise<{
        alertType: 'blerp' | 'soundalerts' | 'standard' | 'none';
        alert?: EventAlert;
        audioUrl?: string;
        selectedSpriteFilename?: string;
        eventData: any;
        skipReason?: string;
    }> {
        const eventData = this.getEventData(event.text);

        try {
            // Check for blerp/soundalerts (direct audio URL)
            if (eventData.audioUrl) {
                if (event.eventtype === 'soundalerts') {
                    if (this.config?.deactivatedAlerts["soundalerts"]) {
                        return {
                            alertType: 'none',
                            eventData,
                            skipReason: 'SoundAlerts skipped - deactivated in settings'
                        };
                    }
                    return {
                        alertType: 'soundalerts',
                        audioUrl: eventData.audioUrl,
                        eventData
                    };
                }

                // blerp
                if (this.config?.deactivatedAlerts["blerp"]) {
                    return {
                        alertType: 'none',
                        eventData,
                        skipReason: 'Blerp alert skipped - deactivated in settings'
                    };
                }
                return {
                    alertType: 'blerp',
                    audioUrl: eventData.audioUrl,
                    eventData
                };
            }
        } catch (err) {
            console.error("Error processing blerp/soundalerts:", err);
            return {
                alertType: 'none',
                eventData,
                skipReason: 'Error processing blerp/soundalerts'
            };
        }
        
        // Check for alert configuration
        const alertConfig = this.alertConfig[event.channel];
        if (!alertConfig && !event.eventAlert) {
            return {
                alertType: 'none',
                eventData,
                skipReason: 'No alert configuration set'
            };
        }
        
        // Get the appropriate alert for this event
        const alert = this.getAlert(event, eventData, alertConfig, this.config!);
        
        if (!alert) {
            return {
                alertType: 'none',
                eventData,
                skipReason: 'No matching alert for event'
            };
        }
        
        // Process sprite selection if there's a visual element that's a zip file
        let selectedSpriteFilename: string | undefined;
        
        if (alert.visual?.element && alertConfig?.data?.files?.[alert.visual.element]) {
            const file = alertConfig.data.files[alert.visual.element];
            
            // Check if file is a zip file
            if (file.mime === 'application/zip' && event.username) {
                try {                    
                    // Get sprite data using SpriteManager
                    const spriteData = await spriteManager.getSpriteData(
                        file.data,
                        event.channel,
                        event.username,
                        eventData.useLast || false,
                        event.userSeed,
                    );
                    
                    if (spriteData) {
                        // Store the selected filename for use in TTS
                        selectedSpriteFilename = spriteData.selectedFilename;
                        
                        // Add the selectedFilename to the event for use in VisualAlertPlayer
                        event.selectedSpriteFilename = selectedSpriteFilename;
                        
                        console.log(`Selected sprite for ${event.username}: ${selectedSpriteFilename}`);
                    }
                } catch (err) {
                    console.error('Error selecting sprite:', err);
                }
            }
        }
        
        return {
            alertType: 'standard',
            alert,
            selectedSpriteFilename,
            eventData
        };
    }
 
    async playAlert(event: Event, alertInfo: {
        alertType: 'blerp' | 'soundalerts' | 'standard' | 'none';
        alert?: EventAlert;
        audioUrl?: string;
        selectedSpriteFilename?: string;
        eventData: any;
        skipReason?: string;
    }) {
        const onEnd = () => {
            console.log('Stop Playing');
            this.stopPlaying();
            PubSub.publish('AlertPlayer-update');
        }

        const onError = (reason: any) => {
            console.log('Error while Playing', reason);
            this.stopPlaying();
            PubSub.publish('AlertPlayer-update');
        }
        
        // Handle blerp alerts (direct audio URL)
        if (alertInfo.alertType === 'blerp') {
            // Check if audio should be played based on mode and settings
            const isPreviewAlert = !!(event as any).force;
            const shouldPlayAudio = this.mode === 'browsersource'
                ? (isPreviewAlert || (this.config?.browserSourceAudio ?? false))
                : (this.config?.playAlerts ?? false);

            if (!shouldPlayAudio) {
                console.log("Blerp audio playback skipped due to settings");
                onEnd();
                return;
            }

            this.startPlaying();
            // Direct access to blerp audio without proxy
            this.getAudioInfo(alertInfo.audioUrl!).then((audioInfo) => {
                PubSub.publish('AlertPlayer-update', {duration: audioInfo?.duration || 5}); // Default to 5 seconds if duration unknown
                this.playAudio(1.0, audioInfo, 0).then(onEnd, onError);
            }, onError);
            return;
        }

        // Handle soundalerts (direct audio URL)
        if (alertInfo.alertType === 'soundalerts') {
            const isPreviewAlert = !!(event as any).force;
            const shouldPlayAudio = this.mode === 'browsersource'
                ? (isPreviewAlert || (this.config?.browserSourceAudio ?? false))
                : (this.config?.playAlerts ?? false);

            if (!shouldPlayAudio) {
                console.log("SoundAlerts audio playback skipped due to settings");
                onEnd();
                return;
            }

            this.startPlaying();
            this.getAudioInfo(alertInfo.audioUrl!).then((audioInfo) => {
                PubSub.publish('AlertPlayer-update', {duration: audioInfo?.duration || 5});
                this.playAudio(1.0, audioInfo, 0).then(onEnd, onError);
            }, onError);
            return;
        }

        // At this point we have a standard alert
        const { alert, selectedSpriteFilename, eventData } = alertInfo;
        if (!alert) {
            console.log('No alert found after determination');
            this.stopPlaying(); // Reset playing state
            return;
        }
        
        const alertConfig = this.alertConfig[event.channel];

        PubSub.publish('AlertPlayer-update', {text: 'Prepare Alert'});
        console.log('Play alert with config', event, alert);

        const vars:any = {
            ...eventData,
            ...event,
            amount: Number(event.amount),
            amount2: Number(event.amount2),
            selectedFilename: selectedSpriteFilename // Make available for TTS
        };

        const state = localStorage.getItem('hehe-token_state') || '';
        const sink = localStorage.getItem('hehe-sink') || '';
        this.startPlaying();
        console.log('Start playing');
        this.currentlyPlaying = event;
        const ttsMessage = this.cleanMessage(formatString(alert.audio?.tts?.text || "", {
            ...vars,
            text: (eventData && eventData.text) ? this.parsedPartsToTTSText(eventData.text.parts || eventData.text) : undefined
        }), true, event.channel);

        // Chain audio playback with proper error handling - use mode to determine which setting to check
        // For preview alerts (event.force), always play audio in browsersource regardless of settings
        const isPreviewAlert = !!(event as any).force;
        const shouldPlayAudio = this.mode === 'browsersource' 
            ? (isPreviewAlert || (this.config?.browserSourceAudio ?? false))
            : (this.config?.playAlerts ?? false);

        try {
            const ttsAudio = (alert.audio?.tts && ttsMessage) ? await this.tts(ttsMessage, event.channel, alert.audio.tts.voiceSpecifier, alert.audio.tts.voiceType, state, sink) : undefined;
            const jingleAudio = alert.audio?.jingle ? await this.getAudioInfo(this.getAudioFileData(alert.audio.jingle, alertConfig)) : undefined;

            console.log('Audio', ttsAudio, jingleAudio);
    
            const duration = (ttsAudio?.duration || 0) + (jingleAudio?.duration || 0);
            const minDuration = Math.max(duration, alert.minDuration ?? 2);
            PubSub.publish('AlertPlayer-update', {duration});
            if (alert.visual) {
                const visualText = (eventData && eventData.text) ? this.parsedPartsToText(eventData.text.parts || eventData.text) : undefined
                const headline = formatString(alert.visual?.headline || "", {
                    ...vars,
                    text: visualText
                });
                const text = this.cleanMessage(formatString(alert.visual?.text || "", {
                    ...vars,
                    text: visualText
                }), false);

                const visualAlert: VisualAlert = {image: alert.visual?.element, headline, text, duration: minDuration * 1000, channel: event.channel, position: alert.visual?.position, layout: alert.visual?.layout, event: event};
                visualAlert.triggerId = event.triggerId;
                event.useLastSpriteFilename = eventData.useLast;
                if (this.mode === 'app' ) {
                    // Send to backend immediately (this doesn't affect display timing)
                    PubSub.publish('WSSEND', {type: 'alert', data: visualAlert, profile: this.profile?.guid });
                }
                
                // Apply visual alert delay for browser source mode
                if ((this.config?.browserSourceAudio ?? false) || isPreviewAlert) {
                    PubSub.publish('ALERT_SHOW', visualAlert);
                }
            }
            
            if (shouldPlayAudio) {
                console.log("Starting jingle playback");
                this.playAudio(0.8, jingleAudio, 0)
                    .then(() => {
                        console.log("Jingle playback completed, starting TTS");
                        if (this.skipCurrent) throw new Error("Playback skipped");
                        
                        // Handle case where TTS audio is undefined
                        if (!ttsAudio) {
                            console.log("No TTS audio available, skipping TTS part but continuing alert");
                            return Promise.resolve(); // Skip TTS part but continue chain
                        }
                        return this.playAudio(1.0, ttsAudio, 0);
                    })
                    .then(() => {
                        console.log("TTS playback completed");
                        if (this.skipCurrent) throw new Error("Playback skipped");
                        return this.endAudio();
                    })
                    .then(() => {
                        console.log("Audio ended, waiting for minimum duration");
                        if (this.skipCurrent) throw new Error("Playback skipped");
                        return this.wait(duration, minDuration);
                    })
                    .then(onEnd)
                    .catch(err => {
                        console.error("Error in audio chain:", err);
                        onError(err);
                    });
            } else {
                console.log("Audio disabled, showing visual only");
                // Skip audio but still wait for minimum duration for visual
                this.wait(0, minDuration).then(onEnd).catch(onError);
            }
        } catch (err) {
            console.error(err);
            this.stopPlaying();
        }

    }

    quequeLength(): number {
        return this.queue.length - this.index;
    }

    shouldBePlayedInApp(item: Event): boolean {
        if (!this.config) {
            console.error('Adding event but config not set', item);
            return false;
        }
        const sbp = this.config!.playAlerts && this.config!.receivedShares.includes(item.channel) && this.config!.activatedShares.includes(item.channel);
        if (!sbp) {
            // console.debug('Will not play alerts', this.config, item);
        }
        return sbp;
    }

    shouldBePlayedInBrowsersourceAudio(item: Event): boolean {
        if (!this.config) {
            console.error('Adding event but config not set', item);
            return false;
        }
        const sbp = this.config!.browserSourceAudio && this.config!.receivedShares.includes(item.channel) && this.config!.activatedShares.includes(item.channel);
        if (!sbp) {
            // console.debug('Will not play audio alerts', this.config, item);
        }
        return sbp;
    }

    shouldBePlayedInBrowsersourceVisual(item: Event): boolean {
        if (!this.config) {
            console.error('Adding event but config not set', item);
            return false;
        }
        const sbp = this.config!.browserSourceVisual && this.config!.receivedShares.includes(item.channel) && this.config!.activatedShares.includes(item.channel);
        if (!sbp) {
            // console.debug('Will not show visual alerts', this.config, item);
        }
        return sbp;
    }

    shouldBePlayedInBrowsersource(item: Event): boolean {
        // Keep for backward compatibility - returns true if either audio or visual should be played
        return this.shouldBePlayedInBrowsersourceAudio(item) || this.shouldBePlayedInBrowsersourceVisual(item);
    }

    addEvent(item: Event) {
        console.log("Event added to the queue", item);
        PubSub.publish('AlertPlayer-update', {text: 'Event added'});
        this.queue.push(item);
    }
    
    // Play silence sound if the queue is empty
    playSilenceIfQueueEmpty() {
        // Only play silence if we're not already playing something, we're initialized, and the queue is empty
        if (!this.playing && this.config && this.status() && this.index >= this.queue.length) {
            console.log("Queue is empty, playing silence sound");
            this.getAudioInfo(silence).then((audioInfo) => {
                if (audioInfo) {
                    this.startPlaying();
                    this.playAudio(0.01, audioInfo, 0).then(() => {
                        console.log("Silence played successfully");
                        this.stopPlaying();
                    }).catch(err => {
                        console.error("Error playing silence:", err);
                        this.stopPlaying();
                    });
                }
            }).catch(err => {
                console.error("Error getting silence audio info:", err);
            });
        }
    }

    async checkQueue() {
        try {
            // Don't process queue if destroyed
            if (this.isDestroyed) {
                return;
            }
            
            if (this.interrupted()) {
                return this.handleAudioInterruption();
            }
            
            // Don't process queue if we're already playing or not initialized
            if (this.paused || this.playing || !this.config || !this.status()) {
                return;
            }
        
            // Check if we've processed all items in the queue
            if (this.index >= this.queue.length) {
                return;
            }
        
            // Get the next event from the queue
            const event = this.queue[this.index++];
        
            if (!event) {
                return;
            }
            
            // Set playing = true IMMEDIATELY to block re-entry during async determineAlert
            this.playing = true;
            this.skipCurrent = false;
            
            try {
                // Determine which alert to play
                const alertInfo = await this.determineAlert(event);
                
                // Handle case where no alert should be played
                if (alertInfo.alertType === 'none') {
                    console.log(alertInfo.skipReason);
                    this.playing = false;  // No audio to play, allow queue to continue
                    PubSub.publish('AlertPlayer-update');
                    return;
                }

                console.log("Play Event", event);
                
                await this.playAlert(event, alertInfo);
            } catch (err) {
                console.error("Error showing notification:", err);
                this.stopPlaying();
                PubSub.publish('AlertPlayer-update');
            }
        } catch (err) {
            // Make sure we reset the playing state in case of unexpected errors
            this.playing = false;
            console.error("Unexpected error in checkQueue:", err);
            PubSub.publish('AlertPlayer-update');
        }
    }
}

export const AlertSystem = new AlertPlayer();
