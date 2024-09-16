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
    const [seconds, setSeconds] = useState<number>(0);
    const [paused, setPaused] = useState<boolean>(AlertSystem.paused);
    const [text, setText] = useState<string>('');
    const timer = useInterval(() => setSeconds(seconds + (!paused ? 0.2 : 0)), 200);
    const forceUpdate = useForceUpdate();

    useEffect(() => {
        const updateSub = PubSub.subscribe('AlertPlayer-update', (msg, data) => {
            const playText = paused ? 'Paused' : 'Not Playing';
            if (data) {
                timer.start();
                setSeconds(0);
                setRuntime(data.duration);
                const item = AlertSystem.currentlyPlaying;
                setText(item ? item.username + " - " + formatEventText(item) : playText);
            } else {
                timer.stop();
                setRuntime(0);
                setSeconds(0);
                setText(playText);
            }
        });
        return () => {
            PubSub.unsubscribe(updateSub);
        }
    }, []);

    useEffect(() => {
        paused ? AlertSystem.pause() : AlertSystem.resume();
        const playText = paused ? 'Paused' : 'Not Playing';
        setText(playText);
    }, [paused])

    const muted = AlertSystem.muted;

    return <Stack p={10} style={{borderBottom: "1px solid gray"}}>
        <Text ta="center" c="dimmed" lineClamp={2} h={50} style={{maxWidth: 'unset', width: '100%'}}>{text}</Text>
        <Group justify="space-between">
            <span></span>
            <ActionIcon variant="subtle" onClick={() => {
                muted ? AlertSystem.unmute() : AlertSystem.mute();
                forceUpdate();
                }} size={32}>{muted ? <IconVolume3/> : <IconVolume/>}</ActionIcon>
            <ActionIcon variant="light" onClick={() => !paused ? setPaused(true) : setPaused(false)} size={48}>{!paused ? <IconPlayerPauseFilled/> : <IconPlayerPlayFilled/>}</ActionIcon>
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