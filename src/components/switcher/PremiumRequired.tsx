import { Stack, Text } from '@mantine/core';
import { IconCrown } from '@tabler/icons-react';

export function PremiumRequired() {
    return (
        <Stack align="center" justify="center" gap="xs" pt={40} pb={40}>
            <IconCrown size={32} color="var(--mantine-color-yellow-5)" />
            <Text fw={600}>HeheChat Pro required</Text>
            <Text size="sm" c="dimmed" ta="center">
                Upgrade to HeheChat Pro to access this feature.
            </Text>
        </Stack>
    );
}
