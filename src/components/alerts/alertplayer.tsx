import { Event, EventAlertConfig, Base64FileReference, getAlert, Base64AudioFile } from "@/commons/events";
import _ from "underscore";

import { Config } from "@/commons/config";
import { parseMessage } from "@/commons/message";
import { silence } from "./silence";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

type Callback = () => undefined;
const EmptyFunction = () => { return undefined; }

class AlertPlayer {
    playing: boolean = false;
    paused: boolean = false;
    queue: Event[] = [];
    index: number = 0;
    alertConfig: Record<string, EventAlertConfig>= {};
    preventBoxDisconnect?: (() => void) & _.Cancelable;
    config?: Config;

    constructor() {
        setInterval(() => this.checkQueue(), 1000);

        this.initSilence();
    }

    textToSpeech(msg: string): Promise<string> {
        return fetch(BASE_URL + "/tts/generate?text=" + encodeURIComponent(msg)).then(data => data.json()).then(data => data.audioContent);
    }

    playAudio(src: string, startCB: Callback, endCB: Callback, minDuration: number, volume: number): undefined {
        if (!src) {
            startCB();
            endCB();
            return;
        }
        const audio = new Audio(src)
        audio.volume = volume || 1.0
    
        audio.onloadedmetadata = () => {
            const duration = audio.duration;
            startCB && startCB();
            audio.play().catch(() => {this.stopPlaying()});
            endCB && setTimeout(() => endCB(), Math.max(duration * 1000, minDuration || 0));
        };

        audio.onerror = () => {
            startCB && startCB();
            endCB && endCB();
        }
    }

    initSilence() {
        this.preventBoxDisconnect = _.debounce(() => this.playSilence(), 2*60*1000);
        this.preventBoxDisconnect();
    }

    playSilence() {
        console.log("Playing silence");
        this.playAudio('data:audio/mp3;base64,' + silence, () => this.startPlaying(), () => {this.stopPlaying();this.initSilence()}, 1000, 1);
    }
    
    playTTS(msg: string, startCB: Callback, endCB: Callback, minDuration: number, volume: number): undefined {
        this.textToSpeech(msg).then(audioContent => {
            this.playAudio('data:audio/mp3;base64,' + audioContent, startCB, endCB, minDuration, volume)
        });
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

    showNotification(item: Event) {
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
        const tts: Callback = alert.audio?.tts ? () => this.playTTS(template(vars), EmptyFunction, () => {this.stopPlaying()}, 7000, 1.0) : () => {this.stopPlaying()}
    
        alert.audio?.jingle ? this.playAudio(this.getAudioFileData(alert.audio?.jingle, alertConfig), EmptyFunction, tts, 0, 0.8) : tts();    
    }

    startPlaying(): undefined {
        this.playing = true;
    }

    stopPlaying(): undefined {
        this.playing = false;
    }

    pausePlaying(): undefined {
        this.paused = true;
    }

    unpausePlaying(): undefined {
        this.paused = false;
    }

    quequeLength(): number {
        return this.queue.length - this.index;
    }

    skip(): undefined {}

    addEvent(item: Event) {
        console.log("Event added to the queue", item);
        this.queue.push(item);
    }
    
    checkQueue() {
        if (this.playing) {
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