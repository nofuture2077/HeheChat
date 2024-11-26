import { Text, Card, Badge, Group, Stack, ActionIcon } from '@mantine/core';
import { useState, useEffect, useContext } from 'react';
import { useInterval } from '@mantine/hooks';
import { formatMinuteSeconds } from '@/commons/helper'
import { ChatEmotesContext } from '@/ApplicationContext'
import pinClasses from './pinmanager.module.css';
import htClasses from './hypetrain.module.css';
import { PinProps } from './pinmanager';
import { IconEyeOff } from '@tabler/icons-react';

interface HypetrainProps extends PinProps {
    level: number;
    progress: number;
    goal: number;
    state?: 'active' | 'ended';
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

    if (remaining < 0 && props.state !== 'ended') {
      props.remove();
      return null;
    }

    return <Card withBorder radius="md" p="md" ml="lg" mr="lg" mt={0} mb={0} onClick={props.onClick} className={htClasses.hypetrain}>
      <div 
        style={{ width: `${100 - progress}%` }} 
        className={`${htClasses.progress} ${props.state === 'ended' ? htClasses.completed : ''}`}
      ></div>
      <Stack gap={0} className={htClasses.content}>
        <Group justify='space-between'>
          <Group gap='xs'>
            <span className={pinClasses.logo}>{emotes.getLogo(props.channel)}</span>
            <Text fw={900}>
              {props.state === 'ended' ? "Hype Train Completed!" : "Hype Train"}
            </Text>
            <Badge color={props.state === 'ended' ? "purple" : "pink"}>LVL {props.level}</Badge>
          </Group>
          <Group>
                {props.state === 'ended' ? (
                  <Badge color="purple" size="lg">FINAL</Badge>
                ) : (
                  <Text fw={700}>{formatMinuteSeconds(remaining)}</Text>
                )}
                <ActionIcon variant="subtle" onClick={props.hide} color='primary'>
                    <IconEyeOff/>
                </ActionIcon>
            </Group>
          
        </Group>
        <Group justify='space-between'>
          <Text fw={600}>
            {props.state === 'ended' ? 
              `Final Level ${props.level} Achieved!` : 
              'Help supporting the Hypetrain'
            }
          </Text>
          <Text fw={900} size='36px' className={props.state === 'ended' ? htClasses.completed : undefined}>
            {progress}%
          </Text>
        </Group>
      </Stack>
    </Card>
}