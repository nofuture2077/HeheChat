import { Text, Card, Badge, Group, Stack } from '@mantine/core';
import { useState, useEffect, useContext } from 'react';
import { useInterval } from '@mantine/hooks';
import { formatMinuteSeconds } from '@/commons/helper'
import { ChatEmotesContext } from '@/ApplicationContext'
import pinClasses from './pinmanager.module.css';
import htClasses from './hypetrain.module.css';
import { Pin } from './pinmanager';

interface HypetrainProps extends Pin {
    level: number;
    progress: number;
    goal: number;
    onClick: () => void;
}

export function Hypetrain(props: HypetrainProps) {
    const emotes = useContext(ChatEmotesContext);
    const [remaining, setRemaining] = useState<number>(Math.round((props.endTime.getTime() - new Date().getTime()) / 1000));
    const timer = useInterval(() => {
      const remaining = Math.round((props.endTime.getTime() - new Date().getTime()) / 1000);
      setRemaining(remaining);
    }, 1000);
    const progress = Math.ceil(100 * props.progress / props.goal);

    useEffect(() => {
      timer.start();
      return timer.stop;
    });

    if (remaining < 0) {
      props.remove();
      return null;
    }

    return <Card withBorder radius="md" p="md" ml="lg" mr="lg" mt={0} mb={0} onClick={props.onClick} className={htClasses.hypetrain}>
      <div style={{ width: `${100 - progress}%` }} className={htClasses.progress}></div>
    <Stack gap={0} className={htClasses.content}>
      <Group justify='space-between'>
        <Group gap='xs'>
          <Badge>LVL {props.level}</Badge>
          <span className={pinClasses.logo}>{emotes.getLogo(props.channel)}</span>
          <Text fw={900}>Hype Train</Text>
        </Group>
        <Text>{formatMinuteSeconds(remaining)}</Text>
      </Group>
      <Group justify='space-between'>
        <Text fw={600}>Help supporting the Hypetrain</Text>
        <Text fw={900} size='36px'>{progress}%</Text>
      </Group>
    </Stack>
  </Card>
}