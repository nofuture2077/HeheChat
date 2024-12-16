import classes from './eventdrawer.module.css'
import { Title, Button, Group, Box, Text, ThemeIcon, ScrollArea, ActionIcon } from '@mantine/core';
import { IconX, IconGiftFilled, IconCoinBitcoinFilled, IconReload, IconUserHeart, IconSparkles, IconMoneybag, IconPlant, IconCheck } from '@tabler/icons-react';
import { useState, useEffect, useContext } from 'react';
import { EventStorage, EventData } from './eventstorage';
import { ConfigContext } from '@/ApplicationContext';
import { InfoCard, InfoCardSkeleton } from '../infocard/infocard';
import { formatString } from "@/commons/helper";
import { getEventStyle } from '@/components/events/eventhelper';
import { EventMainType, EventType, EventTypeMapping } from '@/commons/events';
import { ReactElementLike } from 'prop-types';
import { AlertSystem } from '@/components/alerts/alertplayer';
import { OverlayDrawer } from '@/pages/Chat.page';
import { AlertControl } from './alertcontrol';
import { Dictionary } from 'underscore';
import { useForceUpdate } from '@mantine/hooks';

export const EventDrawer: OverlayDrawer = {
    name: 'events',
    component: EventDrawerView,
    size: 410,
    position: 'right'
}

export interface EventDrawerViewProperties {
    close: () => void;
}

const messages: Record<EventType, string> = {
    'raid': 'Raid with ${amount:whole} viewers',
    'sub_1000': 'Sub for ${amount:whole} months',
    'sub_2000': 'Sub with T2 for ${amount:whole} months',
    'sub_3000': 'Sub with T3 for ${amount:whole} months',
    'subgift_1000': 'Gifted ${amount:whole} subs',
    'subgift_2000': 'Gifted ${amount:whole} Tier 2 subs',
    'subgift_3000': 'Gifted ${amount:whole} Tier 3 subs',
    'subgiftb_1000': 'Gifted ${recipient} a sub',
    'subgiftb_2000': 'Gifted ${recipient} a Tier 2 sub',
    'subgiftb_3000': 'Gifted ${recipient} a Tier 3 sub',
    'sub_Prime': 'Sub with prime for ${amount:whole} months',
    'follow': 'Just followed',
    'cheer': 'Cheered ${amount:whole} bits',
    'donation': "Donated ${amount:decimal} ${text}",
    'channelPointRedemption': 'Channelpoints: ${rewardTitle}'
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
    'donation': <IconMoneybag/>,
    'channelPointRedemption': <IconPlant/>
}

export function formatEventText(event: EventData) {
    const additionalData = event.text ? JSON.parse(event.text) : {};
    const msg = formatString(messages[event.eventtype as EventType], {...event, ...additionalData});
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
    const [checkedEvents, setCheckedEvents] = useState<Dictionary<boolean>>({});
    const forceUpdate = useForceUpdate();

    useEffect(() => {
        const ignored: string[] = Object.keys(config.systemMessageInChat).filter(
            // @ts-ignore
            (key: string) => !config.systemMessageInChat[key]
        );
        
        EventStorage?.load(config.channels, ignored).then((events) => {
            setEvents(events.filter(event => config.systemMessageInChat[EventTypeMapping[event.eventtype] as EventMainType]));
            setLoad(false);
        });

        const eventSub = PubSub.subscribe("WS-event", (msg, data) => {
            setEvents((prevState) => {
                return prevState.concat(data);
            })
        });

        return () => {
            PubSub.unsubscribe(eventSub);
        }
    }, []);

    const replayEvent = (data: EventData) => {
        if (AlertSystem.shouldBePlayed(data) && !checkedEvents[data.id]) {
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

    return (
        <nav className={classes.navbar}>
            <Group justify='space-between' p='md'>
                <Title order={4}>
                    Alerts
                </Title>
                <Button onClick={props.close} variant='subtle' color='primary'>
                    <IconX />
                </Button>
            </Group>
            <AlertControl/>
            <ScrollArea className={classes.main}>
                <div className={classes.reverse}>
                    {load ? <>{[1,2,3].map(x => <InfoCardSkeleton key={'event' + x}/>)}</> : null}
                    {!load && events.length === 0 ? <Text key='event-noevents' pt='xl' size='xl' ta="center" fw={500}>No Events to show.</Text> : null}
                    {events.map((event, i)=> <InfoCard key={'event' + i} channel={event.channel} name={event.username} date={event.date} text={formatEventText(event)} left={getIcon(event, 'infocard-left')} onClick={() => replayEvent(event)} right={<ActionIcon disabled={!AlertSystem.shouldBePlayed(event)} variant='transparent' key={'infocard-right'}>
                        {(checkedEvents[event.id] ? <IconCheck/> : <IconReload/>)}
                    </ActionIcon>}/>)}
                </div>
            </ScrollArea>
        </nav>
    );
}