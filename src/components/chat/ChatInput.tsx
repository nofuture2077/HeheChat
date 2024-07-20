import { useContext, useState } from 'react';
import { ChatConfigContext, ChatEmotes } from '../../ApplicationContext';
import { ChannelPicker } from './ChannelPicker';
import { TextInput, ActionIcon, rem, Flex } from '@mantine/core'
import { IconSend, IconX } from '@tabler/icons-react';

export function ChatInput(props: {close: () => void}) {
    const config = useContext(ChatConfigContext);
    const emotes = useContext(ChatEmotes);
    const [inputText, setInputText] = useState<string>('');
    const sendMessage = (text: string, close: boolean) => {
        const channel = emotes.getChannelId(config.getChatChannel() || '');
        if (channel && text) {
            config.fireMessage(channel, text);
        }
        setInputText('');
        if (close)
            props.close();
    }
    return (<Flex w="100%" justify="space-between" gap={'md'} pl={'md'} pr={'md'}
        align="center" m='xs'>
        
        <TextInput
            value={inputText}
            onChange={(event) => setInputText(event.currentTarget.value)}
            radius="md"
            size="md"
            w="100%"
            placeholder={"Chat in " + config.chatChannel}
            rightSectionWidth={42}
            onKeyDown={event => {
                if (event.key == "Enter") {
                    sendMessage(inputText, false)
                }
            }}
            rightSection={
                <ActionIcon size={32} radius="xl" variant="filled" color='primary' onClick={() => {sendMessage(inputText, true)}}>
                    <IconSend style={{ width: rem(18), height: rem(18) }} stroke={1.5}/>
                </ActionIcon>
            }
        />
        <ChannelPicker />
        <ActionIcon variant="transparent" onClick={props.close} color='primary'>
            <IconX style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
        </ActionIcon>
    </Flex>);}