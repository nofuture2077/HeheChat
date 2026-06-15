import classes from './eventdrawer.module.css'
import { Title, Button, Group } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { OverlayDrawer } from '@/pages/Chat.page';
import { AlertControl } from './alertcontrol';
import { EventList } from './EventList';

export const EventDrawer: OverlayDrawer = {
    name: 'events',
    component: EventDrawerView,
    size: 410,
    position: 'right'
}

export interface EventDrawerViewProperties {
    close?: () => void;
}

export function EventDrawerView(props: EventDrawerViewProperties) {
    return (
        <nav className={classes.navbar}>
            <Group justify='space-between' p='md' className={classes.header}>
                <Title order={4}>
                    Alerts
                </Title>
                {props.close ? 
                <Button onClick={props.close} variant='subtle' color='primary'>
                    <IconX />
                </Button> : <span></span>
                }
            </Group>
            <AlertControl/>
            <EventList />
        </nav>
    );
}
