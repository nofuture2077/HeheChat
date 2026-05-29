import { Alert, Button, Group, Text } from '@mantine/core';
import { IconPlugConnectedX, IconRefresh } from '@tabler/icons-react';
import { useConnectionStatus } from '@/commons/connectionStatus';

const PROLONGED_LOSS_MS = 5000;

export function ConnectionStatusBanner() {
    const status = useConnectionStatus();

    if (status.state === 'connected') return null;
    if (status.disconnectedSinceMs < PROLONGED_LOSS_MS) return null;

    const isHardDown = status.state === 'disconnected';
    const message = isHardDown
        ? 'No connection — trying to reconnect…'
        : 'Reconnecting…';

    return (
        <Alert
            color={isHardDown ? 'red' : 'yellow'}
            icon={<IconPlugConnectedX size="1rem" />}
            radius={0}
            p="xs"
            withCloseButton={false}
        >
            <Group justify="space-between" wrap="nowrap" gap="sm">
                <Text size="sm">{message}</Text>
                <Button
                    size="xs"
                    variant="light"
                    color={isHardDown ? 'red' : 'yellow'}
                    leftSection={<IconRefresh size="0.9rem" />}
                    onClick={status.forceReconnect}
                >
                    Retry now
                </Button>
            </Group>
        </Alert>
    );
}
