import { useContext, useEffect, useState } from 'react';
import { Fieldset, Stack, Text, TextInput, Button, Group, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconRobot, IconTrash } from '@tabler/icons-react';
import { ConfigContext } from '@/ApplicationContext';
import { getBot, getBotAuthUrl, deleteBot, BotAccount } from '@/api/bot';

export function GeneralBotSettings() {
    const config = useContext(ConfigContext);
    const channel = config.getChatChannel();

    const [bot, setBot] = useState<BotAccount | null | undefined>(undefined);
    const [busy, setBusy] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [confirmOpen, confirmHandler] = useDisclosure(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!channel) return;
        setBot(undefined);
        getBot(channel)
            .then(data => setBot(data))
            .catch(() => setBot(null));
    }, [channel]);

    const handleConnect = async () => {
        if (!channel) return;
        setBusy(true);
        try {
            const url = await getBotAuthUrl(channel);
            window.location.href = url;
        } catch {
            setError('Failed to start bot account authorization.');
            setBusy(false);
        }
    };

    const handleRemove = async () => {
        if (!channel) return;
        setRemoving(true);
        try {
            await deleteBot(channel);
            setBot(null);
        } catch {
            setError('Failed to remove bot account.');
        } finally {
            setRemoving(false);
            confirmHandler.close();
        }
    };

    if (bot === undefined) return null;

    return (
        <>
            <Fieldset legend="Bot Account" variant="filled">
                {bot ? (
                    <Stack gap="sm">
                        <TextInput label="Username" value={bot.bot_username} readOnly leftSection={<IconRobot size={16} />} />
                        <TextInput label="User ID" value={bot.bot_userid} readOnly />
                        <Button
                            variant="light"
                            color="red"
                            leftSection={<IconTrash size={14} />}
                            onClick={confirmHandler.open}
                        >
                            Remove Bot Account
                        </Button>
                    </Stack>
                ) : (
                    <Stack gap="sm">
                        <Text size="sm" c="dimmed">
                            No bot account connected. Click below to authorize a bot account via Twitch.
                        </Text>
                        {error && <Text size="sm" c="red">{error}</Text>}
                        <Group justify="flex-end">
                            <Button loading={busy} leftSection={<IconRobot size={14} />} onClick={handleConnect}>
                                Connect Bot Account
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Fieldset>

            <Modal zIndex={400} opened={confirmOpen} onClose={confirmHandler.close} withCloseButton={false}>
                <Fieldset legend="Remove Bot Account">
                    <Text mb="md">Are you sure you want to remove the bot account?</Text>
                    <Group justify="space-around">
                        <Button onClick={confirmHandler.close}>Cancel</Button>
                        <Button variant="filled" color="red" loading={removing} onClick={handleRemove}>Remove</Button>
                    </Group>
                </Fieldset>
            </Modal>
        </>
    );
}
