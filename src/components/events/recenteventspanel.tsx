import { ActionIcon, Group, Paper, ScrollArea, Stack, Text } from '@mantine/core';
import { IconCheck, IconReload } from '@tabler/icons-react';
import { useContext, useState } from 'react';
import { ConfigContext, ProfileContext } from '@/ApplicationContext';
import { useEventFeed, formatEventText, getIcon } from './eventlist';
import { InfoCard } from '../infocard/infocard';
import { AlertSystem } from '@/components/alerts/alertplayer';
import { EventData } from './eventstorage';
import { Dictionary } from 'underscore';
import { useForceUpdate } from '@mantine/hooks';
import classes from './EventList.module.css';

export function RecentEventsPanel() {
    const config = useContext(ConfigContext);
    const profile = useContext(ProfileContext);
    const { events } = useEventFeed();
    const [checkedEvents, setCheckedEvents] = useState<Dictionary<boolean>>({});
    const forceUpdate = useForceUpdate();

    const replayEvent = (data: EventData) => {
        if (AlertSystem.shouldBePlayedInBrowsersource(data) && !checkedEvents[data.id]) {
            PubSub.publish('WSSEND', {type: 'replayevent', data: data, profile: profile.guid });
        } else if (AlertSystem.shouldBePlayedInApp(data) && !checkedEvents[data.id]) {
            AlertSystem.addEvent(data);
        }
        setCheckedEvents(ev => {
            ev[data.id] = true;
            return ev;
        });
        forceUpdate();
        setTimeout(() => {
            setCheckedEvents(ev => {
                ev[data.id] = false;
                forceUpdate();
                return ev;
            });
        }, 2500);
    };

    if (!config.recentEventsCount) {
        return null;
    }

    const recent = events.slice(-config.recentEventsCount).reverse();

    if (recent.length === 0) {
        return null;
    }

    if (config.recentEventsCompact && 0) {
        return (
            <Stack gap={0} mt={38}>
                {recent.map((event, i) => (
                    <Group key={'recent-event-' + i} gap="xs" wrap="nowrap">
                        {getIcon(event, 'recent-event-icon-' + i)}
                        <Text size="sm" lineClamp={1}>{formatEventText(event)}</Text>
                    </Group>
                ))}
            </Stack>
        );
    }

    return (
        <Stack gap={0} style={{position: 'absolute', width: '100%'}}>
            {recent.reverse().map((event, i) => (
                <InfoCard
                    key={'recent-event-' + i}
                    channel={event.channel}
                    className={classes.event}
                    name={event.username}
                    date={event.date}
                    text={formatEventText(event)}
                    left={getIcon(event, 'recent-event-icon-' + i)}
                    onClick={() => replayEvent(event)}
                    right={
                        <ActionIcon
                            disabled={!AlertSystem.shouldBePlayedInApp(event) && !AlertSystem.shouldBePlayedInBrowsersource(event)}
                            variant='transparent'>
                                {(checkedEvents[event.id] ? <IconCheck/> : <IconReload/>)}
                        </ActionIcon>
                    }
                />
            ))}
        </Stack>
    );
}
