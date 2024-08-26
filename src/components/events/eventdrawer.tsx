import classes from './eventdrawer.module.css'
import { Title, Button, Group, Box, Text, ThemeIcon, ScrollArea, ActionIcon } from '@mantine/core';
import { IconX, IconGiftFilled, IconCoinBitcoinFilled, IconReload, IconUserHeart, IconSparkles, IconMoneybag } from '@tabler/icons-react';
import { useState, useEffect, useContext } from 'react';
import { EventStorage, EventData } from './eventstorage';
import { ConfigContext } from '@/ApplicationContext';
import { InfoCard, InfoCardSkeleton } from '../infocard/infocard';
import { formatString } from "@/commons/helper";
import { getEventStyle } from '@/components/events/eventhelper';
import { EventType } from '@/commons/events';
import { ReactElementLike } from 'prop-types';
import { AlertSystem } from '@/components/alerts/alertplayer';
import { OverlayDrawer } from '@/pages/Chat.page';

export const EventDrawer: OverlayDrawer = {
    name: 'events',
    component: EventDrawerView,
    size: 380,
    position: 'right'
}


export interface EventDrawerViewProperties {
    close: () => void;
}

const messages: Record<EventType, string> = {
    'raid': 'Raid from $1 with $2 viewers',
    'sub_1000': 'Subscribed for $2 months',
    'sub_2000': 'Subscribed with Tier 2 for $2 months',
    'sub_3000': 'Subscribed with Tier 3 for $2 months',
    'subgift_1000': 'Gifted $2 subs',
    'subgift_2000': 'Gifted $2 Tier 2 subs',
    'subgift_3000': 'Gifted $2 Tier 3 subs',
    'subgiftb_1000': 'Gifted $3 a sub',
    'subgiftb_2000': 'Gifted $3 a Tier 2 sub',
    'subgiftb_3000': 'Gifted $3 a Tier 3 sub',
    'sub_Prime': 'Subscribed with prime for $2 months',
    'follow': 'Just followed',
    'cheer': 'Cheered $2 bits',
    'donation': "Donated $2 $3"
}

const icons: Record<EventType, ReactElementLike> = {
    'raid': <IconSparkles/>,
    'sub_1000': <IconGiftFilled/>,
    'sub_2000': <IconGiftFilled/>,
    'sub_3000': <IconGiftFilled/>,
    'subgift_1000': <IconGiftFilled/>,
    'subgift_2000': <IconGiftFilled/>,
    'subgift_3000': <IconGiftFilled/>,
    'subgiftb_1000': <IconGiftFilled/>,
    'subgiftb_2000': <IconGiftFilled/>,
    'subgiftb_3000': <IconGiftFilled/>,
    'sub_Prime': <IconGiftFilled/>,
    'follow': <IconUserHeart/>,
    'cheer': <IconCoinBitcoinFilled/>,
    'donation': <IconMoneybag/>
}

function getText(event: EventData) {
    const msg = formatString(messages[event.eventtype as EventType], [event.channel, event.username, event.amount]);
    return msg;
}

function getIcon(event: EventData, key: string) {
    const style: any = {variant: 'transparent'};
    getEventStyle(event, style);
    const icon = icons[event.eventtype as EventType];
    return <ThemeIcon key={key} {...style}>{icon}</ThemeIcon>
}

export function EventDrawerView(props: EventDrawerViewProperties) {
    const config = useContext(ConfigContext);
    const [events, setEvents] = useState<EventData[]>([]);
    const [load, setLoad] = useState(true);

    useEffect(() => {
        EventStorage?.load(config.channels).then((events) => {
            setEvents(events);
            setLoad(false);
        });
    }, []);

    return (
        <nav className={classes.navbar}>
            <Group className={classes.header} justify='space-between' p='md'>
                <Title order={4}>
                    Alerts
                </Title>
                <Button onClick={props.close} variant='subtle' color='primary'>
                    <IconX />
                </Button>
            </Group>
            <ScrollArea className={classes.main}>
                <div className={classes.reverse}>
                    {load ? <>{[1,2,3].map(x => <InfoCardSkeleton key={'event' + x}/>)}</> : null}
                    {!load && events.length === 0 ? <Text key='event-noevents' pt='xl' size='xl' ta="center" variant='gradient' fw={900} gradient={{ from: 'orange', to: 'cyan', deg: 90 }}>No Event to show.</Text> : null}
                    {events.map((event, i)=> <InfoCard key={'event' + i} channel={event.channel} name={event.username} date={event.date} text={getText(event)} component={Box} left={getIcon(event, 'infocard-left')} right={<ActionIcon key={'infocard-right'} onClick={() => {AlertSystem.addEvent(event)}}><IconReload/></ActionIcon>}/>)}
                </div>
            </ScrollArea>
        </nav>
    );
}