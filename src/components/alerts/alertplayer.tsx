import { Event, EventAlertConfig, Base64FileReference, getAlert, Base64AudioFile } from "@/commons/events";
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
    alertConfig: Record<string, EventAlertConfig>= {};
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

    async textToSpeech(msg: string): Promise<string> {
        return fetch(BASE_URL + "/tts/generate?text=" + encodeURIComponent(msg)).then(data => data.json()).then(data => data.audioContent);
    }

    async playAudio(volume: number, audioInfo?: AudioInfo): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!audioInfo || this.skipCurrent) {
                resolve();
                return;
            }
            this.audio = audioInfo.audio;
            audioInfo.audio.volume = this.muted ? 0 : volume;
        
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
        if (this.audio) {
            this.audio.pause();
            this.paused = true;
        }
    }

    resume() {
        if (this.audio) {
            this.audio.play();
            this.paused = false;
        }
    }

    mute() {
        this.muted = true;
        if (this.audio) {
            this.oldVolume = this.audio.volume;
            this.audio.volume = 0;
        }
    }

    unmute() {
        this.muted = false;
        if (this.audio) {
            this.audio.volume = this.oldVolume!;
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
        console.log("Playing silence");
        return this.playAudio(1.0, await this.getAudioInfo('data:audio/mp3;base64,' + silence));
    }

    cleanMessage(message: string) {
        return cheerPrefixesRegExp.reduce(
            (accumulator, prefix) => accumulator.replaceAll(prefix, ""),
            message
        );
    }

    getAudioFileData(reference: Base64FileReference, alertConfig: EventAlertConfig) {
        const file = alertConfig.data?.files[reference] as unknown as Base64AudioFile;
        if (file && file.audio) {
            return 'data:audio/mp3;base64,' + file.audio.data;
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

        fetch(BASE_URL + '/event/config?' + [['channels', newChannels.join(',')].join('=')].join('&')).then(res => res.json()).then(data => {
            newChannels.forEach(channel => {
                this.alertConfig[channel] = data[channel];
            });
        });
    }

    updateConfig(config: Config) {
        this.config = config;
    }
 
    async showNotification(item: Event) {
        const alertConfig = this.alertConfig[item.channel];
        const alert = getAlert(item, alertConfig);

        if (!alert) {
            return;
        }

        _.templateSettings = {
            interpolate: /\{\{(.+?)\}\}/g
        };
        
        const template = _.template(alert.audio?.tts?.text || "");
        const vars = {
            username: item.username,
            amount: item.amount,
            text: parseMessage(item.text!).text
        };
        
        this.startPlaying();
        this.currentlyPlaying = item;
        const ttsAudio = alert.audio?.tts ? await this.getAudioInfo('data:audio/mp3;base64,' + await this.textToSpeech(this.cleanMessage(template(vars)))) : undefined;
        const jingleAudio = alert.audio?.jingle ? await this.getAudioInfo(this.getAudioFileData(alert.audio!.jingle!, alertConfig)) : undefined;

        const duration = (ttsAudio?.duration || 0) + (jingleAudio?.duration || 0);
        PubSub.publish('AlertPlayer-update', {duration});
        const onEnd = () => {
            this.stopPlaying();
            PubSub.publish('AlertPlayer-update');
        }
        this.playAudio(0.8, jingleAudio).then(() => this.playAudio(1.0, ttsAudio)).then(onEnd, onEnd);
    }

    quequeLength(): number {
        return this.queue.length - this.index;
    }

    addEvent(item: Event) {
        console.log("Event added to the queue", item);
        this.queue.push(item);
    }
    
    checkQueue() {
        if (this.playing || this.paused) {
            return;
        }
    
        const queuelength = this.queue.length;
    
        while (this.index + 3 < queuelength) {
            // skip follow bot
            if (this.queue[this.index].eventtype !== "follow") break;
            console.log('skip', this.queue[this.index]);
            this.index++;
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