import { TagsInput, Text, Space, TextInput, ActionIcon, Table, Anchor, Fieldset, Stack } from '@mantine/core';
import { useContext, useEffect, useState } from 'react';
import { ConfigContext } from '@/ApplicationContext';
import { IconLink, IconPlus, IconTrash } from '@tabler/icons-react';

interface EditorData {
    id: string;
    userid: string;
    channelname: string;
    token: string;
    name: string;
}

export function ShareSettings() {
    const config = useContext(ConfigContext);
    const [shares, setShares] = useState<string[]>(config.shares);
    const [elevenLabsApiKey, setElevenLabsApiKey] = useState<string>("");
    const [streamelementsJWT, setStreamelementsJWT] = useState<string>("");
    const [pallyggApiKey, setPallyggApiKey] = useState<string>("");
    const [pallyggChannel, setPallyggChannel] = useState<string>("");
    const [editors, setEditors] = useState<EditorData[]>([]);

    const state = localStorage.getItem('hehe-token_state') || '';

    useEffect(() => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/pallygg/get?state=" + state).then(res => res.json()).then((data) => {
            setPallyggApiKey(data.apikey || '');
            setPallyggChannel(data.channel || '');
        });

        fetch(import.meta.env.VITE_BACKEND_URL + "/elevenlabs/get?state=" + state).then(res => res.json()).then((data) => {
            setElevenLabsApiKey(data.apikey || '');
        });

        fetch(import.meta.env.VITE_BACKEND_URL + "/streamelements/get?state=" + state).then(res => res.json()).then((data) => {
            setStreamelementsJWT(data.jwt || '');
        });
    }, []);

    const updatePallyGG = (apikey: string, channel: string) => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/pallygg/set?state=" + state + "&apikey=" + apikey + "&channel=" + channel);
        setPallyggApiKey(apikey || '');
        setPallyggChannel(channel || '');
    };

    const updateStreamelements = (jwt: string) => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/streamelements/set?state=" + state + "&jwt=" + jwt);
        setStreamelementsJWT(jwt || '');
    };

    const updateElevenLabs = (apikey: string) => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/elevenlabs/set?state=" + state + "&apikey=" + apikey);
        setElevenLabsApiKey(apikey || '');
    };

    const loadEditors = () => {
        fetch(import.meta.env.VITE_BACKEND_URL + '/alert/editor?state=' + state).then(res => res.json()).then((data) => {
            setEditors(data);
        });
    }

    const createEditor = (name: string) => {
        const state = localStorage.getItem('hehe-token_state') || '';
        fetch(import.meta.env.VITE_BACKEND_URL + '/alert/editor?state=' + state + '&name=' + encodeURIComponent(name), { method: 'PUT' }).then(res => res.json()).then((data) => {
            setEditors(data);
        });
    }

    const deleteEditor = (token: string) => {
        const state = localStorage.getItem('hehe-token_state') || '';
        fetch(import.meta.env.VITE_BACKEND_URL + '/alert/editor?state=' + state + '&token=' + encodeURIComponent(token), { method: 'DELETE' }).then(res => res.json()).then((data) => {
            setEditors(data);
        });
    }

    useEffect(() => {
        loadEditors();
    }, []);


    useEffect(() => {
        if (shares != config.shares) {
            config.setShares(shares);
        }
    }, [shares]);

    return (<Stack mt={30} mb={30} gap={30}>
        <Fieldset legend="Share Alerts with" variant="filled">
            <TagsInput placeholder="" value={config.shares} onChange={setShares}></TagsInput>
            <Space h="xs" />
            <Text fs="italic" size='14px'>* Share your alerts with other Streams so they can use your sounds. Be aware: If you use AI-TTS shared alerts will count against your Quota from elevenlabs</Text>
        </Fieldset>

        <Fieldset legend="Editor Tokens" variant="filled">
            <Table>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th></Table.Th>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Key</Table.Th>
                        <Table.Th></Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{editors.map(element => <Table.Tr key={element.id}>
                    <Table.Td><ActionIcon variant="subtle" onClick={() => deleteEditor(element.token)}><IconTrash /></ActionIcon></Table.Td>
                    <Table.Td>{element.name}</Table.Td>
                    <Table.Td>...{element.token.slice(-4)}</Table.Td>
                    <Table.Td><Anchor href={import.meta.env.VITE_EDITOR_URL + "?token=" + element.token} target="_blank"><IconLink /></Anchor></Table.Td>
                </Table.Tr>)}</Table.Tbody>
            </Table>

            <Space h="xs" />
            <ActionIcon color='primary' onClick={() => createEditor("Share")}><IconPlus /></ActionIcon>
        </Fieldset>

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

    </Stack>
    )
}