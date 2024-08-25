import { Event, EventAlertConfig, Base64FileReference, getAlert, Base64AudioFile } from "@/commons/events";
import _ from "underscore";

import { parseMessage } from "@/commons/message";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

type Callback = () => undefined;
const EmptyFunction = () => { return undefined; }

class AlertPlayer {
    playing: boolean = false;
    queue: Event[] = [];
    index: number = 0;
    config: Record<string, EventAlertConfig>= {};
    voice?: SpeechSynthesisVoice;

    constructor() {
        setInterval(() => this.checkQueue(), 1000)

        window.speechSynthesis.onvoiceschanged = () => {
            const voices = window.speechSynthesis.getVoices().filter(x => x.lang === 'de-DE');
            this.voice = _.sample(voices);
        };
    }

    textToSpeech(msg: string): Promise<string> {
        return fetch(BASE_URL + "/tts/generate?text=" + encodeURIComponent(msg)).then(data => data.json()).then(data => data.audioContent);
    }

    playAudio(src: string, startCB: Callback, endCB: Callback, minDuration: number, volume: number): undefined {
        !src && (startCB() && endCB());
        const audio = new Audio(src)
        audio.volume = volume || 1.0
    
        audio.onloadedmetadata = () => {
            const duration = audio.duration;
            startCB && startCB();
            audio.play();
            endCB && setTimeout(() => endCB(), Math.max(duration * 1000, minDuration || 0));
        };

        audio.onerror = () => {
            startCB && startCB();
            endCB && endCB();
        }
    }

    playTTS2(msg: string, startCB: Callback, endCB: Callback, minDuration: number, volume: number): undefined {
        startCB && startCB();
        const utterance = new SpeechSynthesisUtterance(msg);

        utterance.lang = 'de-DE';
        utterance.pitch = 1;
        utterance.rate = 1; 
        utterance.voice = this.voice ? this.voice : utterance.voice;

        utterance.onend = function(event) {
            endCB && endCB();
        };

        window.speechSynthesis.speak(utterance);
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
            if (!this.config[channel]) {
                newChannels.push(channel);
            }
        });
        if (!newChannels.length) {
            return;
        }

        fetch(BASE_URL + '/event/config?' + [['channels', newChannels.join(',')].join('=')].join('&')).then(res => res.json()).then(data => {
            newChannels.forEach(channel => {
                this.config[channel] = data[channel];
            });
        });
    }

    showNotification(item: Event) {
        const alertConfig = this.config[item.channel];
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
        
        this.playing = true;
        const tts: Callback = alert.audio?.tts ? () => this.playTTS(template(vars), EmptyFunction, () => {this.playing = false}, 7000, 1.0) : () => {this.playing = false}
    
        alert.audio?.jingle ? this.playAudio(this.getAudioFileData(alert.audio?.jingle, alertConfig), EmptyFunction, tts, 0, 0.8) : tts();    
    }

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
        this.showNotification(item);
    }
}

export const AlertSystem = new AlertPlayer();