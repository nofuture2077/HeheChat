import { Event, EventAlertConfig, Base64FileReference, Base64File, EventAlert, EventMainType, EventTypeMapping } from "@/commons/events";
import _ from "underscore";

import { Config } from "@/commons/config";
import { parseMessage } from "@/commons/message";
import { silence } from "./silence";
import PubSub from 'pubsub-js';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

interface AudioInfo {
    duration: number;
    audio: HTMLAudioElement;
}

let cheerPrefixes = ['Cheer', 'BibleThump', 'cheerwhal', 'Corgo', 'uni', 'ShowLove', 'Party', 'SeemsGood', 'Pride', 'Kappa', 'FrankerZ', 'HeyGuys', 'DansGame', 'EleGiggle', 'TriHard', 'Kreygasm', '4Head', 'SwiftRage', 'NotLikeThis', 'FailFish', 'VoHiYo', 'PJSalt', 'MrDestructoid', 'bday', 'RIPCheer', 'Shamrock'];
let cheerPrefixesRegExp = cheerPrefixes.map(x => new RegExp(x + "\\d+", "gi"))

class AlertPlayer {
    init: boolean = false;
    audioContext?: AudioContext;
    gainNode?: GainNode;
    silenceAudio?: HTMLAudioElement;
    silenceSource?: MediaElementAudioSourceNode;
    playing: boolean = false;
    paused: boolean = false;
    muted: boolean = false;
    queue: Event[] = [];
    index: number = 0;
    alertConfig: Record<string, EventAlertConfig> = {};
    preventBoxDisconnect?: (() => void) & _.Cancelable;
    config?: Config;
    currentlyPlaying?: Event;
    skipCurrent: boolean = false;

    constructor() {
        setInterval(() => this.checkQueue(), 1000);
    }

    initialize() {
        if (this.init) return;

        console.log('Alert system initialized');
        this.init = true;
        this.audioContext = new (window.AudioContext)();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 0;
        this.gainNode.connect(this.audioContext.destination);
        this.silenceAudio = new Audio(silence);
        this.silenceAudio.autoplay = true;
        this.silenceAudio.loop = true;

        this.silenceSource = this.audioContext.createMediaElementSource(this.silenceAudio);
        this.silenceSource.connect(this.gainNode);
    }

    async googleTTS(msg: string, channel: string, voice: string, state: string): Promise<string> {
        const params = new URLSearchParams({
            text: msg,
            state,
            voice,
            channel
        });
        const response = await fetch(`${BASE_URL}/tts/generate?${params}`);
        const data = await response.json();
        return data.audioContent;
    }

    async aiTTS(msg: string, channel: string, voice: string, state: string): Promise<string> {
        const params = new URLSearchParams({
            text: msg,
            state,
            voice,
            channel
        });
        const response = await fetch(`${BASE_URL}/tts/ai/generate?${params}`);
        const data = await response.json();
        return data.audioContent;
    }

    private ensureAudioContext() {
        if (!this.audioContext || this.audioContext.state === 'closed') {
            this.audioContext = new AudioContext();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
        } else if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    private preciseTimer(callback: () => void, delay: number) {
        const audioBuffer = this.audioContext!.createBuffer(1, this.audioContext!.sampleRate * delay / 1000, this.audioContext!.sampleRate);
        const source = this.audioContext!.createBufferSource();
        source.buffer = audioBuffer;
    
        source.onended = callback;
        source.connect(this.audioContext!.destination);
        source.start();
    }

    async playAudio(volume: number, audioInfo?: AudioInfo): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!audioInfo || this.skipCurrent) {
                resolve();
                return;
            }

            this.ensureAudioContext();
            
            const { audio, duration } = audioInfo;
            audio.volume = volume;
            
            this.preciseTimer(() => {
                this.silenceAudio!.src = silence;
                resolve();
            }, (duration * 1000) + 30);

            this.silenceAudio!.src = audio.src;

