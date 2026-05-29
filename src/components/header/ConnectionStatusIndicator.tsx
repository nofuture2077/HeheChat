import { ReactNode } from 'react';
import { Indicator, Tooltip } from '@mantine/core';
import { useConnectionStatus, type ConnectionStateName } from '@/commons/connectionStatus';

export interface ConnectionStatusIndicatorProps {
    children?: ReactNode;
}

function colorFor(state: ConnectionStateName): string {
    switch (state) {
        case 'connected': return 'green';
        case 'connecting':
        case 'reconnecting': return 'yellow';
        case 'disconnected': return 'red';
    }
}

function labelFor(state: ConnectionStateName): string {
    switch (state) {
        case 'connected': return 'Connected';
        case 'connecting': return 'Connecting…';
        case 'reconnecting': return 'Reconnecting…';
        case 'disconnected': return 'No connection — tap to retry';
    }
}

export function ConnectionStatusIndicator(props: ConnectionStatusIndicatorProps) {
    const status = useConnectionStatus();
    const isConnected = status.state === 'connected';

    if (props.children) {
        return (
            <Tooltip label={labelFor(status.state)} disabled={isConnected}>
                <Indicator
                    size={8}
                    offset={2}
                    color={colorFor(status.state)}
                    processing={status.state === 'connecting' || status.state === 'reconnecting'}
                >
                    {props.children}
                </Indicator>
            </Tooltip>
        );
    }

    return null;
}
