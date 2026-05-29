import { Button, Fieldset, Group, Stack, Avatar, Text } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import { useContext } from 'react';
import { LoginContextContext } from '@/ApplicationContext';

export interface GeneralAccountSettingsProps {
    close: () => void;
    openUserProfile: () => void;
}

export function GeneralAccountSettings({}: GeneralAccountSettingsProps) {
    const loginContext = useContext(LoginContextContext);

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="User" variant='filled'>
                <Stack gap="sm">
                    <Group gap="sm">
                        <Avatar src={loginContext.user?.profilePictureUrl || ''} radius="xl" size="lg" />
                        <Stack gap={2}>
                            <Text fw={600}>{loginContext.user?.displayName || ''}</Text>
                            <Text size="sm" c="dimmed">{loginContext.user?.description || ''}</Text>
                        </Stack>
                    </Group>
                    <Button
                        variant="light"
                        color="red"
                        leftSection={<IconLogout size={14} />}
                        onClick={() => {
                            localStorage.removeItem('hehe-token');
                            loginContext.setAccessToken(undefined);
                        }}
                    >
                        Logout
                    </Button>
                </Stack>
            </Fieldset>
        </Stack>
    );
}
