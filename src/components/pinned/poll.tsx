import { Text, Card, Badge, Group, Progress } from '@mantine/core';
import { useState, useEffect, useContext } from 'react';
import { useInterval } from '@mantine/hooks';
import { formatMinuteSeconds } from '@/commons/helper'
import { ChatEmotesContext } from '@/ApplicationContext'
import pinClasses from './pinmanager.module.css';
import pollClasses from './poll.module.css';
import { Pin } from './pinmanager';

interface PollProps extends Pin {
    title: string;
    options: {
        title: string;
        totalVotes: number;
    }[];
    winningChoice?: {
        title: string;
        totalVotes: number;
    };
    onClick: () => void;
    state?: 'active' | 'ended';
    final?: boolean;
}

export function Poll(props: PollProps) {
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

    if (remaining < 0 && props.state !== 'ended') {
      props.remove();
      return null;
    }

    const total = props.options.map(x => x.totalVotes).reduce((t, v) => t + v, 0);

    return <Card withBorder radius="md" p="md" ml="lg" mr="lg" mt={0} mb={0} onClick={props.onClick} className={pollClasses.poll}>
      <Text ta="center" fw={700} className={pollClasses.title}>
        {props.title}
      </Text>
      <Text ta="center" fz="sm" size='lg'>
        <span className={pinClasses.logo}>{emotes.getLogo(props.channel)}</span> {props.channel}
      </Text>

      {props.options.map((opt) => {
        const progress = Math.ceil(100 * opt.totalVotes / total) || 0;
        const isWinner = props.final && props.winningChoice?.title === opt.title;
        
        return <div key={opt.title}>
          <Group justify="space-between" mt="xs">
              <Text fz="md"  fw="bold" c={isWinner ? 'green' : undefined}>
                {opt.title} {isWinner && '(Winner!)'}
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
        <Badge size="md" color={props.final ? 'blue' : undefined}>
          {props.final ? 'Ended' : formatMinuteSeconds(remaining)}
        </Badge>
      </Group>
    </Card>
}