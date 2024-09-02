import { Stack, Group, ActionIcon, Progress, Text } from "@mantine/core";
import { IconPlayerPlayFilled, IconPlayerPauseFilled, IconVolume, IconPlayerTrackNextFilled, IconVolume3 } from "@tabler/icons-react";
import { AlertSystem } from "@/components/alerts/alertplayer";
import { useEffect, useState } from "react";
import { useInterval, useForceUpdate } from "@mantine/hooks";
import PubSub from "pubsub-js";
import { formatSeconds } from "@/commons/helper"
import { formatEventText } from "@/components/events/eventdrawer"

export interface AlertControlProps {}

export function AlertControl(props: AlertControlProps) {
    const [runTime, setRuntime] = useState<number>(0);
    const [text, setText] = useState<string>('Not playing.');
    const [seconds, setSeconds] = useState<number>(0);
    const timer = useInterval(() => setSeconds(seconds + (playing ? 0.2 : 0)), 200);
    const forceUpdate = useForceUpdate();

    useEffect(() => {
        const updateSub = PubSub.subscribe('AlertPlayer-update', (msg, data) => {
            if (data) {
                timer.start();
                setSeconds(0);
                setRuntime(data.duration);
                const item = AlertSystem.currentlyPlaying;
                setText(item ? item.username + " - " + formatEventText(item) : 'Not playing.');
            } else {
                timer.stop();
                setRuntime(0);
                setSeconds(0);
                setText('Not playing.');
            }
        });
        return () => {
            PubSub.unsubscribe(updateSub);
        }
    }, []);

    const playing = AlertSystem.playing && !AlertSystem.paused;
    const muted = AlertSystem.muted;

    return <Stack p={10} style={{borderBottom: "1px solid gray"}}>
        <Text ta="center" c="dimmed" lineClamp={2} h={50}>{text}</Text>
        <Group justify="space-between">
            <span></span>
            <ActionIcon variant="subtle" onClick={() => {
                muted ? AlertSystem.unmute() : AlertSystem.mute();
                forceUpdate();
                }} size={32}>{muted ? <IconVolume3/> : <IconVolume/>}</ActionIcon>
            <ActionIcon variant="light" onClick={() => playing ? AlertSystem.pause() : AlertSystem.resume()}size={48}>{playing ? <IconPlayerPauseFilled/> : <IconPlayerPlayFilled/>}</ActionIcon>
            <ActionIcon variant="subtle" onClick={() => AlertSystem.skip()}><IconPlayerTrackNextFilled/></ActionIcon>
            <span></span>
        </Group>
        <Group justify="space-between">
            <><span>{formatSeconds(seconds)}</span>
            <Progress value={runTime ? (100 / runTime * seconds) : 0} flex={1}></Progress>
            <span>{formatSeconds(runTime)}</span></>
        </Group>
    </Stack>
}