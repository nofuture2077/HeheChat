import { Textarea, Fieldset, Stack, Text, ActionIcon, Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useState, useEffect, useContext } from 'react';
import { IconCopy } from '@tabler/icons-react';
import { ProfileContext, ConfigContext } from '@/ApplicationContext';

export function ConnectFossabotSettings() {
    const profile = useContext(ProfileContext);
    const config = useContext(ConfigContext);
    const [bitCommand, setBitCommand] = useState("");
    const [bitLoading, setBitLoading] = useState(false);
    const [subgiftCommand, setSubgiftCommand] = useState("");
    const [subgiftLoading, setSubgiftLoading] = useState(false);

    useEffect(() => {
        const chatChannel = config.getChatChannel();
        if (chatChannel && profile.guid) {
            setBitLoading(true);
            fetch(`${import.meta.env.VITE_BACKEND_URL}/api/event/bitalerts/fossabot?channel=${chatChannel}&profile=${profile.guid}`)
                .then(res => res.json())
                .then((data) => setBitCommand(data.text || "Failed to load Fossabot command"))
                .catch(() => setBitCommand("Error loading Fossabot command. Please try again later."))
                .finally(() => setBitLoading(false));

            setSubgiftLoading(true);
            fetch(`${import.meta.env.VITE_BACKEND_URL}/api/event/subalerts/fossabot?channel=${chatChannel}&profile=${profile.guid}`)
                .then(res => res.json())
                .then((data) => setSubgiftCommand(data.text || "Failed to load Fossabot subgift command"))
                .catch(() => setSubgiftCommand("Error loading Fossabot subgift command. Please try again later."))
                .finally(() => setSubgiftLoading(false));
        } else {
            setBitCommand("Please set a chat channel and ensure you have a valid profile to generate the Fossabot command.");
            setSubgiftCommand("Please set a chat channel and ensure you have a valid profile to generate the Fossabot subgift command.");
        }
    }, []);

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
                Fossabot is a chat bot for Twitch. Use the generated commands below to create Fossabot commands that list top bit and subgift alerts triggered by your viewers, so you can display them in chat on demand.
            </Alert>
            <Fieldset legend="Fossabot Bit Alerts" variant="filled">
                <Text size="sm" mb={10}>
                    Copy the command below and paste it into Fossabot to create a command that displays bit alerts triggered by your viewers.
                    This command will show the top bit alerts sorted by amount.
                </Text>
                <Textarea
                    label="Fossabot Command"
                    placeholder={bitLoading ? "Loading..." : "Fossabot command will appear here"}
                    value={bitCommand}
                    readOnly
                    minRows={4}
                    maxRows={6}
                    rightSection={
                        <ActionIcon onClick={() => navigator.clipboard.writeText(bitCommand)} disabled={!bitCommand || bitLoading}>
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
                    placeholder={subgiftLoading ? "Loading..." : "Fossabot subgift command will appear here"}
                    value={subgiftCommand}
                    readOnly
                    minRows={4}
                    maxRows={6}
                    rightSection={
                        <ActionIcon onClick={() => navigator.clipboard.writeText(subgiftCommand)} disabled={!subgiftCommand || subgiftLoading}>
                            <IconCopy size="1rem" />
                        </ActionIcon>
                    }
                />
            </Fieldset>
        </Stack>
    );
}
