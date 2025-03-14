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
    }

    status(): boolean {
        return this.audioContext !== undefined && this.audioContext.state === 'running';
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
            
            const { duration, audioBuffer, audioUrl } = audioInfo;
            
            // Stop any currently playing source
            if (this.currentSource) {
                try {
                    this.currentSource.stop();
                    this.currentSource.disconnect();
                } catch (e) {
                    // Ignore errors if source was already stopped
                }
            }
            
            // Create a new gain node for this specific audio
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = this.muted ? 0 : volume;
            gainNode.connect(this.audioContext.destination);
            
            if (audioBuffer) {
                // Play from decoded buffer
                const source = this.audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(gainNode);
                
                this.currentSource = source;
                source.onended = () => {
                    setTimeout(() => resolve(), extra);
                };
                
                source.start();
                
                // Update media session metadata when playing new audio
                if ('mediaSession' in navigator) {
                    this.updateMediaSessionMetadata();
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
                        
                        const source = this.audioContext!.createBufferSource();
                        source.buffer = decodedData;
                        source.connect(gainNode);
                        
                        this.currentSource = source;
                        source.onended = () => {
                            setTimeout(() => resolve(), extra);
                        };
                        
                        source.start();
                        
                        // Update media session metadata
                        if ('mediaSession' in navigator) {
                            this.updateMediaSessionMetadata();
                        }
                    })
                    .catch(err => {
                        console.error("Error fetching or decoding audio:", err);
                        reject(err);
                    });
            } else {
                resolve(); // No audio to play
            }
        });
    }

    async getAudioInfo(src: string): Promise<AudioInfo | undefined> {
        return new Promise((resolve, reject) => {
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
        this.audioContext?.resume();
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
        if (this.mainAudioGain) this.mainAudioGain.gain.value = 1;
    }

    stopPlaying() {
        this.playing = false;
        this.paused = false;
        if (this.currentSource) {
            try {
                this.currentSource.stop();
                this.currentSource.disconnect();
            } catch (e) {
                // Ignore errors if source was already stopped
            }
            this.currentSource = undefined;
        }
        if (this.mainAudioGain) this.mainAudioGain.gain.value = 0;
    }

    endAudio() {
        if (this.currentSource) {
            try {
                this.currentSource.stop();
                this.currentSource.disconnect();
            } catch (e) {
                // Ignore errors if source was already stopped
            }
            this.currentSource = undefined;
        }
        return Promise.resolve();
    }

    skip() {
        this.skipCurrent = true;
        if (this.currentSource) {
            try {
                this.currentSource.stop();
                this.currentSource.disconnect();
            } catch (e) {
                // Ignore errors if source was already stopped
            }
            this.currentSource = undefined;
        }
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

            this.playAudio(0.8, jingleAudio, this.jingleExtra || 0).then(() => this.playAudio(1.0, ttsAudio, this.ttsExtra || 0)).then(() => this.endAudio()).then(() => this.wait(duration, minDuration)).then(onEnd, onError);
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
        if (this.playing || this.paused || !this.config || !this.status()) {
            return;
        }
    
        if (this.index >= this.queue.length) {
            return;
        }
    
        const item = this.queue[this.index++];
    
        if (!item) {
            return;
        }
        console.log("Play Event", item);
        this.showNotification(item);
    }
}

export const AlertSystem = new AlertPlayer();
