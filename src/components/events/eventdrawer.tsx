import classes from './eventdrawer.module.css'
import { Title, Button, Group, Box, Text, ThemeIcon, ScrollArea } from '@mantine/core';
import { IconX, IconGiftFilled, IconCoinBitcoinFilled, IconReload, IconUserHeart, IconSparkles } from '@tabler/icons-react';
import { useState, useEffect, useContext } from 'react';
import { EventStorage, EventData } from './eventstorage';
import { ConfigContext } from '@/ApplicationContext';
import { InfoCard, InfoCardSkeleton } from '../infocard/infocard';
import { formatString } from "@/commons/helper";
import { SystemMessageType } from "@/commons/message";

export interface EventDrawerViewProperties {
    close: () => void;
}

const subsSteps = [1, 5, 10, 20, 50, 100];

const messages = {
    'raid': 'Raid from $1 with $2 viewers',
    'sub_1000': 'Subscribed for $2 months',
    'sub_2000': 'Subscribed with Tier 2 for $2 months',
    'sub_3000': 'Subscribed with Tier 3 for $2 months',
    'subgift_1000': 'Gifted $2 subs',
    'subgift_2000': 'Gifted $2 Tier 2 subs',
    'subgift_3000': 'Gifted $2 Tier 3 subs',
    'subgiftb_1000': 'Gifted $2 a sub',
    'subgiftb_2000': 'Gifted $2 a Tier 2 sub',
    'subgiftb_3000': 'Gifted $2 a Tier 3 sub',
    'sub_Prime': 'Subscribed with prime for $2 months',
    'follow': 'Just followed',
    'cheer': 'Cheered $2 bits',

    // not used as events
    'ban': '',
    'timeout': '',
    'delete': ''
}

const icons = {
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

    // not used as events
    'ban': null,
    'timeout': null,
    'delete': null
}

function getText(event: EventData) {
    const msg = formatString(messages[event.eventtype as SystemMessageType], [event.channel, event.username, event.amount]);
    return msg;
}

function getIcon(event: EventData, key: string) {
    const style: any = {variant: 'transparent'};
    if (event.eventtype.startsWith('subgift_')) {
        if ((event.amount || 0) >= 5) {
            style.variant = 'filled';
            style.color = 'orange';
        }
        if ((event.amount || 0) >=  10) {
            style.variant = 'filled';
            style.color = 'cyan';
        }
        if ((event.amount || 0 ) >=  20) {
            style.variant = 'gradient';
            style.gradient = { from: 'orange', to: 'cyan', deg: 90 };
        }
    }
    if (event.eventtype === 'cheer') {
        console.log(event.amount || 0);
        if ((event.amount || 0) >= 500) {
            console.log("500 " + event);
            style.variant = 'filled';
            style.color = 'orange';
        }
        if ((event.amount || 0) >= 1000) {
            console.log("1000 " + event);
            style.variant = 'filled';
            style.color = 'cyan';
        }
        if ((event.amount || 0) >= 5000) {
            console.log("5000 " + event);
            style.variant = 'gradient';
            style.gradient = { from: 'orange', to: 'cyan', deg: 90 };
        }
    }
    if (event.eventtype === 'raid') {
        if ((event.amount || 0) >= 100) {
            style.variant = 'filled';
            style.color = 'orange';
        }
        if ((event.amount || 0) >= 500) {
            style.variant = 'filled';
            style.color = 'cyan';
        }
        if ((event.amount || 0) >= 1000) {
            style.variant = 'gradient';
            style.gradient = { from: 'orange', to: 'cyan', deg: 90 };
        }
    }
    const icon = icons[event.eventtype as SystemMessageType];
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
                    {events.map((event, i)=> <InfoCard key={'event' + i} channel={event.channel} name={event.username} text={getText(event)} component={Box} left={getIcon(event, 'infocard-left')} right={<IconReload key={'infocard-right'}/>}/>)}
                </div>
            </ScrollArea>
        </nav>
    );
}