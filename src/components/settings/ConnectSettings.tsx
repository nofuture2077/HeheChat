import { TextInput, Fieldset, Stack, Text, ActionIcon, Textarea } from '@mantine/core';
import { IconCopy } from '@tabler/icons-react';
import { useEffect, useState, useContext } from 'react';
import { ProfileContext, ConfigContext } from '@/ApplicationContext';

function extractBlerpRoom(input: string): string {
    const regex = /\/([^\/]+)$/;
    const match = input.match(regex);
    return match ? match[1] : input;
}

export function ConnectSettings() {
    const [elevenLabsApiKey, setElevenLabsApiKey] = useState<string>("");
    const [streamelementsJWT, setStreamelementsJWT] = useState<string>("");
    const [pallyggApiKey, setPallyggApiKey] = useState<string>("");
    const [pallyggChannel, setPallyggChannel] = useState<string>("");
    const [blerpKey, setBlerpKey] = useState<string>("");
    const [kofiVerificationToken, setKofiVerificationToken] = useState<string>("");
    const [kofiWebhookUrl, setKofiWebhookUrl] = useState<string>("");
    const [fossbotCommand, setFossbotCommand] = useState<string>("");
    const [fossbotLoading, setFossbotLoading] = useState<boolean>(false);

    const profile = useContext(ProfileContext);
    const config = useContext(ConfigContext);
    const state = localStorage.getItem('hehe-token_state') || '';

    useEffect(() => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/pallygg/get?state=" + state).then(res => res.json()).then((data) => {
            setPallyggApiKey(data.apikey || '');
            setPallyggChannel(data.channel || '');
        });

        fetch(import.meta.env.VITE_BACKEND_URL + "/blerp/get?state=" + state).then(res => res.json()).then((data) => {
            setBlerpKey(data.roomid || '');
        });

        fetch(import.meta.env.VITE_BACKEND_URL + "/elevenlabs/get?state=" + state).then(res => res.json()).then((data) => {
            setElevenLabsApiKey(data.apikey || '');
        });

        fetch(import.meta.env.VITE_BACKEND_URL + "/streamelements/get?state=" + state).then(res => res.json()).then((data) => {
            setStreamelementsJWT(data.jwt || '');
        });

        fetch(import.meta.env.VITE_BACKEND_URL + "/kofi/get?state=" + state).then(res => res.json()).then((data) => {
            setKofiVerificationToken(data.verification_token || '');
        });

        fetch(import.meta.env.VITE_BACKEND_URL + "/kofi/webhook-url?state=" + state).then(res => res.json()).then((data) => {
            setKofiWebhookUrl(data.webhook_url || '');
        });

        // Load Fossbot command
        const chatChannel = config.getChatChannel();
        if (chatChannel && profile.guid) {
            setFossbotLoading(true);
            fetch(`${import.meta.env.VITE_BACKEND_URL}/api/event/bitalerts/fossabot?channel=${chatChannel}&profile=${profile.guid}`)
                .then(res => res.json())
                .then((data) => {
                    setFossbotCommand(data.text || "Failed to load Fossbot command");
                })
                .catch(() => {
                    setFossbotCommand("Error loading Fossbot command. Please try again later.");
                })
                .finally(() => {
                    setFossbotLoading(false);
                });
        } else {
            setFossbotCommand("Please set a chat channel and ensure you have a valid profile to generate the Fossbot command.");
        }
    }, []);

    const updatePallyGG = (apikey: string, channel: string) => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/pallygg/set?state=" + state + "&apikey=" + apikey + "&channel=" + channel);
        setPallyggApiKey(apikey || '');
        setPallyggChannel(channel || '');
    };

    const updateBlerp = (input: string) => {
        const roomId = extractBlerpRoom(input);
        fetch(import.meta.env.VITE_BACKEND_URL + "/blerp/set?state=" + state + "&roomId=" + roomId);
        setBlerpKey(roomId || '');
    };

    const updateStreamelements = (jwt: string) => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/streamelements/set?state=" + state + "&jwt=" + jwt);
        setStreamelementsJWT(jwt || '');
    };

    const updateElevenLabs = (apikey: string) => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/elevenlabs/set?state=" + state + "&apikey=" + apikey);
        setElevenLabsApiKey(apikey || '');
    };

    const updateKofi = (verificationToken: string) => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/kofi/set?state=" + state + "&verification_token=" + verificationToken);
        setKofiVerificationToken(verificationToken || '');
    };

    return (<Stack mt={30} mb={30} gap={30}>

        <Fieldset legend="Streamelements Config" variant="filled">
            <TextInput label="JWT" placeholder="" value={streamelementsJWT} onChange={(ev) => updateStreamelements(ev.target.value)} />
        </Fieldset>

        <Fieldset legend="Pally.gg Config" variant="filled">
            <TextInput label="API Key" placeholder="" value={pallyggApiKey} onChange={(ev) => updatePallyGG(ev.target.value, pallyggChannel)} />
            <TextInput label="Pally Slug" placeholder="" value={pallyggChannel} onChange={(ev) => updatePallyGG(pallyggApiKey, ev.target.value)} />
        </Fieldset>

        <Fieldset legend="Elevenlabs Config" variant="filled">
            <TextInput label="API Key" placeholder="" value={elevenLabsApiKey} onChange={(ev) => updateElevenLabs(ev.target.value)} />
        </Fieldset>

        <Fieldset legend="Blerp Config" variant="filled">
            <TextInput label="API Key" placeholder="" value={blerpKey} onChange={(ev) => updateBlerp(ev.target.value)} />
        </Fieldset>

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
                value={kofiWebhookUrl} 
                readOnly 
                rightSection={
                    <ActionIcon onClick={() => navigator.clipboard.writeText(kofiWebhookUrl)}>
                        <IconCopy size="1rem" />
                    </ActionIcon>
                }
            />
            <TextInput 
                label="Verification Token" 
                placeholder="Enter the verification token from Ko-fi" 
                value={kofiVerificationToken} 
                onChange={(ev) => updateKofi(ev.target.value)} 
            />
        </Fieldset>

        <Fieldset legend="Fossbot Bit Alerts" variant="filled">
            <Text size="sm" mb={10}>
                Copy the command below and paste it into Fossbot to create a command that displays bit alerts triggered by your viewers. 
                This command will show the top bit alerts sorted by amount.
            </Text>
            <Textarea
                label="Fossbot Command"
                placeholder={fossbotLoading ? "Loading..." : "Fossbot command will appear here"}
                value={fossbotCommand}
                readOnly
                minRows={4}
                maxRows={6}
                rightSection={
                    <ActionIcon 
                        onClick={() => navigator.clipboard.writeText(fossbotCommand)}
                        disabled={!fossbotCommand || fossbotLoading}
                    >
                        <IconCopy size="1rem" />
                    </ActionIcon>
                }
            />
        </Fieldset>
    </Stack>
    )
}