            audio.onerror = () => {
                this.silenceAudio!.src = silence;
                reject(new Error("Audio playback error"));
            };
        });
    }

    async getAudioInfo(src: string): Promise<AudioInfo | undefined> {
        return new Promise((resolve, reject) => {
            if (!src) {
                resolve(undefined);
                return;
            }
            const audio = new Audio(src);
            audio.onloadedmetadata = () => {
                resolve({
                    duration: audio.duration,
                    audio
                });
            };
            audio.onerror = () => {
                reject(new Error("Failed to load audio metadata"));
            };
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
        if (this.gainNode) this.gainNode.gain.value = 0;
    }

    unmute() {
        this.muted = false;
        if (this.gainNode) this.gainNode.gain.value = 1;
    }

    startPlaying() {
        this.skipCurrent = false;
        this.playing = true;
        if (this.gainNode) this.gainNode.gain.value = 1;
    }

    stopPlaying() {
        this.playing = false;
        this.paused = false;
        if (this.gainNode) this.gainNode.gain.value = 0;
    }

    skip() {
        this.skipCurrent = true;
        if (this.gainNode) this.gainNode.gain.value = 0;
    }

    cleanMessage(message: string) {
        return cheerPrefixesRegExp.reduce(
            (accumulator, prefix) => accumulator.replaceAll(prefix, ""),
            message
        );
    }

    getAudioFileData(reference: Base64FileReference, alertConfig: EventAlertConfig) {
        const file = alertConfig.data?.files[reference] as unknown as Base64File;
        if (file && file.data) {
            return 'data:audio/mp3;base64,' + file.data;
        }
        return "";
    }

    addNewChannels(channels: string[]) {
        const newChannels: string[] = [];
        channels.forEach(channel => {
            if (!this.alertConfig[channel]) {
                newChannels.push(channel);
            }
        });
        if (!newChannels.length) {
            return;
        }
        const state = localStorage.getItem('hehe-token_state') || '';
        fetch(BASE_URL + '/event/config?' + [['channels', newChannels.join(',')].join('='), ['state', state].join('=')].join('&')).then(res => res.json()).then(data => {
            newChannels.forEach(channel => {
                this.alertConfig[channel] = data[channel];
            });
        });
    }

    updateConfig(config: Config) {
        console.log('update config', config)
        this.config = config;
    }

    async tts(ttsMessage: string, channel: string, voice: string, voiceType: string, state: string) {
        
        const audioData = voiceType === 'ai' ? await this.aiTTS(ttsMessage, channel, voice, state) : await this.googleTTS(ttsMessage, channel, voice, state);
        if (!audioData) {
            return undefined;
        }
        return await this.getAudioInfo('data:audio/mp3;base64,' + audioData);
    }

    getAlert(event: Event, alertConfig: EventAlertConfig, config: Config): EventAlert | undefined {
        const eventMainType = EventTypeMapping[event.eventtype] as EventMainType;
        const alerts = alertConfig.data?.alerts[eventMainType];
        if (!alerts) {
            return undefined;
        }
        const exactAlerts: Record<number, EventAlert[]> = {};
        const minAlerts: Record<number, EventAlert[]> = {};
        const matchesAlerts: Record<string, EventAlert[]> = {};
        const conatinsAlerts: Record<string, EventAlert[]> = {};
        alerts.filter(a => !config.deactivatedAlerts[a.id]).forEach(alert => {
            if (alert.specifier.type === "exact" && alert.specifier.amount) {
                if (exactAlerts[alert.specifier.amount]) {
                    exactAlerts[alert.specifier.amount].push(alert)
                } else {
                    exactAlerts[alert.specifier.amount] = [alert];
                }
            }
            if (alert.specifier.type === "min" && alert.specifier.amount) {
                if (minAlerts[alert.specifier.amount]) {
                    minAlerts[alert.specifier.amount].push(alert)
                } else {
                    minAlerts[alert.specifier.amount] = [alert];
                }
            }
            if (alert.specifier.type === "matches" && alert.specifier.text) {
                if (matchesAlerts[alert.specifier.text]) {
                    matchesAlerts[alert.specifier.text].push(alert)
                } else {
                    matchesAlerts[alert.specifier.text] = [alert];
                }
            }
        });
        const exactAlertMatches = exactAlerts[event.amount || 0];
        if (exactAlertMatches && exactAlertMatches.length) {
            return _.sample(exactAlertMatches);
        }
        const minKeys = Object.keys(minAlerts).map(x => Number(x)).sort((a, b) => a - b);
        const step = minKeys.findLast(x => x <= (event.amount || 0));
        if (step) {
            return _.sample(minAlerts[step]);
        }
        const parts = event.text?.split('***') || [];
        if (parts.length >= 4) {
            const matchesAlertMatches = matchesAlerts[parts[3]];
            if (matchesAlertMatches && matchesAlertMatches.length) {
                return _.sample(matchesAlertMatches);
            }
        }
    }
 
    async showNotification(item: Event) {
        const alertConfig = this.alertConfig[item.channel];
        if (!alertConfig) {
            console.log('No alertconfig set');
            return;
        }
        const alert = this.getAlert(item, alertConfig, this.config!);

        if (!alert) {
            console.log('No alert for event', this.config, alertConfig, item);
            return;
        }

        console.log('Play alert with config', item, alert);

        _.templateSettings = {
            interpolate: /\{\{(.+?)\}\}/g
        };
        
        const template = _.template(alert.audio?.tts?.text || "");
        const vars:any = {
            username: item.username,
            usernameTo: item.usernameTo,
            amount: item.amount,
            amount2: item.amount2,
            text: parseMessage(item.text!).text
        };

        if (item.text && (item.text!.startsWith('donation***') || item.text!.startsWith('channelPointRedemption***'))) {
            vars.text = item.text!.split('***').slice(-1)[0];
        } else {
            if (vars.amount) {
                vars.amount = Number(vars.amount).toFixed(0);
            }
            if (vars.amount2) {
                vars.amount2 = Number(vars.amount2).toFixed(0);
            }
        }
        const state = localStorage.getItem('hehe-token_state') || '';
        this.startPlaying();
        console.log('Start playing');
        this.currentlyPlaying = item;
        const ttsMessage = this.cleanMessage(template(vars));
        try {
            const ttsAudio = (alert.audio?.tts && ttsMessage) ? await this.tts(ttsMessage, item.channel, alert.audio!.tts!.voiceSpecifier, alert.audio!.tts!.voiceType, state) : undefined;
            const jingleAudio = alert.audio?.jingle ? await this.getAudioInfo(this.getAudioFileData(alert.audio!.jingle!, alertConfig)) : undefined;

            console.log('Audio', ttsAudio, jingleAudio);
    
            const duration = (ttsAudio?.duration || 0) + (jingleAudio?.duration || 0);
            PubSub.publish('AlertPlayer-update', {duration});
            if (alert.visual) {
                const headline = _.template(alert.visual?.headline || "")(vars);
                const text = this.cleanMessage(_.template(alert.visual?.text || "")(vars));

                console.log('Visuell', text, headline);

                PubSub.publish('WSSEND', {type: 'alert', data: {image: alert.visual?.element, headline, text, duration: duration * 1000, channel: item.channel, position: alert.visual?.position, layout: alert.visual?.layout}});
            }
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

            this.playAudio(0.8, jingleAudio).then(() => this.playAudio(1.0, ttsAudio)).then(onEnd, onError);
        } catch (err) {
            console.error(err);
            this.stopPlaying();
        }

    }

    quequeLength(): number {
        return this.queue.length - this.index;
    }

    shouldBePlayed(item: Event): boolean {
        if (!this.config) {
            console.error('Adding event but config not set', item);
            return false;
        }
        const sbp = this.config!.playAlerts && this.config!.receivedShares.includes(item.channel) && this.config!.activatedShares.includes(item.channel);
        if (!sbp) {
            console.debug('Will not play alerts', this.config, item);
        }
        return sbp;
    }

    addEvent(item: Event) {
        console.log("Event added to the queue", item);
        this.queue.push(item);
    }
    
    checkQueue() {
        if (this.playing || this.paused || !this.config) {
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