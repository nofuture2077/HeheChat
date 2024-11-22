import { Text, Card, Badge, Group, Progress } from '@mantine/core';
import { useState, useEffect, useContext } from 'react';
import { useInterval } from '@mantine/hooks';
import { formatMinuteSeconds } from '@/commons/helper'
import { ChatEmotesContext } from '@/ApplicationContext'
import pinClasses from './pinmanager.module.css';
import predictionClasses from './prediction.module.css';
import { Pin } from './pinmanager';

interface Outcome {
  title: string;
  users: number;
  channelPoints: number;
}

interface PredictionProps extends Pin {
    title: string;
    outcomes: Outcome[];
    winningOutcome?: Outcome;
    onClick: () => void;
}

export function Prediction(props: PredictionProps) {
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

    const total = props.outcomes.map(x => x.channelPoints).reduce((t, v) => t + v, 0);

    return <Card withBorder radius="md" p="md" ml="lg" mr="lg" mt={0} mb={0} onClick={props.onClick} className={predictionClasses.prediction}>
      <Text ta="center" fw={700} className={predictionClasses.title}>
        {props.title}
      </Text>
      <Text c="dimmed" ta="center" fz="sm">
        <span className={pinClasses.logo}>{emotes.getLogo(props.channel)}</span> {props.channel}
      </Text>

      {props.outcomes.map((opt) => {
        const progress = Math.ceil(100 * opt.channelPoints / total) || 0;
        return <>
        <Group justify="space-between" mt="xs">
            <Text fz="sm" c="dimmed">
            {opt.title}
            </Text>
            <Text fz="sm" c="dimmed">
            {progress}%
            </Text>
        </Group>

        <Progress value={progress} mt={5} />
      </>})}


      <Group justify="space-between" mt="md">
        <Text fz="sm">{total}</Text>
        <Badge size="sm">{formatMinuteSeconds(remaining)}</Badge>
      </Group>
  </Card>
}