import { Text, Card, Group, ActionIcon } from '@mantine/core';
import { useState, useEffect, useContext, useRef } from 'react';
import { formatMinuteSeconds } from '@/commons/helper'
import { ChatEmotesContext } from '@/ApplicationContext'
import pinClasses from './pinmanager.module.css';
import soClasses from './shoutout.module.css';
import { PinProps } from './pinmanager';
import { IconEyeOff } from '@tabler/icons-react';

interface ShoutoutProps extends PinProps {
    broadcasterName: string;
    targetUserName: string;
    viewerCount: number;
    moderatorName?: string;
}

export function Shoutout(props: ShoutoutProps) {
    const emotes = useContext(ChatEmotesContext);
    const [remaining, setRemaining] = useState<number>(Math.round((props.endTime.getTime() - new Date().getTime()) / 1000));
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
      // Clear any existing interval
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
      
      // Set up a new interval
      intervalRef.current = window.setInterval(() => {
        const remaining = Math.round((props.endTime.getTime() - new Date().getTime()) / 1000);
        setRemaining(remaining);
      }, 1000);
      
      // Clean up the interval when the component unmounts
      return () => {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [props.endTime]);

    if (remaining < 0) {
      props.remove();
      return null;
    }

    return <Card withBorder radius="md" p="md" ml="sm" mr="sm" mt={0} mb={0} onClick={props.onClick} className={soClasses.shoutout}>
        <Group justify="space-between" align="center">
            <Group>
                <span className={pinClasses.logo}>{emotes.getLogo(props.channel)}</span>
                <Group gap="xs">
                    <Text fw={700}>Shoutout to</Text>
                    <Text fw={700}>{props.targetUserName}</Text>
                </Group>
            </Group>
            <Group>
                <Text fw={700}>
                    {formatMinuteSeconds(remaining)}
                </Text>
                <ActionIcon variant="subtle" onClick={props.hide} color='primary'>
                    <IconEyeOff/>
                </ActionIcon>
            </Group>
        </Group>
    </Card>
}
