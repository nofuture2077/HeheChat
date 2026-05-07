import { Stack, Fieldset, Table, Anchor, ActionIcon, Space, Group, Text, Button, TextInput, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState, useEffect } from 'react';
import { IconLink, IconPlus, IconTrash, IconCopy } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface EditorData {
    id: string;
    userid: string;
    channelname: string;
    token: string;
    name: string;
}

function CreateEditorModal({ opened, close, createEditor }: { opened: boolean; close: () => void; createEditor: (name: string) => void }) {
    const [editorName, setEditorName] = useState("");

    return (
        <Modal zIndex={400} opened={opened} onClose={close} withCloseButton={false}>
            <Fieldset legend='Create new Editor Token'>
                <TextInput
                    label="Editor Name"
                    placeholder="Enter a name for this editor"
                    value={editorName}
                    onChange={(ev) => setEditorName(ev.target.value)}
                />
                <Group justify="flex-end" mt="md">
                    <Button onClick={close}>Cancel</Button>
                    <Button color='primary' disabled={!editorName.trim()} onClick={() => { createEditor(editorName.trim()); setEditorName(""); close(); }}>
                        Create
                    </Button>
                </Group>
            </Fieldset>
        </Modal>
    );
}

export function AlertsEditorSettings() {
    const [editors, setEditors] = useState<EditorData[]>([]);
    const [editorModalOpened, editorModalHandler] = useDisclosure(false);

    useEffect(() => {
        loadEditors();
    }, []);

    const loadEditors = () => {
        const state = localStorage.getItem('hehe-token_state') || '';
        fetch(import.meta.env.VITE_BACKEND_URL + '/alert/editor?state=' + state).then(res => res.json()).then((data) => {
            setEditors(data);
            if (!data.length) createEditor('Default');
        });
    };

    const createEditor = (name: string) => {
        const state = localStorage.getItem('hehe-token_state') || '';
        fetch(import.meta.env.VITE_BACKEND_URL + '/alert/editor?state=' + state + '&name=' + encodeURIComponent(name), { method: 'PUT' })
            .then(res => res.json()).then(setEditors);
    };

    const deleteEditor = (token: string) => {
        const state = localStorage.getItem('hehe-token_state') || '';
        fetch(import.meta.env.VITE_BACKEND_URL + '/alert/editor?state=' + state + '&token=' + encodeURIComponent(token), { method: 'DELETE' })
            .then(res => res.json()).then(setEditors);
    };

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            notifications.show({ title: 'Copied!', message: `${label} URL copied to clipboard`, color: 'green' });
        } catch {
            notifications.show({ title: 'Error', message: 'Failed to copy to clipboard', color: 'red' });
        }
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Alert Editor" variant="filled">
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Link</Table.Th>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Copy</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {editors.map(element => (
                            <Table.Tr key={element.id}>
                                <Table.Td>
                                    <Anchor href={import.meta.env.VITE_EDITOR_URL + "?token=" + element.token} target="_blank">
                                        <IconLink />
                                    </Anchor>
                                </Table.Td>
                                <Table.Td>{element.name}</Table.Td>
                                <Table.Td>
                                    <ActionIcon variant="light" color="blue" onClick={() => copyToClipboard(import.meta.env.VITE_EDITOR_URL + "?token=" + element.token, "Alert Editor")}>
                                        <IconCopy size={16} />
                                    </ActionIcon>
                                </Table.Td>
                                <Table.Td>
                                    <ActionIcon variant="subtle" onClick={() => deleteEditor(element.token)}>
                                        <IconTrash />
                                    </ActionIcon>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
                <Space h="xs" />
                <Group gap="xs">
                    <ActionIcon color='primary' onClick={editorModalHandler.open}><IconPlus /></ActionIcon>
                    <Text size="sm">Create Alert Editor</Text>
                </Group>
                <CreateEditorModal opened={editorModalOpened} close={editorModalHandler.close} createEditor={createEditor} />
            </Fieldset>
        </Stack>
    );
}
