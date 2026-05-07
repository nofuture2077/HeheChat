import { TextInput, Fieldset, Stack, Text, ActionIcon } from '@mantine/core';
import { useState, useEffect } from 'react';
import { IconCopy } from '@tabler/icons-react';

export function ConnectKofiSettings() {
    const [verificationToken, setVerificationToken] = useState("");
    const [webhookUrl, setWebhookUrl] = useState("");
    const state = localStorage.getItem('hehe-token_state') || '';

    useEffect(() => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/kofi/get?state=" + state)
            .then(res => res.json()).then((data) => setVerificationToken(data.verification_token || ''));
        fetch(import.meta.env.VITE_BACKEND_URL + "/kofi/webhook-url?state=" + state)
            .then(res => res.json()).then((data) => setWebhookUrl(data.webhook_url || ''));
    }, []);

    const update = (value: string) => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/kofi/set?state=" + state + "&verification_token=" + value);
        setVerificationToken(value);
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Ko-fi Integration" variant="filled">
                <Text size="sm" mb={10}>
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
                    onChange={(ev) => update(ev.target.value)}
                />
            </Fieldset>
        </Stack>
    );
}
