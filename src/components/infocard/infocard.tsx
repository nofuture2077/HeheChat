import { Group, Text, Card, Skeleton, Stack } from '@mantine/core';
import classes from './infocard.module.css';
import { ReactComponentLike, ReactElementLike } from 'prop-types';
import { useContext } from 'react';
import { ChatEmotesContext } from '@/ApplicationContext';
import { timeSince } from '@/commons/helper'

export interface InfoCardProperties {
  channel?: string;
  name: string; 
  text: string;
  date: number;
  left?: ReactElementLike;
  right?: ReactElementLike;
  onClick?: () => void;
}

export function InfoCard(props: InfoCardProperties) {
  const emotes = useContext(ChatEmotesContext);
  return (
     <Group className={classes.card} onClick={props.onClick} gap="xs" p={10} justify='space-between'>
      {props.channel ? <span key='infocard-channel' className={classes.channel}>{emotes.getLogo(props.channel)}</span> : null}
      {props.left || null}
        <Stack gap={0} style={{flexGrow: 5}}>
          <Group justify='space-between'>
            <Text size="sm" fw={700} className={classes.username}>
              {props.name}
            </Text>
            <Text fw={500} c="dimmed" size="sm">
              {timeSince(props.date)}
            </Text>
          </Group>


          <Text>{props.text.substring(0, 30)}</Text>
        </Stack>

        <div>
          {props.right || null}
        </div>
      </Group>
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