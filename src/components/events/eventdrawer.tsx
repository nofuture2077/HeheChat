import classes from './eventdrawer.module.css'
import { Text, Button, Group } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { OverlayDrawer } from '@/pages/Chat.page';
import { AlertControl } from './alertcontrol';
import { EventList } from './eventlist';

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
            <Group justify='space-between' className={classes.header}>
                <Text fw={700} c='primary'>Alerts</Text>
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
