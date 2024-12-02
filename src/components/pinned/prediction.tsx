import { Text, Card, Badge, Group, Progress, ActionIcon } from '@mantine/core';
import { useState, useEffect, useContext } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useInterval } from '@mantine/hooks';
import { formatMinuteSeconds } from '@/commons/helper'
import { ChatEmotesContext } from '@/ApplicationContext'
import pinClasses from './pinmanager.module.css';
import predictionClasses from './prediction.module.css';
import { PinProps } from './pinmanager';
import { IconEyeOff } from '@tabler/icons-react';

interface Outcome {
  title: string;
  users: number;
  channelPoints: number;
}

interface PredictionProps extends PinProps {
    title: string;
    outcomes: Outcome[];
    winningOutcome?: Outcome;
    state?: 'active' | 'ended';
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

    if (remaining < 0 && props.state !== 'ended') {
      props.remove();
      return null;
    }

    const total = props.outcomes.map(x => x.channelPoints).reduce((t, v) => t + v, 0);

    if (!props.expanded) {
      return <Card withBorder radius="md" p="md" ml="sm" mr="sm" mt={0} mb={0} onClick={() => props.pinsExpanded ? props.onClick() : props.toggleExpand()} className={predictionClasses.prediction}>
            <Group justify="space-between">
              <Group>
                  <span className={pinClasses.logo}>{emotes.getLogo(props.channel)}</span>
                  <Group>
                      <Text fw={700}>Prediction</Text>
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

    return <Card withBorder radius="md" p="md" ml="sm" mr="sm" mt={0} mb={0} onClick={() => props.pinsExpanded ? props.onClick() : props.toggleExpand()} className={predictionClasses.prediction}>
      <Group justify="space-between">
          <Group>
              <span className={pinClasses.logo}>{emotes.getLogo(props.channel)}</span>
              <Text fw={700}>Prediction</Text>
          </Group>
          <Group>
              {props.state === 'ended' ?  <Badge size="md" color='green'>Ended</Badge> : <Text fw={700}>{formatMinuteSeconds(remaining)}</Text>}
              <ActionIcon variant="subtle" onClick={props.hide} color='primary'>
                  <IconEyeOff/>
              </ActionIcon>
          </Group>
      </Group>
      <Text ta="center" size='lg' fw={700} className={predictionClasses.title}>
        {props.title}
      </Text>
      {props.outcomes.map((opt) => {
        const progress = Math.ceil(100 * opt.channelPoints / total) || 0;
        const isWinner = props.state === 'ended' && props.winningOutcome?.title === opt.title;
        
        return <div key={opt.title}>
          <Group justify="space-between" mt="xs">
              <Text fz="md" fw="bold" c={isWinner ? 'green' : undefined}>
                {opt.title} {isWinner && '(Winner!)'}
              </Text>
              <Text fz="md" fw="bold">
                {progress}%
              </Text>
          </Group>

          <Progress 
            value={progress} 
            radius="xl" size="xl"
            color={isWinner ? 'green' : 'orange'}
          />
        </div>
      })}

      <Group justify="space-between" mt="md">
        <Text fz="md">{total.toLocaleString()} points</Text>        
      </Group>
     
    </Card>
}