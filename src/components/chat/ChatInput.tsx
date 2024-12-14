import { useContext, useState } from 'react';
import { ConfigContext, ChatEmotesContext } from '../../ApplicationContext';
import { ChannelPicker } from './ChannelPicker';
import { Textarea, ActionIcon, rem, Flex, Stack } from '@mantine/core'
import { IconSend, IconX } from '@tabler/icons-react';
import { HeheChatMessage } from '../../commons/message';
import { ChatMessageComp } from './ChatMessage';

export function ChatInput(props: { close: () => void, replyToMsg?: HeheChatMessage, setReplyMsg: (msg?: HeheChatMessage) => void }) {
    const config = useContext(ConfigContext);
    const emotes = useContext(ChatEmotesContext);
    const [inputText, setInputText] = useState<string>('');
    const chatChannel = config.getChatChannel();
    const sendMessage = (text: string, close: boolean) => {
        const channel = emotes.getChannelId(chatChannel || '');
        if (channel && text) {
            config.fireMessage(channel, text, props.replyToMsg?.id);
        }
        setInputText('');
        props.setReplyMsg(undefined);
        if (close)
            props.close();
    }
    const modActions = {
        deleteMessage: () => { },
        timeoutUser: () => { },
        banUser: () => { },
        shoutoutUser: () => { },
        raidUser: () => new Promise<void>(() => { })
    };
    return (
        <Stack gap={0}>
            {props.replyToMsg ? (<ChatMessageComp msg={props.replyToMsg} openModView={() => { }} moderatedChannel={{}} hideReply={true} deletedMessages={{}} setReplyMsg={props.setReplyMsg} modActions={modActions} />) : null}
            <Flex w="100%" justify="space-between" gap={'md'} pl={'md'} pr={'xl'}
                align="center" m='xs'>
                <Textarea
                    value={inputText}
                    onChange={(event) => setInputText(event.currentTarget.value)}
                    radius="md"
                    size="md"
                    w="100%"
                    autosize
                    minRows={1}
                    maxRows={3}
                    placeholder={props.replyToMsg ? ("Reply to " + props.replyToMsg.userInfo.displayName + " in " + chatChannel) : ("Chat in " + chatChannel)}
                    rightSectionWidth={42}
                    onKeyDown={event => {
                        if (event.key == "Enter") {
                            sendMessage(inputText, false);
                            event.preventDefault();
                            return false;
                        }
                    }}
                    leftSection={props.replyToMsg ?
                        (<ActionIcon variant="subtle" onClick={() => { props.setReplyMsg(undefined) }}>
                            <IconX style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                        </ActionIcon>) : <ChannelPicker onChange={(item) => { props.setReplyMsg(undefined); config.setChatChannel(item) }} channels={config.channels} value={chatChannel} />}
                    rightSection={
                        <ActionIcon size={32} radius="xl" variant="transparent" color='primary' onClick={() => { sendMessage(inputText, false) }}>
                            <IconSend style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                        </ActionIcon>
                    }
                />
            </Flex>
        </Stack>
    );
}
