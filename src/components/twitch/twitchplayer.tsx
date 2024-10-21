import ReactTwitchEmbedVideo from "react-twitch-embed-video"
import { useViewportSize } from '@mantine/hooks';
import { useContext } from "react";
import { ConfigContext } from "@/ApplicationContext";

interface TwitchPlayerProps {
}

export function TwitchPlayer(props: TwitchPlayerProps) {
    const config = useContext(ConfigContext);
    const { width } = useViewportSize();
    const w = Math.min(width || 600, 600);
    const h = (w / 16 * 9);
    const channel = config.getChatChannel();
    return channel ? <ReactTwitchEmbedVideo channel={channel} layout="video" muted width={w} height={h}/> : null;
}