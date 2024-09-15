import { Avatar, Text, Button, Paper, Space, Group } from '@mantine/core';
import { OverlayDrawer } from '@/pages/Chat.page';
import { useContext } from 'react';
import { LoginContextContext } from '@/ApplicationContext';
import { IconUnlink, IconX } from '@tabler/icons-react';
import { LoginContext } from '@/commons/login';


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
            <Button
                component="a"
                size='md'
                radius="xl"
                variant='gradient'
                onClick={() => logout(loginContext)}
                gradient={{ from: 'red', to: 'orange', deg: 135 }}
                rightSection={<IconUnlink size={32} />}>    
                Logout
            </Button>
        </Paper>
    );
}