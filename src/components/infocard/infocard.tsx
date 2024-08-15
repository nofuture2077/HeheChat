import { Group, Text, Card, Skeleton } from '@mantine/core';
import classes from './infocard.module.css';
import { ReactComponentLike, ReactElementLike } from 'prop-types';
import { useContext } from 'react';
import { ChatEmotesContext } from '@/ApplicationContext';

export interface InfoCardProperties {
  channel?: string;
  name: string; 
  text: string;
  component: ReactComponentLike;
  left?: ReactElementLike;
  right?: ReactElementLike;
}

export function InfoCard(props: InfoCardProperties) {
  const emotes = useContext(ChatEmotesContext);
  return (
    <props.component className={classes.card}>
      
      <Group flex={1} gap='xs'>
      {props.channel ? <span key='infocard-channel' className={classes.channel}>{emotes.getLogo(props.channel)}</span> : null}
      {props.left || null}

        <div style={{ flex: 1 }}>
          <Text size="sm" fw={700}>
            {props.name}
          </Text>

          <Text c="dimmed" size="xs" fw={500}>
            {props.text}
          </Text>
        </div>

        {props.right || null}
      </Group>
    </props.component>
  );
}

export function InfoCardSkeleton() {
  return (
    <Card className={classes.card}>
      <Group flex={1}>
        <Skeleton h={32} w={32} radius='xl'/>
        <div style={{ flex: 1 }}>
          <Skeleton h='1rem' />

          <Skeleton h='1rem' />
        </div>
      </Group>
    </Card>
  );
}