import { Avatar, Text, Button, Paper, Space, Group, Stack } from '@mantine/core';

import { OverlayDrawer } from '@/pages/Chat.page';
import { useContext } from 'react';
import { LoginContextContext, ProfileContext } from '@/ApplicationContext';
import { IconUnlink, IconX } from '@tabler/icons-react';
import { LoginContext } from '@/commons/login';
import { CompactAnalyticsChart } from "@/components/analytics/CompactAnalyticsChart";


export const UserCardDrawer: OverlayDrawer = {
    name: 'settings',
    component: UserCard,
    size: 'xl',
    position: 'bottom',
}

function logout(loginContext: LoginContext) {
    localStorage.removeItem('hehe-token');
    loginContext.setAccessToken(undefined);
}

export interface UserCardProps {
    close: () => void;
}
  
export function UserCard(props: UserCardProps) {
    const loginContext = useContext(LoginContextContext);
    const profile = useContext(ProfileContext);

    return (
        <Paper radius="md" withBorder p="lg" bg="var(--mantine-color-body)" ta="center">
            <Group justify="flex-end">
                <Button onClick={props.close} variant='subtle' color='primary'>
                    <IconX />
                </Button>
            </Group>
            <Avatar
                src={loginContext.user?.profilePictureUrl || ''}
                size={120}
                radius={120}
                mx="auto"
            />
            <Text ta="center" fz="lg" fw={500} mt="md">
                {loginContext.user?.displayName || ''}
            </Text>
            <Text ta="center" c="dimmed" fz="sm">
                {loginContext.user?.description || ''}
            </Text>
            <Space h="lg"/>
            <Stack gap="xs">
                <Text m='auto' ta="center">{profile.name}</Text>
                {(
                    <CompactAnalyticsChart channels={profile.config.channels} height={80} />
                )}
            </Stack>
            <Space h="lg"/>
            <Button
                component="a"
                size='md'
                radius="xl"
                variant='gradient'
                onClick={() => logout(loginContext)}
                rightSection={<IconUnlink size={32} />}>    
                Logout
            </Button>
        </Paper>
    );
}