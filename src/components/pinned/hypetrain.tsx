import { Text, Card, Badge, Group, Stack } from '@mantine/core';
import { useState, useEffect, useContext } from 'react';
import { useInterval } from '@mantine/hooks';
import { formatMinuteSeconds } from '@/commons/helper'
import { ChatEmotesContext } from '@/ApplicationContext'
import classes from './pinmanager.module.css';

interface HypetrainProps {
    id: string;
    channel: string;
    level: number;
    progress: number;
    goal: number;
    endTime: Date;
    remove: () => void;
    onClick: () => void;
}

export function Hypetrain(props: HypetrainProps) {
    const emotes = useContext(ChatEmotesContext);
    const [remaining, setRemaining] = useState<number>(Math.round((props.endTime.getTime() - new Date().getTime()) / 1000));
    const timer = useInterval(() => {
      const remaining = Math.round((props.endTime.getTime() - new Date().getTime()) / 1000);
      setRemaining(remaining);
    }, 1000);
    const progress = (100 * props.progress / props.goal).toFixed(0);

    useEffect(() => {
      timer.start();
      return timer.stop;
    });

    if (remaining < 0) {
      props.remove();
      return null;
    }

    return <Card withBorder radius="md" p="md" ml="lg" mr="lg" mt={0} mb={0} onClick={props.onClick}>
    <Stack gap={0}>
      <Group justify='space-between'>
        <Group gap='xs'>
          <Badge>LVL {props.level}</Badge>
          <span className={classes.logo}>{emotes.getLogo(props.channel)}</span>
          <Text>Hype Train</Text>
        </Group>
        <Text>{formatMinuteSeconds(remaining)}</Text>
      </Group>
      <Group justify='space-between'>
        <Text>Help supporting the Hypetrain</Text>
        <Text fw={900} size='48px'>{progress}%</Text>
      </Group>
    </Stack>
  </Card>
}