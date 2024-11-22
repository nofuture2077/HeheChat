import { Text, Card, Badge, Group } from '@mantine/core';
import { useState, useEffect, useContext } from 'react';
import { useInterval } from '@mantine/hooks';
import { formatMinuteSeconds } from '@/commons/helper'
import { ChatEmotesContext } from '@/ApplicationContext'
import pinClasses from './pinmanager.module.css';
import raidClasses from './raid.module.css';
import { Pin } from './pinmanager';

interface RaidProps extends Pin {
    broadcasterName: string;
    targetChannelName: string;
    viewers: number;
    onClick: () => void;
}

export function Raid(props: RaidProps) {
    const emotes = useContext(ChatEmotesContext);
    const [remaining, setRemaining] = useState<number>(Math.round((props.endTime.getTime() - new Date().getTime()) / 1000));
    const timer = useInterval(() => {
      const remaining = Math.round((props.endTime.getTime() - new Date().getTime()) / 1000);
      setRemaining(remaining);
    }, 1000);

    useEffect(() => {
      timer.start();
      return timer.stop;
    });

    if (remaining < 0) {
      props.remove();
      return null;
    }

    return <Card withBorder radius="md" p="md" ml="lg" mr="lg" mt={0} mb={0} onClick={props.onClick} className={raidClasses.raid}>
        <Group justify="space-between" align="center">
            <Group>
                <span className={pinClasses.logo}>{emotes.getLogo(props.channel)}</span>
                <div>
                    <Group gap="xs">
                        <Text fw={700}>{props.broadcasterName}</Text>
                        <Text c="dimmed">is raiding</Text>
                        <Text fw={700}>{props.targetChannelName}</Text>
                    </Group>
                    <Text c="dimmed" size="sm">{props.viewers.toLocaleString()} viewers</Text>
                </div>
            </Group>
            <Badge size="lg" variant="gradient" gradient={{ from: 'indigo', to: 'violet' }}>
                {formatMinuteSeconds(remaining)}
            </Badge>
        </Group>
    </Card>
}