export interface Event {
    id: number;
    date: number;
    type: string;
    channelname: string;
    username: string;
    text?: string;
    amount?: number;
}