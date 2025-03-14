import { Event, EventAlertConfig, Base64FileReference, Base64File, EventAlert, EventMainType, EventTypeMapping, VisualAlert } from "@/commons/events";

import { Config } from "@/commons/config";
import { Profile } from "@/commons/profile";
import { formatString } from "@/commons/helper";
import { silence } from "./silence";
import PubSub from 'pubsub-js';
import _ from "underscore";
import { AlertConfig } from "@/components/events/alertconfigstorage";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

interface AudioInfo {
    duration: number;
    audioBuffer?: AudioBuffer;
    audioUrl?: string;
}

let cheerPrefixes = ['Cheer', 'BibleThump', 'cheerwhal', 'Corgo', 'uni', 'ShowLove', 'Party', 'SeemsGood', 'Pride', 'Kappa', 'FrankerZ', 'HeyGuys', 'DansGame', 'EleGiggle', 'TriHard', 'Kreygasm', '4Head', 'SwiftRage', 'NotLikeThis', 'FailFish', 'VoHiYo', 'PJSalt', 'MrDestructoid', 'bday', 'RIPCheer', 'Shamrock'];
let cheerPrefixesRegExp = cheerPrefixes.map(x => new RegExp(`\\b${x}\\d+\\b`, "gi"))

class AlertPlayer {
    audioContext?: AudioContext;
    mainAudioGain?: GainNode;
    currentSource?: AudioBufferSourceNode;
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
    ttsExtra?: number;
    jingleExtra?: number;

