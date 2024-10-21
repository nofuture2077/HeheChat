import ReactTwitchEmbedVideo from "react-twitch-embed-video"
import { useViewportSize } from '@mantine/hooks';
import { useContext, useEffect, useState } from "react";
import { ConfigContext } from "@/ApplicationContext";

interface TwitchPlayerProps {
}

export function TwitchPlayer(props: TwitchPlayerProps) {
    const config = useContext(ConfigContext);
    const [w, setW] = useState<number>(0);
   
    const h = (w / 16 * 9);
    const channel = config.getChatChannel();
    const { width } = useViewportSize();

    useEffect(() => {
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
        const w = Math.min(vw, 600);
        setW(w)
    }, []);
    return channel && w ? <ReactTwitchEmbedVideo channel={channel} layout="video" muted width={w} height={h}/> : null;
}