import { useContext, useState } from 'react';
import { ChatConfigContext, ChatEmotes } from '../../ApplicationContext';
import { ChannelPicker } from './ChannelPicker';
import { TextInput, ActionIcon, rem, Flex, Stack } from '@mantine/core'
import { IconSend, IconX } from '@tabler/icons-react';
import { ChatMessage } from '@twurple/chat';
import { ChatMessageComp } from './ChatMessage';

export function ChatInput(props: {close: () => void, replyToMsg?: ChatMessage, setReplyMsg: (msg?: ChatMessage) => void}) {
    const config = useContext(ChatConfigContext);
    const emotes = useContext(ChatEmotes);
    const [inputText, setInputText] = useState<string>('');
    const sendMessage = (text: string, close: boolean) => {
        const channel = emotes.getChannelId(config.getChatChannel() || '');
        if (channel && text) {
            config.fireMessage(channel, text, props.replyToMsg?.id);
        }
        setInputText('');
        props.setReplyMsg(undefined);
        if (close)
            props.close();
    }
    return (
        <Stack gap={0}>
        {props.replyToMsg ? (<ChatMessageComp msg={props.replyToMsg} hideReply={true} setReplyMsg={props.setReplyMsg}/>) : null}
        <Flex w="100%" justify="space-between" gap={'md'} pl={'md'} pr={'md'}
        align="center" m='xs'>
            <TextInput
                value={inputText}
                onChange={(event) => setInputText(event.currentTarget.value)}
                radius="md"
                size="md"
                w="100%"
                placeholder={props.replyToMsg ? ("Reply to " + props.replyToMsg.userInfo.displayName) : ("Chat in " + config.chatChannel)}
                rightSectionWidth={42}
                onKeyDown={event => {
                    if (event.key == "Enter") {
                        sendMessage(inputText, false)
                    }
                }}
                leftSection={props.replyToMsg ? 
                (<ActionIcon variant="subtle" onClick={() => {props.setReplyMsg(undefined)}}>
                    <IconX style={{ width: rem(18), height: rem(18) }} stroke={1.5}/>
                </ActionIcon>) : null}
                rightSection={
                    <ActionIcon size={32} radius="xl" variant="filled" color='primary' onClick={() => {sendMessage(inputText, true)}}>
                        <IconSend style={{ width: rem(18), height: rem(18) }} stroke={1.5}/>
                    </ActionIcon>
                }
            />
            <ChannelPicker setReplyMsg={props.setReplyMsg}/>
            <ActionIcon variant="transparent" onClick={() => {props.setReplyMsg(undefined);props.close();}} color='primary'>
                <IconX style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
            </ActionIcon>
        </Flex>
        </Stack>
        );}