    constructor() {
        setInterval(() => this.checkQueue(), 1000);
        this.ttsExtra = Number(localStorage.getItem('hehechat-ttsExtra') || '0') || 0;
        this.jingleExtra = Number(localStorage.getItem('hehechat-jingleExtra') || '0') || 0;
        
        // Add visibility change listener to handle browser tab/app switching
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        }
    }
    
    // Handle visibility changes (browser tab/app switching)
    private handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            console.log('App became visible, checking audio context state');
            this.ensureAudioContext();
        } else {
            console.log('App hidden, may need to reset audio state on return');
            // If we're currently playing something, mark it as potentially interrupted
            if (this.playing) {
                this.stopPlaying();
            }
        }
    }
    
    // Ensure AudioContext is in the correct state
    private ensureAudioContext() {
        if (!this.audioContext) {
            console.log('AudioContext not initialized, creating new one');
            this.initialize();
            return;
        }
        
        if (this.audioContext.state === 'suspended') {
            console.log('AudioContext suspended, resuming');
            this.audioContext.resume().catch(err => {
                console.error('Failed to resume AudioContext:', err);
                // If resume fails, try recreating the AudioContext
                this.initialize();
            });
        } else if (this.audioContext.state === 'closed') {
            console.log('AudioContext closed, creating new one');
            this.initialize();
        }
    }

    status(): boolean {
        // Check if AudioContext exists and is in a usable state
        // For iOS, we consider 'suspended' as valid since we can resume it
        return this.audioContext !== undefined && 
               (this.audioContext.state === 'running' || this.audioContext.state === 'suspended');
    }

    initialize() {
        console.log('Alert system initialized');
        // Close existing context if it exists
        if (this.audioContext) {
            try {
                this.audioContext.close();
            } catch (e) {
                console.error('Error closing existing AudioContext:', e);
            }
        }
        
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
            if (!audioInfo || this.skipCurrent) {
                resolve();
                return;
            }
            
            // Ensure AudioContext is ready before playing
            this.ensureAudioContext();
            
            if (!this.audioContext || (this.audioContext.state !== 'running' && this.audioContext.state !== 'suspended')) {
                console.error('AudioContext not available or in invalid state:', this.audioContext?.state);
                resolve();
                return;
            }
            
            // If AudioContext is suspended, try to resume it
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().catch(err => {
                    console.error('Failed to resume AudioContext:', err);
                    resolve(); // Resolve to allow queue to continue
                    return;
                });
            }
            
            const { duration, audioBuffer, audioUrl } = audioInfo;
            
            // Clean up any existing audio source
            this.cleanupCurrentSource();
            
            // Create a new gain node for this specific audio
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = this.muted ? 0 : volume;
            gainNode.connect(this.audioContext.destination);
            
            // Setup error handling for unexpected interruptions
            const handleInterruption = () => {
                console.log("Audio playback interrupted");
                this.cleanupCurrentSource();
                this.playing = false; // Reset playing state
                resolve(); // Resolve the promise to allow queue to continue
            };
            
            if (audioBuffer) {
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
                    .then(arrayBuffer => {
                        // Check if AudioContext is still valid
                        if (!this.audioContext) {
                            throw new Error('AudioContext no longer available');
                        }
                        return this.audioContext.decodeAudioData(arrayBuffer);
                    })
                    .then(decodedData => {
                        if (this.skipCurrent || !this.audioContext) {
                            resolve();
                            return;
                        }
                        
                        try {
                            const source = this.audioContext.createBufferSource();
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

    async getAudioInfo(src: string): Promise<AudioInfo | undefined> {
        return new Promise((resolve, reject) => {
            // Ensure AudioContext is ready
            this.ensureAudioContext();
            
            if (!src || !this.audioContext) {
                resolve(undefined);
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
        if (this.audioContext?.state === 'suspended') {
            this.audioContext.resume().catch(err => {
                console.error('Failed to resume AudioContext:', err);
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
    }

    startPlaying() {
        this.skipCurrent = false;
        this.playing = true;
        
        // Ensure AudioContext is ready before starting playback
        this.ensureAudioContext();
        
        if (this.mainAudioGain) this.mainAudioGain.gain.value = 1;
    }

    // Helper method to safely clean up the current audio source
    private cleanupCurrentSource() {
        if (this.currentSource) {
            try {
                this.currentSource.onended = null; // Remove event listener
                this.currentSource.stop();
                this.currentSource.disconnect();
            } catch (e) {
                // Ignore errors if source was already stopped
                console.log("Error cleaning up audio source:", e);
            }
            this.currentSource = undefined;
        }
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
    }

    cleanMessage(message: string) {
        // First clean cheer prefixes
        var cleanedMessage = cheerPrefixesRegExp.reduce(
            (accumulator, prefix) => accumulator.replaceAll(prefix, ""),
            message
        );
        // Then remove URLs
        cleanedMessage = cleanedMessage.replace(/https?:\/\/[^\s]+/g, "");
        return cleanedMessage;
    }

    setTTSExtra(extra: number) {
        this.ttsExtra = extra;
        localStorage.setItem('hehechat-ttsExtra', extra + "");
    }

    setJingleExtra(extra: number) {
        this.jingleExtra = extra;
        localStorage.setItem('hehechat-jingleExtra', extra + "");
    }

    getAudioFileData(reference: Base64FileReference, alertConfig: EventAlertConfig) {
        const file = alertConfig.data?.files[reference] as unknown as Base64File;
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
        
        const audioData = voiceType === 'ai' ? await this.aiTTS(ttsMessage, channel, voice, state, sink) : await this.googleTTS(ttsMessage, channel, voice, state, sink);
        if (!audioData) {
            return undefined;
        }
        return await this.getAudioInfo('data:audio/mp3;base64,' + audioData);
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

    getAlert(event: Event, eventData: any, alertConfig: EventAlertConfig, config: Config): EventAlert | undefined {
        if (event.eventAlert) {
            return event.eventAlert;
        }
        const eventMainType = EventTypeMapping[event.eventtype] as EventMainType;
        const alerts = alertConfig.data?.alerts[eventMainType];
        if (!alerts) {
            return undefined;
        }
        const exactAlerts: Record<number, EventAlert[]> = {};
        const minAlerts: Record<number, EventAlert[]> = {};
        const matchesAlerts: EventAlert[] = [];

        alerts.filter(a => !config.deactivatedAlerts[a.id]).forEach(alert => {
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
            return _.sample(exactAlertMatches);
        }
        if (matchesAlerts.length) {
            return _.sample(matchesAlerts);
        }
        const minKeys = Object.keys(minAlerts).map(x => Number(x)).sort((a, b) => a - b);
        const step = minKeys.findLast(x => x <= eventAmount);
        if (step || step === 0) {
            return _.sample(minAlerts[step]);
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

    parsedPartsToText(parsedParts: any[]) {
        return parsedParts.map((part, partIndex) => {
            return part.text;
        }).join(' ');
    }
 
    async showNotification(item: Event) {
        const eventData = this.getEventData(item.text);

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

        try {
            // eventData.audioUrl is used for blerps
            if (eventData.audioUrl) {
                // Check if blerps are deactivated in the config
                if (this.config?.deactivatedAlerts["blerp"]) {
                    console.log('Blerp alert skipped - deactivated in settings');
                    return;
                }
                
                this.startPlaying();
                // Direct access to blerp audio without proxy
                this.getAudioInfo(eventData.audioUrl).then((audioInfo) => {
                    PubSub.publish('AlertPlayer-update', {duration: audioInfo?.duration || 5}); // Default to 5 seconds if duration unknown
                    this.playAudio(1.0, audioInfo, 0).then(onEnd, onError);
                }, onError);
                return;
            }
        } catch (err) {
            console.error("Error processing blerp:", err);
            onError(err);
            return;
        }
        const alertConfig = this.alertConfig[item.channel];
        if (!alertConfig && !item.eventAlert) {
            console.log('No alertconfig set');
            return;
        }
        const alert = this.getAlert(item, eventData, alertConfig, this.config!);

        if (!alert) {
            PubSub.publish('AlertPlayer-update', {text: 'No Alert for Event'});
            console.log('No alert for event', this.config, alertConfig, item);
            return;
        }

        PubSub.publish('AlertPlayer-update', {text: 'Prepare Alert'});
        console.log('Play alert with config', item, alert);

        const vars:any = {
            username: item.username,
            usernameTo: item.usernameTo,
            amount: Number(item.amount),
            amount2: Number(item.amount2),
            text: item.text
        };

        if (eventData && eventData.text) {
            vars.text = this.parsedPartsToText(eventData.text.parts || eventData.text);
        }
        const state = localStorage.getItem('hehe-token_state') || '';
        const sink = localStorage.getItem('hehe-sink') || '';
        this.startPlaying();
        console.log('Start playing');
        this.currentlyPlaying = item;
        const ttsMessage = this.cleanMessage(formatString(alert.audio?.tts?.text || "", vars));
        try {
            const ttsAudio = (alert.audio?.tts && ttsMessage) ? await this.tts(ttsMessage, item.channel, alert.audio!.tts!.voiceSpecifier, alert.audio!.tts!.voiceType, state, sink) : undefined;
            const jingleAudio = alert.audio?.jingle ? await this.getAudioInfo(this.getAudioFileData(alert.audio!.jingle!, alertConfig)) : undefined;

            console.log('Audio', ttsAudio, jingleAudio);
    
            const duration = (ttsAudio?.duration || 0) + (jingleAudio?.duration || 0);
            const minDuration = Math.max(duration, 2);
            PubSub.publish('AlertPlayer-update', {duration});
            if (alert.visual) {
                const headline = formatString(alert.visual?.headline || "", vars);
                const text = this.cleanMessage(formatString(alert.visual?.text || "", vars));

                console.log('Visuell', text, headline);

                const visualAlert: VisualAlert = {image: alert.visual?.element, headline, text, duration: minDuration * 1000, channel: item.channel, position: alert.visual?.position, layout: alert.visual?.layout};

                PubSub.publish('WSSEND', {type: 'alert', data: visualAlert, profile: this.profile?.guid });
                PubSub.publish('ALERT_SHOW', visualAlert);
            }

            // Chain audio playback with proper error handling
            this.playAudio(0.8, jingleAudio, this.jingleExtra || 0)
                .then(() => {
                    if (this.skipCurrent) throw new Error("Playback skipped");
                    return this.playAudio(1.0, ttsAudio, this.ttsExtra || 0);
                })
                .then(() => {
                    if (this.skipCurrent) throw new Error("Playback skipped");
                    return this.endAudio();
                })
                .then(() => {
                    if (this.skipCurrent) throw new Error("Playback skipped");
                    return this.wait(duration, minDuration);
                })
                .then(onEnd)
                .catch(err => {
                    console.error("Error in audio chain:", err);
                    onError(err);
                });
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

    shouldBePlayedInBrowsersource(item: Event): boolean {
        if (!this.config) {
            console.error('Adding event but config not set', item);
            return false;
        }
        const sbp = this.config!.browserSourceAudio && this.config!.receivedShares.includes(item.channel) && this.config!.activatedShares.includes(item.channel);
        if (!sbp) {
            // console.debug('Will not play alerts', this.config, item);
        }
        return sbp;
    }

    addEvent(item: Event) {
        console.log("Event added to the queue", item);
        PubSub.publish('AlertPlayer-update', {text: 'Event added'});
        this.queue.push(item);
    }
    
    checkQueue() {
        // Ensure AudioContext is in the correct state before processing queue
        this.ensureAudioContext();
        
        // Don't process queue if we're already playing, paused, or not initialized
        if (this.playing || this.paused || !this.config || !this.status()) {
            return;
        }
    
        // Check if we've processed all items in the queue
        if (this.index >= this.queue.length) {
            return;
        }
    
        // Get the next item from the queue
        const item = this.queue[this.index++];
    
        if (!item) {
            return;
        }
        
        // Reset state before playing new item
        this.skipCurrent = false;
        
        console.log("Play Event", item);
        this.showNotification(item).catch(err => {
            console.error("Error showing notification:", err);
            // Make sure we reset the playing state so the queue can continue
            this.stopPlaying();
            PubSub.publish('AlertPlayer-update');
        });
    }
}

export const AlertSystem = new AlertPlayer();
