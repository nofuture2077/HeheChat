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
    playing: boolean = false;
    paused: boolean = false;
    muted: boolean = false;
    queue: Event[] = [];
    index: number = 0;
    alertConfig: Record<string, EventAlertConfig> = {};
    preventBoxDisconnect?: (() => void) & _.Cancelable;
    config?: Config;
    audio?: HTMLAudioElement;
    currentlyPlaying?: Event;
    skipCurrent: boolean = false;
    oldVolume?: number;

    constructor() {
        setInterval(() => this.checkQueue(), 1000);

        this.initSilence();
    }

    async googleTTS(msg: string, channel: string, voice: string, state: string): Promise<string> {
        const params = [
            ['text', encodeURIComponent(msg)].join('='), 
            ['state', state].join('='), 
            ['voice', voice].join('='), 
            ['channel', channel].join('=')
        ].join('&')
        return fetch(BASE_URL + "/tts/generate?" + params).then(data => data.json()).then(data => data.audioContent);
    }

    async aiTTS(msg: string, channel: string, voice: string, state: string): Promise<string> {
        const params = [
            ['text', encodeURIComponent(msg)].join('='), 
            ['state', state].join('='), 
            ['voice', voice].join('='), 
            ['channel', channel].join('=')
        ].join('&')
        return fetch(BASE_URL + "/tts/ai/generate?" + params).then(data => data.json()).then(data => data.audioContent);
    }

    async playAudio(volume: number, audioInfo?: AudioInfo): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!audioInfo || this.skipCurrent) {
                resolve();
                return;
            }
            this.audio = audioInfo.audio;
            audioInfo.audio.volume = volume;

            if (this.muted) {
                this.audio.volume = 0;
                this.audio.muted = true;
            }
        
            audioInfo.audio.onended = () => resolve();
            audioInfo.audio.onerror = reject;
            audioInfo.audio.play().catch(reject);
        });
    }

    async getAudioInfo(src: string): Promise<AudioInfo | undefined> {
        return new Promise((resolve, reject) => {
            if (!src) {
                Promise.resolve();
            }
            const audio = new Audio(src)
            audio.onloadedmetadata = () => {
                resolve({
                    duration: audio.duration,
                    audio: audio
                });
            }

            audio.onerror = (err) => {
                reject("Audio analyses error: " + err);
            }
        });
    }

    pause() {
        this.paused = true;
        if (this.audio) {
            this.audio.pause();
        }
    }

    resume() {
        this.paused = false;
        if (this.audio) {
            this.audio.play();
        }
    }

    mute() {
        this.muted = true;
        if (this.audio) {
            this.oldVolume = this.audio.volume;
            this.audio.volume = 0;
            this.audio.muted = true;
        }
    }

    unmute() {
        this.muted = false;
        if (this.audio) {
            this.audio.volume = this.oldVolume!;
            this.audio.muted = false;
        }
    }

    startPlaying(): undefined {
        this.skipCurrent = false;
        this.playing = true;
    }

    stopPlaying(): undefined {
        this.playing = false;
        this.paused = false;
        this.audio = undefined;
    }

    skip(): undefined {
        this.skipCurrent = true;
        if (this.audio) {
            this.audio.currentTime = this.audio.duration;
        }
    }

    initSilence() {
        this.preventBoxDisconnect = _.debounce(() => this.playSilence(), 2*60*1000);
        this.preventBoxDisconnect();
    }

    async playSilence() {
        if (this.config?.playAlerts) {
            console.log("Playing silence");
            return this.playAudio(1.0, await this.getAudioInfo('data:audio/mp3;base64,' + silence));
        }
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
        alerts.filter(a => !config.deactivatedAlerts[a.id]).forEach(alert => {
            if (alert.specifier.type === "exact") {
                if (exactAlerts[alert.specifier.amount]) {
                    exactAlerts[alert.specifier.amount].push(alert)
                } else {
                    exactAlerts[alert.specifier.amount] = [alert];
                }
            }
            if (alert.specifier.type === "min") {
                if (minAlerts[alert.specifier.amount]) {
                    minAlerts[alert.specifier.amount].push(alert)
                } else {
                    minAlerts[alert.specifier.amount] = [alert];
                }
            }
        });
        const exactAlertMatches = exactAlerts[event.amount || 0];
        if (exactAlertMatches && exactAlertMatches.length) {
            return _.sample(exactAlertMatches);
        }
        const minKeys = Object.keys(minAlerts).map(x => Number(x)).sort((a, b) => a - b);
        const step = minKeys.findLast(x => x <= (event.amount || 0));
        if (!step) {
            return undefined;
        }
        return _.sample(minAlerts[step]);
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

        if (vars.text && vars.text.startsWith('donation')) {
            vars.text = vars.text.split('***').slice(-1)[0];
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
        this.currentlyPlaying = item;
        const ttsMessage = this.cleanMessage(template(vars));
        try {
            const ttsAudio = (alert.audio?.tts && ttsMessage) ? await this.tts(ttsMessage, item.channel, alert.audio!.tts!.voiceSpecifier, alert.audio!.tts!.voiceType, state) : undefined;
            const jingleAudio = alert.audio?.jingle ? await this.getAudioInfo(this.getAudioFileData(alert.audio!.jingle!, alertConfig)) : undefined;
    
            const duration = (ttsAudio?.duration || 0) + (jingleAudio?.duration || 0);
            PubSub.publish('AlertPlayer-update', {duration});
            if (alert.visual) {
                const headline = _.template(alert.visual?.headline || "")(vars);
                const text = this.cleanMessage(_.template(alert.visual?.text || "")(vars));
                PubSub.publish('WSSEND', {type: 'alert', data: {image: alert.visual?.element, headline, text, duration: duration * 1000, channel: item.channel, position: alert.visual?.position, layout: alert.visual?.layout}});
            }
            const onEnd = () => {
                this.stopPlaying();
                PubSub.publish('AlertPlayer-update');
            }
            this.playAudio(0.8, jingleAudio).then(() => this.playAudio(1.0, ttsAudio)).then(onEnd, onEnd);
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
        this.preventBoxDisconnect!();
        this.showNotification(item);
    }
}

export const AlertSystem = new AlertPlayer();