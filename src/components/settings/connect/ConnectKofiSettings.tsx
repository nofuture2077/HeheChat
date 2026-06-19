import { TextInput, Fieldset, Stack, Text, ActionIcon, Alert, Button, Checkbox, Group } from '@mantine/core';
import { IconInfoCircle, IconCopy, IconPlug } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

export function ConnectKofiSettings() {
    const [verificationToken, setVerificationToken] = useState("");
    const [webhookUrl, setWebhookUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);
    const state = localStorage.getItem('hehe-token_state') || '';

    useEffect(() => {
        setLoading(true);
        const fetchKofi = async () => {
            try {
                const getRes = await fetch(import.meta.env.VITE_BACKEND_URL + "/kofi/get?state=" + state).then(res => res.json());
                if (getRes.verification_token) {
                    setVerificationToken(getRes.verification_token);
                    setConnected(true);
                }
                const webhookRes = await fetch(import.meta.env.VITE_BACKEND_URL + "/kofi/webhook-url?state=" + state).then(res => res.json());
                setWebhookUrl(webhookRes.webhook_url || '');
            } catch (error) {
                console.error("Failed to fetch Ko-fi settings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchKofi();
    }, []);

    const save = async () => {
        setLoading(true);
        try {
            await fetch(import.meta.env.VITE_BACKEND_URL + "/kofi/set?state=" + state + "&verification_token=" + verificationToken);
            setConnected(true);
        } catch (error) {
            alert("Failed to save Ko-fi config");
        } finally {
            setLoading(false);
        }
    };

    const disconnect = async () => {
        if (!confirm('Are you sure you want to disconnect Ko-fi?')) return;
        setLoading(true);
        try {
            await fetch(import.meta.env.VITE_BACKEND_URL + "/kofi/set?state=" + state + "&verification_token=");
            setVerificationToken("");
            setConnected(false);
        } catch (error) {
            alert("Failed to disconnect Ko-fi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
                Ko-fi lets your supporters send donations, buy memberships, or purchase from your shop. Connect via webhook so HeheChat can receive Ko-fi donation events and show them in your alert feed.
            </Alert>
            <Fieldset legend="Ko-fi Integration" variant="filled">
                <Stack gap="md">
                    {connected ? (
                        <Stack gap="sm">
                            <Group>
                                <Checkbox
                                    defaultChecked
                                    readOnly
                                    color="lime.4"
                                    size="md"
                                    />
                                    <div>
                                        <Text>Configured</Text>
                                        <Text size="xs" c="dimmed">
                                        Your Ko-fi account is configured via webhook
                                        </Text>
                                    </div>
                            </Group>
                            <Button color="red" variant="light" onClick={disconnect} loading={loading}>Disconnect Ko-fi</Button>
                        </Stack>
                    ) : (
                        <Stack gap="md">
                            <Text size="sm">
                                To integrate Ko-fi with HeheChat, follow these steps:
                                <ol>
                                    <li>Copy the webhook URL below</li>
                                    <li>Go to <a href="https://ko-fi.com/manage/webhooks" target="_blank" rel="noopener noreferrer">Ko-fi Webhook Settings</a></li>
                                    <li>Paste the URL in the "Webhook URL" field on Ko-fi</li>
                                    <li>Save the settings on Ko-fi</li>
                                    <li>Copy the "Verification Token" provided by Ko-fi</li>
                                    <li>Paste it in the field below</li>
                                </ol>
                            </Text>
                            <TextInput
                                label="Webhook URL"
                                placeholder=""
                                value={webhookUrl}
                                readOnly
                                rightSection={
                                    <ActionIcon onClick={() => navigator.clipboard.writeText(webhookUrl)}>
                                        <IconCopy size="1rem" />
                                    </ActionIcon>
                                }
                            />
                            <TextInput
                                label="Verification Token"
                                placeholder="Enter the verification token from Ko-fi"
                                value={verificationToken}
                                onChange={(ev) => setVerificationToken(ev.target.value)}
                            />
                            <Button
                                leftSection={<IconPlug size={20} />}
                                onClick={save}
                                loading={loading}
                                disabled={!verificationToken.trim()}
                            >
                                Connect Ko-fi
                            </Button>
                        </Stack>
                    )}
                </Stack>
            </Fieldset>
        </Stack>
    );
}
