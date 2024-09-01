import { Stack, Group, ActionIcon, Progress } from "@mantine/core";
import { IconPlayerPlayFilled, IconPlayerPauseFilled, IconPlayerTrackPrevFilled, IconPlayerTrackNextFilled, IconVolume3 } from "@tabler/icons-react";
import { AlertSystem } from "@/components/alerts/alertplayer";
import { useEffect, useState } from "react";
import { useInterval } from "@mantine/hooks";
import PubSub from "pubsub-js";
import { formatSeconds } from "@/commons/helper"

export interface AlertControlProps {}

export function AlertControl(props: AlertControlProps) {
    const [runTime, setRuntime] = useState<number>(0);
    const [seconds, setSeconds] = useState<number>(0);
    const timer = useInterval(() => setSeconds(seconds + (playing ? 0.2 : 0)), 200);

    useEffect(() => {
        const updateSub = PubSub.subscribe('AlertPlayer-update', (msg, data) => {
            if (data) {
                timer.start();
                setSeconds(0);
                setRuntime(data.duration);
            } else {
                timer.stop();
                setRuntime(0);
                setSeconds(0);
            }
        });
        return () => {
            PubSub.unsubscribe(updateSub);
        }
    }, []);

    const playing = AlertSystem.playing && !AlertSystem.paused;

    return <Stack p={10}>
        <Group justify="space-between">
            <span></span>
            <ActionIcon variant="subtle" size={32}><IconVolume3/></ActionIcon>
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