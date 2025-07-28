import { useContext, useState, useEffect, useMemo } from 'react';
import { ConfigContext, ChatEmotesContext, LoginContextContext } from '../../ApplicationContext';
import { ChannelPicker } from './ChannelPicker';
import { Textarea, ActionIcon, rem, Flex, Stack, Combobox, useCombobox } from '@mantine/core';
import { EmoteGrid } from './EmoteGrid';
import { IconSend, IconX, IconMoodSmile } from '@tabler/icons-react';
import { HeheChatMessage } from '../../commons/message';
import { ChatMessageComp } from './ChatMessage';
import classes from './ChatMessage.module.css';
import inputClasses from './ChatInput.module.css';
import { ModActions } from './mod/modactions';
import { getUserId } from '@/components/chat/mod/modactions';

interface ChatInputProps { 
    close: () => void, 
    replyToMsg?: HeheChatMessage, 
    setReplyMsg: (msg?: HeheChatMessage) => void,
    openModView: (channel: string, channelId: string, username: string) => void;
    modActions: ModActions;
    usernames: string[];
}

export function ChatInput(props: ChatInputProps) {
    const config = useContext(ConfigContext);
    const emotes = useContext(ChatEmotesContext);
    const [inputText, setInputText] = useState<string>('');
    
    const [messageHistory, setMessageHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const [isEmoteGridOpen, setIsEmoteGridOpen] = useState<boolean>(false);
    const [manuallyClosedEmoteGrid, setManuallyClosedEmoteGrid] = useState<boolean>(false);

    // Load message history from localStorage on component mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('hehe-chatMessageHistory');
        if (savedHistory) {
            setMessageHistory(JSON.parse(savedHistory));
        }
    }, []);

    // Save message history to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('hehe-chatMessageHistory', JSON.stringify(messageHistory));
    }, [messageHistory]);
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption()
    });

    // Get the current word being typed
    const currentWord = useMemo(() => {
        const words = inputText.split(' ');
        return words[words.length - 1];
    }, [inputText]);

    // Reset manually closed state when input changes significantly
    useEffect(() => {
        if (manuallyClosedEmoteGrid) {
            // Reset if the current word becomes empty or very short
            if (currentWord.length < 2) {
                setManuallyClosedEmoteGrid(false);
            }
        }
    }, [currentWord, manuallyClosedEmoteGrid]);

    interface Command {
        value: string;
        label: string;
    }
    
    const commands: Command[] = [
        { value: '/raid', label: '/raid [username] - Raid another channel' },
        { value: '/unraid', label: '/unraid - Cancel an ongoing raid' },
        { value: '/shoutout', label: '/shoutout [channelname] - Shoutout another channel' },
        { value: '/user', label: '/user [username] - Show user details' },
        { value: '/ban', label: '/ban [username] - Ban a user' },
        { value: '/timeout', label: '/timeout [username] [seconds] - Timeout a user for specified duration' }
    ];

    const loginContext = useContext(LoginContextContext);

    const isBroadcaster = (channelId: string) => {
        return loginContext.user?.id === channelId;
    };

    const isModerator = (channelname: string) => {
        return loginContext.moderatedChannels.map(ch => ch.id).includes(channelname);
    };

    const executeCommand = async (command: string) => {
        const [cmd, ...args] = command.slice(1).split(' ');
        const channelname = config.getChatChannel();
        const channelId = emotes.getChannelId(channelname || '');
        const isMod = isModerator(channelId);
        
        // Check if user has permission to execute the command
        if (cmd === 'raid') {
            if (!isBroadcaster(channelId)) {
                console.log('Only broadcasters can use the raid command');
                return true;
            }
        } else if (!isMod && !isBroadcaster(channelId)) {
            console.log('Only moderators and broadcasters can use this command');
            return true;
        }

        switch (cmd) {
            case 'raid':
                if (args.length > 0) {
                    const data = await getUserId(args[0]);
                    const channelId = emotes.getChannelId(config.getChatChannel() || '');
                    props.modActions.raidUser(channelId, data.userId);
                }
                break;
            case 'unraid':
                const channelId = emotes.getChannelId(config.getChatChannel() || '');
                props.modActions.unraid(channelId);
                break;
            case 'shoutout':
                if (args.length > 0) {
                    const data = await getUserId(args[0]);
                    const channelId = emotes.getChannelId(config.getChatChannel() || '');
                    props.modActions.shoutoutUser(channelId, data.userId);
                }
                break;
            case 'ban':
                if (args.length >= 2) {
                    const data = await getUserId(args[0]);
                    const channelId = emotes.getChannelId(config.getChatChannel() || '');
                    props.modActions.banUser(channelId, data.userId, "Banned via HeheChat");
                }
                break;
            case 'timeout':
                if (args.length >= 1) {
                    const data = await getUserId(args[0]);
                    const duration = parseInt(args[1], 10);
                    const channelId = emotes.getChannelId(config.getChatChannel() || '');
                    if (!isNaN(duration)) {
                        props.modActions.timeoutUser(channelId, data.userId, duration, "Timed out via HeheChat");
                    }
                }
                break;
            case 'user':
                if (args.length >= 1) {
                    const username = args[0];
                    const channel = config.getChatChannel() || '';
                    const channelId = emotes.getChannelId(channel);
                    props.openModView(channel, channelId, username);
                }
                break;
            default:
                return false;
        }
        return true;
    }

    const chatChannel = config.getChatChannel();
    const sendMessage = async (text: string, close: boolean) => {
        // Add message to history if it's not empty and different from the last message
        if (text.trim() && (messageHistory.length === 0 || messageHistory[messageHistory.length - 1] !== text)) {
            // Keep only the last 20 messages
            const newHistory = [...messageHistory, text].slice(-20);
            setMessageHistory(newHistory);
        }
        if (text.startsWith('/')) {
            if (await executeCommand(text)) {
                setInputText('');
                props.setReplyMsg(undefined);
                if (close) props.close();
                return;
            }
        }
        
        const channel = emotes.getChannelId(chatChannel || '');
        if (channel && text) {
            config.fireMessage(channel, text, props.replyToMsg?.id);
        }
        setInputText('');
        props.setReplyMsg(undefined);
        if (close)
            props.close();
    }

    interface ComboboxItem {
        value: string;
        label: string;
    }

    const getFilteredItems = (): ComboboxItem[] => {
        const words = inputText.split(' ');
        const currentWord = words[words.length - 1];
        
        // Handle command autocomplete
        if (currentWord.startsWith('/')) {
            const channelId = emotes.getChannelId(config.getChatChannel() || '');
            const isBroadcasterStatus = isBroadcaster(channelId);
            const isModeratorStatus = isModerator(channelId);

            const availableCommands = commands.filter(cmd => {
                if (cmd.value === '/raid') {
                    return isBroadcasterStatus;
                }
                if (cmd.value === '/unraid') {
                    return isBroadcasterStatus || isModeratorStatus;
                }
                return isBroadcasterStatus || isModeratorStatus;
            });

            return availableCommands
                .filter(cmd => cmd.value.toLowerCase().includes(currentWord.toLowerCase()))
                .map(cmd => ({ value: cmd.value, label: cmd.label }));
        }
        
        // Handle username autocomplete for @ mentions
        if (currentWord.includes('@')) {
            // If the word is just @ or ends with @, show all usernames
            if (currentWord === '@' || currentWord.endsWith('@')) {
                return props.usernames
                    .slice(0, 5)
                    .map(username => ({ value: '@' + username, label: '@' + username }));
            }
            
            // Otherwise filter based on text after @
            const filterText = currentWord.split('@')[1] || '';
            return props.usernames
                .filter(username => 
                    username.toLowerCase().includes(filterText.toLowerCase())
                )
                .slice(0, 5)
                .map(username => ({ value: '@' + username, label: '@' + username }));
        }
        
        // Handle username autocomplete for commands that expect usernames
        const commandMatch = words[0];
        if (commandMatch?.startsWith('/')) {
            const commandDef = commands.find(cmd => cmd.value === commandMatch);
            if (commandDef?.label.includes('[username]')) {
                // Don't show usernames if we're still typing the command
                if (words.length === 1 && currentWord === commandMatch) {
                    return [];
                }
                
                // Show all usernames if we're right after the command and there's a space
                if (inputText.endsWith(' ')) {
                    return props.usernames
                        .slice(0, 5)
                        .map(username => ({ value: username, label: username }));
                }
                
                // Filter usernames based on input after command
                if (words.length > 1) {
                    const filterText = currentWord;
                    
                    return props.usernames
                        .filter(username => 
                            !filterText || username.toLowerCase().includes(filterText.toLowerCase())
                        )
                        .slice(0, 5)
                        .map(username => ({ value: username, label: username }));
                }
            }
        }
        
        return [];
    };

    const filtered = getFilteredItems();

    // Get filtered emote list - show when typing (3+ chars) OR when manually opened
    const filteredEmotes = useMemo(() => {
        if (!chatChannel) return new Map();
        if (isEmoteGridOpen) {
            // When manually opened, use the last typed word as filter (if it exists)
            return emotes.getEmoteList(chatChannel, currentWord);
        }
        // When typing, show filtered emotes (3+ chars) but not if manually closed recently
        if (manuallyClosedEmoteGrid || currentWord.length < 3) return new Map();
        return emotes.getEmoteList(chatChannel, currentWord);
    }, [chatChannel, currentWord, emotes, isEmoteGridOpen, manuallyClosedEmoteGrid]);

    const handleEmoteSelect = (emoteName: string) => {
        if (isEmoteGridOpen) {
            // When manually opened, replace the current word (if it exists) or append
            const words = inputText.split(' ');
            if (currentWord.length > 0) {
                // Replace the current word
                words[words.length - 1] = emoteName;
                setInputText(words.join(' ') + ' ');
            } else {
                // Just append the emote
                setInputText(inputText + emoteName + ' ');
            }
            setIsEmoteGridOpen(false);
        } else {
            // When typing, replace the current word
            const words = inputText.split(' ');
            words[words.length - 1] = emoteName;
            setInputText(words.join(' ') + ' ');
        }
    };

    const toggleEmoteGrid = () => {
        setIsEmoteGridOpen(!isEmoteGridOpen);
        // Reset manually closed state when opening
        if (!isEmoteGridOpen) {
            setManuallyClosedEmoteGrid(false);
        }
    };

    const handleEmoteGridClose = () => {
        setIsEmoteGridOpen(false);
        setManuallyClosedEmoteGrid(true);
    };


    // If rain mode is enabled, don't render the chat input
    if (config.rainMode) {
        return null;
    }

    return (
        <Stack gap={0} className={inputClasses.chatInput}>
            {props.replyToMsg ? (<ChatMessageComp msg={props.replyToMsg} openModView={() => { }} moderatedChannel={{}} hideReply={true} deletedMessages={{}} setReplyMsg={props.setReplyMsg} modActions={props.modActions} />) : null}
            <Flex justify="space-between" gap={'md'} align="center" m="6px 12px 22px 12px">
                <Combobox
                    store={combobox}
                    onOptionSubmit={(value) => {
                        const words = inputText.split(' ');
                        const currentWord = words[words.length - 1];
                        
                        // Replace only the last word with the selected value and add a space
                        if (words.length > 1) {
                            words[words.length - 1] = value;
                            setInputText(words.join(' ') + ' ');
                        } else {
                            setInputText(value + ' ');
                        }
                        
                        combobox.closeDropdown();
                    }}
                >
                    <Combobox.Target>
                        <Textarea
                            value={inputText}
                            onChange={(event) => {
                                const newValue = event.currentTarget.value;
                                setInputText(newValue);
                                
                                const items = getFilteredItems();

                                if (items.length > 0) {
                                    combobox.openDropdown();
                                } else {
                                    combobox.closeDropdown();
                                }
                            }}
                            radius="md"
                            size="md"
                            w="100%"
                            autosize
                            minRows={1}
                            maxRows={3}
                            placeholder={props.replyToMsg ? ("Reply to " + props.replyToMsg.userInfo.displayName + " in " + chatChannel) : ("Chat in " + chatChannel)}
                            rightSectionWidth={84}
                            onKeyDown={event => {
                                if (event.key === "Enter") {
                                    // If combobox is open with exactly one option, select it
                                    if (combobox.dropdownOpened && filtered.length === 1) {
                                        const value = filtered[0].value;
                                        const words = inputText.split(' ');
                                        if (words.length > 1) {
                                            words[words.length - 1] = value;
                                            setInputText(words.join(' ') + ' ');
                                        } else {
                                            setInputText(value + ' ');
                                        }
                                        combobox.closeDropdown();
                                        event.preventDefault();
                                        return false;
                                    }
                                    // Only send message if combobox is closed
                                    if (!combobox.dropdownOpened) {
                                        sendMessage(inputText, false);
                                        setHistoryIndex(-1);
                                        event.preventDefault();
                                        return false;
                                    }
                                } else if (event.key === "ArrowUp") {
                                    event.preventDefault();
                                    if (messageHistory.length > 0) {
                                        const newIndex = historyIndex === -1 ? 
                                            messageHistory.length - 1 : 
                                            Math.max(0, historyIndex - 1);
                                        setHistoryIndex(newIndex);
                                        setInputText(messageHistory[newIndex]);
                                    }
                                } else if (event.key === "ArrowDown") {
                                    event.preventDefault();
                                    if (historyIndex >= 0) {
                                        const newIndex = historyIndex + 1;
                                        if (newIndex >= messageHistory.length) {
                                            setHistoryIndex(-1);
                                            setInputText('');
                                        } else {
                                            setHistoryIndex(newIndex);
                                            setInputText(messageHistory[newIndex]);
                                        }
                                    }
                                }
                            }}
                            leftSection={props.replyToMsg ?
                                (<ActionIcon variant="subtle" onClick={() => { props.setReplyMsg(undefined) }}>
                                    <IconX style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                                </ActionIcon>) : 
                                <div className={inputClasses.channelPickerWrapper}>
                                    <ChannelPicker 
                                        onChange={(item) => { 
                                            props.setReplyMsg(undefined); 
                                            config.setChatChannel(item) 
                                        }} 
                                        channels={config.channels} 
                                        value={chatChannel} 
                                    />
                                </div>}
                            rightSection={
                                <Flex gap={4} align="center">
                                    <ActionIcon 
                                        size={32} 
                                        radius="xl" 
                                        variant="transparent" 
                                        color={'primary'} 
                                        onClick={toggleEmoteGrid}
                                    >
                                        <IconMoodSmile style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                                    </ActionIcon>
                                    <ActionIcon size={32} radius="xl" variant="transparent" color='primary' onClick={() => { sendMessage(inputText, false) }}>
                                        <IconSend style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                                    </ActionIcon>
                                </Flex>
                            }
                        />
                    </Combobox.Target>

                    {filtered.length ? 
                    (<Combobox.Dropdown className={inputClasses.comboboxDropdown}>
                        <Combobox.Options>
                            {filtered.map((item: ComboboxItem) => (
                                <Combobox.Option value={item.value} key={item.value}>
                                    {item.label}
                                </Combobox.Option>
                            ))}
                        </Combobox.Options>
                    </Combobox.Dropdown>) : null}
                </Combobox>
                <EmoteGrid
                    channel={chatChannel || ''}
                    searchText={currentWord}
                    onEmoteSelect={handleEmoteSelect}
                    emoteList={filteredEmotes}
                    isManuallyOpen={isEmoteGridOpen}
                    onClose={handleEmoteGridClose}
                />
            </Flex>
        </Stack>
    );
}
