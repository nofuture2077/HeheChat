import { Event, EventAlertConfig, Base64FileReference, Base64File, EventAlert, EventMainType, EventTypeMapping, VisualAlert } from "@/commons/events";

import { Config } from "@/commons/config";
import { Profile } from "@/commons/profile";
import { formatString } from "@/commons/helper";
import { silence } from "./silence";
import PubSub from 'pubsub-js';
import _ from "underscore";
import { AlertConfig } from "@/components/events/alertconfigstorage";
import { formatEventText } from "@/components/events/eventlist";
import { DEFAULT_CHAT_EMOTES } from "@/commons/emotes";
import { Howl, Howler } from 'howler';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

interface AudioInfo {
    duration: number;
    audioUrl: string;
}

let cheerPrefixes = ['Cheer', 'BibleThump', 'cheerwhal', 'Corgo', 'uni', 'ShowLove', 'Party', 'SeemsGood', 'Pride', 'Kappa', 'FrankerZ', 'HeyGuys', 'DansGame', 'EleGiggle', 'TriHard', 'Kreygasm', '4Head', 'SwiftRage', 'NotLikeThis', 'FailFish', 'VoHiYo', 'PJSalt', 'MrDestructoid', 'bday', 'RIPCheer', 'Shamrock'];
let cheerPrefixesRegExp = cheerPrefixes.map(x => new RegExp(`\\b${x}\\d+\\b`, "gi"))

class AlertPlayer {
    currentSound?: Howl;
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
    initialized: boolean = false;

    constructor() {
        setInterval(() => this.checkQueue(), 1000);
        this.ttsExtra = Number(localStorage.getItem('hehechat-ttsExtra') || '0') || 0;
        this.jingleExtra = Number(localStorage.getItem('hehechat-jingleExtra') || '0') || 0;
        // Set up interval to check if queue is empty every 2 minutes
        setInterval(() => this.playSilenceIfQueueEmpty(), 120000);
    }

    status(): boolean {
        return this.initialized && Howler.ctx && Howler.ctx.state === 'running';
    }

    interrupted(): boolean {
        return this.initialized && Howler.ctx && Howler.ctx.state === 'suspended';
    }

    initialize() {
        console.log('Alert system initialized');
        this.initialized = true;
        
        // Set global volume to 0 initially
        Howler.volume(0);
        
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
        setTimeout(callback, delay);
    }

    async playAudio(volume: number, audioInfo: AudioInfo | undefined, extra: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!audioInfo || this.skipCurrent || !this.initialized) {
                resolve();
                return;
            }
            
            const { audioUrl } = audioInfo;
            
            // Clean up any existing audio
            this.cleanupCurrentSound();
            
            // Apply the alert boost from config if available
            const boostFactor = this.config?.alertBoost || 1.0;
            const finalVolume = this.muted ? 0 : (volume * boostFactor);
            
            // Create new Howl instance
            this.currentSound = new Howl({
                src: [audioUrl],
                volume: finalVolume,
                onend: () => {
                    this.cleanupCurrentSound();
                    setTimeout(() => resolve(), extra);
                },
                onloaderror: (id: any, error: any) => {
                    console.error("Error loading audio:", error);
                    this.cleanupCurrentSound();
                    resolve(); // Resolve to allow queue to continue
                },
                onplayerror: (id: any, error: any) => {
                    console.error("Error playing audio:", error);
                    this.cleanupCurrentSound();
                    resolve(); // Resolve to allow queue to continue
                },
                onload: () => {
                    // Update media session metadata when audio loads
                    if ('mediaSession' in navigator) {
                        this.updateMediaSessionMetadata();
                    }
                }
            });
            
