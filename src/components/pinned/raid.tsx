import { Text, Card, Group, ActionIcon, Button } from '@mantine/core';
import { useState, useEffect, useContext, useRef } from 'react';
import { formatMinuteSeconds } from '@/commons/helper'
import { ChatEmotesContext, LoginContextContext } from '@/ApplicationContext'
import pinClasses from './pinmanager.module.css';
import raidClasses from './raid.module.css';
import { PinProps } from './pinmanager';
import { IconEyeOff, IconX } from '@tabler/icons-react';
import { unraid } from '@/components/chat/mod/modactions';

interface RaidProps extends PinProps {
    broadcasterName: string;
    targetChannelName: string;
    viewers: number;
}

export function Raid(props: RaidProps) {
    const emotes = useContext(ChatEmotesContext);
    const loginContext = useContext(LoginContextContext);
    const [remaining, setRemaining] = useState<number>(Math.round((props.endTime.getTime() - new Date().getTime()) / 1000));
    const intervalRef = useRef<number | null>(null);
    
    // Check if user is broadcaster or moderator for this channel
    const channelId = emotes.getChannelId(props.channel);
    const isBroadcaster = loginContext.user?.id === channelId;
    const isModerator = loginContext.moderatedChannels.map(ch => ch.id).includes(channelId);
    const canCancelRaid = isBroadcaster || isModerator;

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

    return <Card withBorder radius="md" p="md" ml="sm" mr="sm" mt={0} mb={0} onClick={props.onClick} className={raidClasses.raid}>
        <Group justify="space-between" align="center">
            <Group>
                <span className={pinClasses.logo}>{emotes.getLogo(props.channel)}</span>
                <div>
                    <Group gap="xs">
                        <Text fw={700}>{props.broadcasterName}</Text>
                        <Text>is raiding</Text>
                        <Text fw={700}>{props.targetChannelName}</Text>
                    </Group>
                </div>
            </Group>
            <Group>
                <Text fw={700}>
                    {formatMinuteSeconds(remaining)}
                </Text>
                {canCancelRaid && (
                  <Button
                    variant="filled" color="red"
                    leftSection={<IconX size="1.125rem" />}
                    onClick={() => unraid(channelId)}
                  >Cancel</Button>
                )}
                <ActionIcon variant="subtle" onClick={props.hide} color='primary'>
                    <IconEyeOff/>
                </ActionIcon>
            </Group>
        </Group>
    </Card>
}
