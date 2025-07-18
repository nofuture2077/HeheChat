import { Text, Card, Badge, Group, Progress, ActionIcon } from '@mantine/core';
import { useState, useEffect, useContext, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { formatMinuteSeconds } from '@/commons/helper'
import { ChatEmotesContext } from '@/ApplicationContext'
import pinClasses from './pinmanager.module.css';
import pollClasses from './poll.module.css';
import { PinProps } from './pinmanager';
import { IconEyeOff } from '@tabler/icons-react';

interface PollProps extends PinProps {
    title: string;
    options: {
        title: string;
        totalVotes: number;
    }[];
    winningChoice?: {
        title: string;
        totalVotes: number;
    };
    state?: 'active' | 'ended';
}

export function Poll(props: PollProps) {
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

    if (remaining < 0 && props.state !== 'ended') {
      props.remove();
      return null;
    }

    const total = props.options.map(x => x.totalVotes).reduce((t, v) => t + v, 0);

    if (!props.expanded) {
      return <Card withBorder radius="md" p="md" ml="sm" mr="sm" mt={0} mb={0} onClick={() => props.pinsExpanded ? props.onClick() : props.toggleExpand()} className={pollClasses.poll}>
            <Group justify="space-between" align="center">
              <Group>
                  <span className={pinClasses.logo}>{emotes.getLogo(props.channel)}</span>
                  <Group gap="xs">
                      <Text fw={700}>Poll</Text>
                      <Text fw={900}>{props.title}</Text>
                  </Group>
              </Group>
              <Group>
                  {props.state === 'ended' ?  <Badge size="md" color='green'>Ended</Badge> : <Text fw={700}>{formatMinuteSeconds(remaining)}</Text>}
                  <ActionIcon variant="subtle" onClick={props.hide} color='primary'>
                      <IconEyeOff/>
                  </ActionIcon>
              </Group>
          </Group>
      </Card>
    }

    return <Card withBorder radius="md" p="md" ml="sm" mr="sm" mt={0} mb={0} onClick={() => props.pinsExpanded ? props.onClick() : props.toggleExpand()} className={pollClasses.poll}>
      <Group justify="space-between">
          <Group>
              <span className={pinClasses.logo}>{emotes.getLogo(props.channel)}</span>
              <Text fw={700}>Poll</Text>
          </Group>
          <Group>
              {props.state === 'ended' ?  <Badge size="md" color='green'>Ended</Badge> : <Text fw={700}>{formatMinuteSeconds(remaining)}</Text>}
              <ActionIcon variant="subtle" onClick={props.hide} color='primary'>
                  <IconEyeOff/>
              </ActionIcon>
          </Group>
      </Group>
      <Text ta="center" fw={700} size="lg" className={pollClasses.title}>
        {props.title}
      </Text>

      {props.options.map((opt) => {
        const progress = Math.ceil(100 * opt.totalVotes / total) || 0;
        const isWinner = props.state === 'ended' && props.winningChoice?.title === opt.title;
        
        return <div key={opt.title}>
          <Group justify="space-between" mt="xs">
              <Text fz="md"  fw="bold" c={isWinner ? 'green' : undefined}>
                {opt.title}
              </Text>
              <Text fz="md" fw="bold">
                {progress}%
              </Text>
          </Group>

          <Progress 
            value={progress} 
            radius="xl" size="xl"
            color={isWinner ? 'green' : 'grape'}
          />
        </div>
      })}

      <Group justify="space-between" mt="md">
        <Text fz="md">{total.toLocaleString()} votes</Text>
      </Group>
    </Card>
}