            // Play the sound
            try {
                this.currentSound.play();
            } catch (err) {
                console.error("Error starting audio playback:", err);
                this.cleanupCurrentSound();
                resolve();
            }
        });
    }

    async getAudioInfo(src: string): Promise<AudioInfo | undefined> {
        if (!src) {
            return undefined;
        }
        
        return {
            duration: 0, // HowlerJS will determine duration when loaded
            audioUrl: src
        };
    }

    pause() {
        this.paused = true;
        if (this.currentSound) {
            this.currentSound.pause();
        }
        // Suspend Howler context if available
        if (Howler.ctx) {
            Howler.ctx.suspend();
        }
    }

    resume() {
        this.paused = false;
        
        // Resume Howler context if available
        if (Howler.ctx) {
            Howler.ctx.resume();
        }
        
        // Resume current sound if it exists and was playing
        if (this.currentSound && this.playing) {
            this.currentSound.play();
            
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
        Howler.volume(0);
        if (this.currentSound) {
            this.currentSound.volume(0);
        }
    }

    unmute() {
        this.muted = false;
        
        // Apply the alert boost from config if available
        const boostFactor = this.config?.alertBoost || 1.0;
        Howler.volume(boostFactor);
        
        if (this.currentSound && this.playing) {
            this.currentSound.volume(boostFactor);
            
            // Update UI to reflect unmuted state
            PubSub.publish('AlertPlayer-update');
        }
    }

    startPlaying() {
        this.skipCurrent = false;
        this.playing = true;
        
        // Apply the alert boost from config if available
        const boostFactor = this.config?.alertBoost || 1.0;
        Howler.volume(this.muted ? 0 : boostFactor);
    }

    // Helper method to safely clean up the current sound
    private cleanupCurrentSound() {
        if (this.currentSound) {
            try {
                this.currentSound.stop();
                this.currentSound.unload();
            } catch (e) {
                // Ignore errors if sound was already stopped
                console.log("Error cleaning up sound:", e);
            }
            this.currentSound = undefined;
        }
    }

    stopPlaying() {
        this.playing = false;
        this.paused = false;
        this.skipCurrent = false; // Reset skip flag
        this.cleanupCurrentSound();
        Howler.volume(0);
    }

    endAudio() {
        this.cleanupCurrentSound();
        return Promise.resolve();
    }

    skip() {
        this.skipCurrent = true;
        this.cleanupCurrentSound();
        Howler.volume(0);
        
        // Reset playing state to allow the queue to continue
        this.playing = false;
        
        // Update UI to reflect skipped state
        PubSub.publish('AlertPlayer-update', {
            text: 'Skipped'
        });
    }

    cleanMessage(message: string, filterTTS: boolean) {
        // First clean cheer prefixes
        var cleanedMessage = cheerPrefixesRegExp.reduce(
            (accumulator, prefix) => accumulator.replaceAll(prefix, ""),
            message
        );
        // Then remove URLs
        cleanedMessage = cleanedMessage.replace(/https?:\/\/[^\s]+/g, "");

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
        if (eventData.eventAlert) {
            if (!((config.freeTTS || []).includes(event.username) || (config.freeTTS || []).includes('all'))) {
                return undefined;
            }
            return eventData.eventAlert;
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

    parsedPartsToTTSText(parsedParts: any[]) {
        return parsedParts.map((part, partIndex) => {
            return part.text;
        }).join(' ');
    }

    parsedPartsToText(parsedParts: any[]) {
        return parsedParts.map((part, partIndex) => {
            return part.text;
        }).join(' ');
    }
 
    async showNotification(item: Event) {
        const eventData = this.getEventData(item.text);
        let alertFullyProcessed = false;

        const onEnd = () => {
            console.log('Stop Playing');
            alertFullyProcessed = true;
            this.stopPlaying();
            PubSub.publish('AlertPlayer-update');
        }

        const onError = (reason: any) => {
            console.log('Error while Playing', reason);
            alertFullyProcessed = true;
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
            ...eventData,
            ...item,
            amount: Number(item.amount),
            amount2: Number(item.amount2)
        };


        const state = localStorage.getItem('hehe-token_state') || '';
        const sink = localStorage.getItem('hehe-sink') || '';
        this.startPlaying();
        console.log('Start playing');
        this.currentlyPlaying = item;
        const ttsMessage = this.cleanMessage(formatString(alert.audio?.tts?.text || "", {
            ...vars,
            text: (eventData && eventData.text) ? this.parsedPartsToTTSText(eventData.text.parts || eventData.text) : undefined
        }), true);
        try {
            const ttsAudio = (alert.audio?.tts && ttsMessage) ? await this.tts(ttsMessage, item.channel, alert.audio!.tts!.voiceSpecifier, alert.audio!.tts!.voiceType, state, sink) : undefined;
            const jingleAudio = alert.audio?.jingle ? await this.getAudioInfo(this.getAudioFileData(alert.audio!.jingle!, alertConfig)) : undefined;

            console.log('Audio', ttsAudio, jingleAudio);
    
            const duration = (ttsAudio?.duration || 0) + (jingleAudio?.duration || 0);
            const minDuration = Math.max(duration, 2);
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

                console.log('Visuell', text, headline);

                const visualAlert: VisualAlert = {image: alert.visual?.element, headline, text, duration: minDuration * 1000, channel: item.channel, position: alert.visual?.position, layout: alert.visual?.layout};
                
                // Send to backend immediately (this doesn't affect display timing)
                PubSub.publish('WSSEND', {type: 'alert', data: visualAlert, profile: this.profile?.guid });
                
                PubSub.publish('ALERT_SHOW', visualAlert);
            }

            // Chain audio playback with proper error handling
            console.log("Starting jingle playback");
            this.playAudio(0.8, jingleAudio, this.jingleExtra || 0)
                .then(() => {
                    console.log("Jingle playback completed, starting TTS");
                    if (this.skipCurrent) throw new Error("Playback skipped");
                    
                    // Handle case where TTS audio is undefined
                    if (!ttsAudio) {
                        console.log("No TTS audio available, skipping TTS part but continuing alert");
                        return Promise.resolve(); // Skip TTS part but continue chain
                    }
                    return this.playAudio(1.0, ttsAudio, this.ttsExtra || 0);
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

    checkQueue() {
        if (this.interrupted()) {
            console.log("Audio context interrupted, stopping playback");
            this.stopPlaying();
            PubSub.publish('AlertPlayer-update');
            return;
        }
        
        // If we're paused, don't process the queue
        if (this.paused) {
            return;
        }
        
        // Don't process queue if we're already playing or not initialized
        if (this.playing || !this.config || !this.status()) {
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
