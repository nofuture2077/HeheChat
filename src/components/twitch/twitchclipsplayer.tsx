import { useCallback, useRef } from 'react';
import { useViewportWidthCallback } from "../../commons/helper";
import { IconX } from '@tabler/icons-react';
import { ActionIcon } from '@mantine/core'

interface TwitchClipsPlayerProps {
    clipId: string;
    onClose: () => void;
}

export function getDimension() {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
    const w = Math.min(vw, 600);
    const h = (w / 16 * 9);
    return [w, h];
}

export function TwitchClipsPlayer({ clipId, onClose }: TwitchClipsPlayerProps) {
    const [w, h] = getDimension();
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle resize
    const handleResize = useCallback(() => {
        if (containerRef.current) {
            const [newW, newH] = getDimension();
            containerRef.current.style.width = `${newW}px`;
            containerRef.current.style.height = `${newH}px`;
            const iframe = containerRef.current.querySelector('iframe');
            if (iframe) {
                iframe.width = `${newW}`;
                iframe.height = `${newH}`;
            }
        }
    }, []);

    useViewportWidthCallback(handleResize);

    if (!clipId) return null;

    return (
        <div 
            ref={containerRef}
            style={{ 
                position: 'relative', 
                width: w, 
                height: h,
                margin: '0 auto' 
            }}
        >
            <iframe
                src={`https://clips.twitch.tv/embed?clip=${clipId}&parent=${window.location.hostname}&autoplay=true`}
                width={w}
                height={h}
                allowFullScreen={true}
                style={{ border: 'none' }}
            />
            <ActionIcon onClick={onClose} size={32} pos='absolute' top={10} right={10} variant='light'>
                <IconX/>
            </ActionIcon>
        </div>
    );
}
