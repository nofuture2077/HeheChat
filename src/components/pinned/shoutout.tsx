import { Text, Card, Badge, Group } from '@mantine/core';
import { useState, useEffect, useContext } from 'react';
import { useInterval } from '@mantine/hooks';
import { formatMinuteSeconds } from '@/commons/helper'
import { ChatEmotesContext } from '@/ApplicationContext'
import pinClasses from './pinmanager.module.css';
import soClasses from './shoutout.module.css';
import { Pin } from './pinmanager';

interface ShoutoutProps extends Pin {
    broadcasterName: string;
    targetUserName: string;
    viewerCount: number;
    moderatorName?: string;
    onClick: () => void;
}

export function Shoutout(props: ShoutoutProps) {
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

    return <Card withBorder radius="md" p="md" ml="lg" mr="lg" mt={0} mb={0} onClick={props.onClick} className={soClasses.shoutout}>
        <Group justify="space-between" align="center">
            <Group>
                <span className={pinClasses.logo}>{emotes.getLogo(props.channel)}</span>
                <div>
                    <Group gap="xs">
                        {props.moderatorName ? (
                            <>
                                <Text fw={700}>{props.moderatorName}</Text>
                                <Text c="dimmed">shouted out</Text>
                            </>
                        ) : (
                            <Text c="dimmed">Shoutout to</Text>
                        )}
                        <Text fw={700}>{props.targetUserName}</Text>
                    </Group>
                    <Text c="dimmed" size="sm">{props.viewerCount.toLocaleString()} viewers in chat</Text>
                </div>
            </Group>
            <Badge size="lg" variant="gradient" gradient={{ from: 'cyan', to: 'teal' }}>
                {formatMinuteSeconds(remaining)}
            </Badge>
        </Group>
    </Card>
}
