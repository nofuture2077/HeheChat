import classes from './alertdialog.module.css'
import { Title, Button, Group, Box, Text, ThemeIcon } from '@mantine/core';
import { IconX, IconGiftFilled, IconCoinBitcoinFilled, IconReload } from '@tabler/icons-react';
import { useState, useEffect, useContext } from 'react';
import { EventStorage, EventData } from './eventstorage';
import { ConfigContext } from '@/ApplicationContext';
import { InfoCard, InfoCardSkeleton } from '../commons/infocard';

export interface AlertsProperties {
    close: () => void;
}

function getText(event: EventData) {
    if (event.eventtype.startsWith('sub_')) {
        const parts = event.eventtype.split('_');
        if (parts[1] === 'Prime') return "Subbed with prime for " + event.amount + " months";
        return "Subbed with Tier " + Number(parts[1]) / 1000 + " for " + event.amount + " months";
    }
    if (event.eventtype.startsWith('subgift_')) {
        const style = ((event.amount || 0) >= 5) ? { variant: 'gradient', gradient:{ from: 'orange', to: 'cyan', deg: 90 }} : {};
        return "Gifted " + event.amount + " subs to the Community";
    }
    if (event.eventtype.startsWith('cheer')) {
        return "Cheered with " + event.amount + " bits";
    }
    return event.eventtype;
}

function getIcon(event: EventData) {
    if (event.eventtype.startsWith('sub_')) {
        return <ThemeIcon><IconGiftFilled/></ThemeIcon>
    }
    if (event.eventtype.startsWith('subgift_')) {
        const style = ((event.amount || 0) >= 5) ? { variant: 'gradient', gradient:{ from: 'orange', to: 'cyan', deg: 90 }} : {};
        return <ThemeIcon {...style}><IconGiftFilled/></ThemeIcon>
    }
    if (event.eventtype.startsWith('cheer')) {
        return <ThemeIcon><IconCoinBitcoinFilled/></ThemeIcon>
    }
}

export function Alerts(props: AlertsProperties) {
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
            <div className={classes.main}>
                {load ? [1,2,3].map(x => <InfoCardSkeleton key={'event' + x}/>) : null}
                {!load && events.length === 0 ? <Text pt='xl' size='xl' ta="center" variant='gradient' fw={900} gradient={{ from: 'orange', to: 'cyan', deg: 90 }}>No Event to show.</Text> : null}
                {events.map(event => <InfoCard key={event.id} channel={event.channel} name={event.username} text={getText(event)} component={Box} left={getIcon(event)} right={<IconReload/>}/>)}
            </div>
        </nav>
    );
}