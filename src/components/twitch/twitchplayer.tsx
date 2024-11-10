import ReactTwitchEmbedVideo from "react-twitch-embed-video"
import { useContext, useState } from "react";
import { ConfigContext } from "@/ApplicationContext";
import { useViewportWidthCallback } from '@/commons/helper'

export function getDimension() {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
    const w = Math.min(vw, 600);
    const h = (w / 16 * 9);

    return [w, h];
}

interface TwitchPlayerProps {
}

export function TwitchPlayer(props: TwitchPlayerProps) {
    const config = useContext(ConfigContext);
    const [w, setW] = useState<number>(0);
    const [h, setH] = useState<number>(0);
   
    const channel = config.getChatChannel();

    useViewportWidthCallback((width) => {
        const [w, h] = getDimension();
        setW(w);
        setH(h);
    });
    return channel && w ? <ReactTwitchEmbedVideo channel={channel} layout="video" muted width={w} height={h}/> : null;
}