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
    const [fossabotBitCommand, setFossabotBitCommand] = useState<string>("");
    const [fossabotBitLoading, setFossabotBitLoading] = useState<boolean>(false);
    const [fossabotSubgiftCommand, setFossabotSubgiftCommand] = useState<string>("");
    const [fossabotSubgiftLoading, setFossabotSubgiftLoading] = useState<boolean>(false);

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

        // Load Fossabot command
        const chatChannel = config.getChatChannel();
        if (chatChannel && profile.guid) {
            setFossabotBitLoading(true);
            fetch(`${import.meta.env.VITE_BACKEND_URL}/api/event/bitalerts/fossabot?channel=${chatChannel}&profile=${profile.guid}`)
                .then(res => res.json())
                .then((data) => {
                    setFossabotBitCommand(data.text || "Failed to load Fossabot command");
                })
                .catch(() => {
                    setFossabotBitCommand("Error loading Fossabot command. Please try again later.");
                })
                .finally(() => {
                    setFossabotBitLoading(false);
                });

            // Load Fossabot subgift command
            setFossabotSubgiftLoading(true);
            fetch(`${import.meta.env.VITE_BACKEND_URL}/api/event/subalerts/fossabot?channel=${chatChannel}&profile=${profile.guid}`)
                .then(res => res.json())
                .then((data) => {
                    setFossabotSubgiftCommand(data.text || "Failed to load Fossabot subgift command");
                })
                .catch(() => {
                    setFossabotSubgiftCommand("Error loading Fossabot subgift command. Please try again later.");
                })
                .finally(() => {
                    setFossabotSubgiftLoading(false);
                });
        } else {
            setFossabotBitCommand("Please set a chat channel and ensure you have a valid profile to generate the Fossabot command.");
            setFossabotSubgiftCommand("Please set a chat channel and ensure you have a valid profile to generate the Fossabot subgift command.");
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
            <Text size="sm" mb={10}>
                To connect StreamElements with HeheChat:
                <ol>
                    <li>Go to <a href="https://streamelements.com/dashboard" target="_blank" rel="noopener noreferrer">StreamElements Dashboard</a></li>
                    <li>Login to your account</li>
                    <li>Navigate to Dashboard → Profile → Channel Settings</li>
                    <li>Copy the JWT token</li>
                    <li>Paste it in the field below</li>
                </ol>
            </Text>
            <TextInput label="JWT" placeholder="Enter your StreamElements JWT token" value={streamelementsJWT} onChange={(ev) => updateStreamelements(ev.target.value)} />
        </Fieldset>

        <Fieldset legend="Pally.gg Config" variant="filled">
            <Text size="sm" mb={10}>
                To connect Pally.gg with HeheChat:
                <ol>
                    <li>Go to <a href="https://pally.gg" target="_blank" rel="noopener noreferrer">Pally.gg</a> and log into your account</li>
                    <li>Create an API key in your account settings</li>
                    <li>Create a campaign page with a custom slug</li>
                    <li>Enter both the API key and campaign slug below</li>
                </ol>
            </Text>
            <TextInput label="API Key" placeholder="Enter your Pally.gg API key" value={pallyggApiKey} onChange={(ev) => updatePallyGG(ev.target.value, pallyggChannel)} />
            <TextInput label="Pally Slug" placeholder="Enter your campaign page slug" value={pallyggChannel} onChange={(ev) => updatePallyGG(pallyggApiKey, ev.target.value)} />
        </Fieldset>

        <Fieldset legend="Elevenlabs Config" variant="filled">
            <Text size="sm" mb={10}>
                To connect ElevenLabs with HeheChat:
                <ol>
                    <li>Go to <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer">ElevenLabs</a> and log into your account</li>
                    <li>Navigate to your profile settings</li>
                    <li>Create an API key</li>
                    <li>Copy the API key and paste it below</li>
                </ol>
            </Text>
            <TextInput label="API Key" placeholder="Enter your ElevenLabs API key" value={elevenLabsApiKey} onChange={(ev) => updateElevenLabs(ev.target.value)} />
        </Fieldset>

        <Fieldset legend="Blerp Config" variant="filled">
            <Text size="sm" mb={10}>
                To connect Blerp with HeheChat:
                <ol>
                    <li>Go to <a href="https://blerp.com/dashboard" target="_blank" rel="noopener noreferrer">Blerp Dashboard</a></li>
                    <li>Navigate to OBS Browser Source section</li>
                    <li>Copy the URL provided</li>
                    <li>Paste the URL below (HeheChat will extract the room ID automatically)</li>
                </ol>
            </Text>
            <TextInput label="Room URL/ID" placeholder="Enter Blerp room URL or ID" value={blerpKey} onChange={(ev) => updateBlerp(ev.target.value)} />
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

        <Fieldset legend="Fossabot Bit Alerts" variant="filled">
            <Text size="sm" mb={10}>
                Copy the command below and paste it into Fossabot to create a command that displays bit alerts triggered by your viewers. 
                This command will show the top bit alerts sorted by amount.
            </Text>
            <Textarea
                label="Fossabot Command"
                placeholder={fossabotBitLoading ? "Loading..." : "Fossabot command will appear here"}
                value={fossabotBitCommand}
                readOnly
                minRows={4}
                maxRows={6}
                rightSection={
                    <ActionIcon 
                        onClick={() => navigator.clipboard.writeText(fossabotBitCommand)}
                        disabled={!fossabotBitCommand || fossabotBitLoading}
                    >
                        <IconCopy size="1rem" />
                    </ActionIcon>
                }
            />
        </Fieldset>

        <Fieldset legend="Fossabot Subgift Alerts" variant="filled">
            <Text size="sm" mb={10}>
                Copy the command below and paste it into Fossabot to create a command that displays subgift alerts triggered by your viewers. 
                This command will show the top subgift alerts sorted by amount.
            </Text>
            <Textarea
                label="Fossabot Subgift Command"
                placeholder={fossabotSubgiftLoading ? "Loading..." : "Fossabot subgift command will appear here"}
                value={fossabotSubgiftCommand}
                readOnly
                minRows={4}
                maxRows={6}
                rightSection={
                    <ActionIcon 
                        onClick={() => navigator.clipboard.writeText(fossabotSubgiftCommand)}
                        disabled={!fossabotSubgiftCommand || fossabotSubgiftLoading}
                    >
                        <IconCopy size="1rem" />
                    </ActionIcon>
                }
            />
        </Fieldset>
    </Stack>
    )
}
