import { useState, useEffect, useContext } from 'react';
import { TextInput, Textarea, Checkbox, Button, Group, Stack, Text, Title, Badge, ActionIcon, TagsInput, Fieldset } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import { ModActions } from './modactions';
import { ConfigContext, ChatEmotesContext, LoginContextContext } from '../../../ApplicationContext';
import { HeheChatMessage, parseMessage } from '../../../commons/message';
import { OverlayDrawer } from '../../../pages/Chat.page';
import { Storage } from '../chatstorage';
import { param, query } from '../../../commons/helper';

export const MassBanDrawer: OverlayDrawer = {
    name: 'massban',
    component: MassBanView,
    size: 'xl',
    position: 'bottom'
};

interface MassBanViewProps {
    close: () => void;
    modActions: ModActions;
    channelId: string;
    channelName: string;
}

interface UserToModerate {
    userId: string;
    displayName: string;
    userName: string;
    found: boolean;
}

// Function to find a user by name using the API
const findUserByName = async (username: string): Promise<{ userId: string, found: boolean }> => {
    const state = localStorage.getItem('hehe-token_state') || '';
    try {
        const response = await fetch(
            import.meta.env.VITE_BACKEND_URL + "/api/user/findByName?" + 
            query([param("username", username), param("token", state)])
        );
        
        if (response.status === 404) {
            // User not found
            return { userId: "", found: false };
        }
        
        const data = await response.json();
        return { userId: data.userId, found: true };
    } catch (error) {
        console.error('Error finding user:', error);
        return { userId: "", found: false };
    }
};

export function MassBanView(props: MassBanViewProps) {
    const [searchPhrase, setSearchPhrase] = useState('');
    const [banReason, setBanReason] = useState('');
    const [banInAllChannels, setBanInAllChannels] = useState(false);
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
    const [usersToModerate, setUsersToModerate] = useState<UserToModerate[]>([]);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [messages, setMessages] = useState<HeheChatMessage[]>([]);
    
    const config = useContext(ConfigContext);
    const emotes = useContext(ChatEmotesContext);
    const login = useContext(LoginContextContext);
    
    // Get all channels the user moderates
    const moderatedChannels = login.moderatedChannels || [];
    
    // Initialize selected channels with current channel
    useEffect(() => {
        if (props.channelName && !selectedChannels.includes(props.channelName)) {
            const selectedChannelsData = localStorage.getItem('hehechat-massban-channels');
            const selectedChannels = selectedChannelsData ? JSON.parse(selectedChannelsData) : [props.channelName];
            setSelectedChannels(selectedChannels);
        }
    }, [props.channelName]);
    
    // Load messages from ChatStorage
    useEffect(() => {
        const loadMessages = async () => {
            try {
                // Use the Storage.load method to get messages
                const rawMessages = await Storage.load(
                    config.channels, 
                    config.ignoredUsers, 
                    config.maxMessages
                );
                
                // Parse the raw messages and filter for chat messages only
                const parsedMessages = rawMessages.map(parseMessage);
                const chatMessages = parsedMessages.filter(msg => msg.type === 'chat') as HeheChatMessage[];
                
                setMessages(chatMessages);
            } catch (error) {
                console.error('Error loading messages:', error);
            }
        };
        
        loadMessages();
    }, [config.channels, config.ignoredUsers, 200]);

    // Search for messages matching the phrase
    const searchMessages = () => {
        if (!searchPhrase.trim()) return;
        
        setIsSearching(true);
        
        // Filter messages that contain the search phrase (case insensitive)
        const matchingMessages = messages.filter(msg => 
            msg.text.toLowerCase().includes(searchPhrase.toLowerCase())
        );
        
        // Group by user
        const userMap = new Map<string, UserToModerate>();
        
        matchingMessages.forEach(msg => {
            const userId = msg.userInfo.userId;
            
            if (!userMap.has(userId)) {
                userMap.set(userId, {
                    userId,
                    displayName: msg.userInfo.displayName,
                    userName: msg.userInfo.userName,
                    found: true
                });
            }
        });
        
        setUsersToModerate(Array.from(userMap.values()));
        setIsSearching(false);
    };
    
    // Remove a user from the list
    const removeUser = (userId: string) => {
        setUsersToModerate(users => users.filter(user => user.userId !== userId));
    };
    
    // Get user display names for TagsInput
    const getUserDisplayNames = () => {
        return usersToModerate.map(user => user.displayName);
    };
    
    // Handle TagsInput changes
    const handleUserTagsChange = async (usernames: string[]) => {
        // First, keep existing users whose display names are still in the list
        const existingUsers = usersToModerate.filter(user => 
            usernames.includes(user.displayName)
        );
        
        // Find new usernames that don't match existing users
        const existingNames = existingUsers.map(user => user.displayName);
        const newUsernames = usernames.filter(name => !existingNames.includes(name));
        
        // Create temporary user objects for the new usernames
        const tempNewUsers = newUsernames.map(username => ({
            userId: "", // Temporary ID until we get the real one
            displayName: username,
            userName: username.toLowerCase(),
            found: false
        }));
        
        // Add the temporary users to state
        setUsersToModerate([...existingUsers, ...tempNewUsers]);
        
        // Find the real userIds for the new usernames
        const userPromises = newUsernames.map(async (username) => {
            const result = await findUserByName(username);
            return {
                userId: result.userId,
                displayName: username,
                userName: username.toLowerCase(),
                found: result.found
            };
        });
        
        // Wait for all the user lookups to complete
        const resolvedUsers = await Promise.all(userPromises);
        
        // Update the state with the resolved users
        setUsersToModerate(current => {
            // Keep users that weren't just added
            const oldUsers = current.filter(user => 
                !newUsernames.includes(user.displayName)
            );
            
            // Combine with the newly resolved users
            return [...oldUsers, ...resolvedUsers];
        });
    };
    
    // Execute the mass ban
    const executeMassBan = () => {
        // Close confirmation dialog
        setShowConfirmation(false);
        
        // Filter out users that couldn't be found (userId === "-1")
        const usersToActuallyBan = usersToModerate.filter(user => user.found);
        
        if (banInAllChannels) {
            // Ban in all moderated channels
            moderatedChannels.forEach(channel => {
                usersToActuallyBan.forEach(user => {
                    props.modActions.banUser(channel.id, user.userId, banReason);
                });
            });
        } else if (selectedChannels.length > 0) {
            // Ban in selected channels
            const channelMap = new Map(moderatedChannels.map(channel => [channel.name.toLowerCase(), channel.id]));
            
            selectedChannels.forEach(channelName => {
                const channelId = channelName === props.channelName ? props.channelId : channelMap.get(channelName.toLowerCase());
                if (channelId) {
                    usersToActuallyBan.forEach(user => {
                        props.modActions.banUser(channelId, user.userId, banReason);
                    });
                }
            });
        } else {
            // Ban only in current channel
            usersToActuallyBan.forEach(user => {
                props.modActions.banUser(props.channelId, user.userId, banReason);
            });
        }
    };
    
    // Reset state when component unmounts
    useEffect(() => {
        return () => {
            setSearchPhrase('');
            setBanReason('');
            setBanInAllChannels(false);
            setUsersToModerate([]);
            setShowConfirmation(false);
        };
    }, []);
    
    return (
        <Stack justify='space-between' h="100%" gap="xs">
            <Group justify='space-between' p='md'>
                <Title order={4}>
                    Mass Ban Tool
                </Title>
                {props.close ? 
                <Button onClick={props.close} variant='subtle' color='primary'>
                    <IconX />
                </Button> : <span></span>
                }
            </Group>
            <Stack p="md" style={{ flex: 1, overflow: 'auto' }}>
                <Text size="sm" color="dimmed" mb="md">
                    Search for messages to find users or manually select channels to ban in.
                </Text>
                    <Stack gap="md">
                        <Fieldset legend="Search for users (optional)" variant="filled" mb="md">
                            <Text size="sm" color="dimmed" mb="xs">
                                Search chat history for messages containing specific text.
                            </Text>
                            <TextInput
                                placeholder="Enter text to search for"
                                value={searchPhrase}
                                onChange={(e) => setSearchPhrase(e.currentTarget.value)}
                                rightSection={
                                    <ActionIcon 
                                        onClick={searchMessages} 
                                        disabled={!searchPhrase.trim() || isSearching}
                                        loading={isSearching}
                                    >
                                        <IconSearch size="1.1rem" />
                                    </ActionIcon>
                                }
                            />
                        </Fieldset>
                        
                        <Fieldset legend="Users to ban" variant="filled" mb="md">
                            <TagsInput
                                label={`Users selected: ${usersToModerate.length}`}
                                placeholder="Type username and press Enter to add"
                                description="Add usernames manually or use search to find users"
                                value={getUserDisplayNames()}
                                onChange={handleUserTagsChange}
                                mb="md"
                                clearable
                            />
                            
                            {usersToModerate.some(user => !user.found) && (
                                <Text color="orange" size="sm" mt="xs">
                                    Users not found: {usersToModerate.filter(user => !user.found).map(user => user.displayName).join(', ')}
                                </Text>
                            )}
                        </Fieldset>
                        
                        <Fieldset legend="Ban settings" variant="filled" mb="md">
                            <Textarea
                                label="Ban reason"
                                placeholder="Why are these users being banned?"
                                value={banReason}
                                onChange={(e) => setBanReason(e.currentTarget.value)}
                                minRows={2}
                            />
                            
                            <Stack gap="xs" mt="md">
                                <Checkbox
                                    label={`Ban users in all channels I moderate (${moderatedChannels.length} channels)`}
                                    checked={banInAllChannels}
                                    onChange={(e) => {
                                        setBanInAllChannels(e.currentTarget.checked);
                                    }}
                                />
                                
                                {!banInAllChannels && (
                                    <>
                                        <Text size="sm" fw={500}>Or select specific channels to ban in:</Text>
                                        <TagsInput
                                            placeholder="Add channel names"
                                            value={selectedChannels}
                                            onChange={(channels) => {
                                                const newChannels = channels.map(c => c.toLowerCase().substring(0, 25).trim());
                                                localStorage.setItem('hehechat-massban-channels', JSON.stringify(newChannels));
                                                setSelectedChannels(newChannels);                
                                            }}
                                            disabled={banInAllChannels}
                                            data={moderatedChannels.map(channel => channel.name)}
                                        />
                                    </>
                                )}
                            </Stack>
                            
                            <Group justify="flex-end" mt="md">
                                <Button variant="outline" onClick={props.close}>Cancel</Button>
                                <Button 
                                    color="red" 
                                    onClick={() => setShowConfirmation(true)}
                                    disabled={usersToModerate.length === 0 || (selectedChannels.length === 0 && !banInAllChannels)}
                                >
                                    Ban {usersToModerate.filter(user => user.found).length} Users
                                </Button>
                            </Group>
                        </Fieldset>
                    </Stack>
            </Stack>
            
            {/* Confirmation Dialog */}
            {showConfirmation && (
                <Stack p="md" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
                    <Text fw={700} color="red">Confirm Mass Ban</Text>
                    <Text>
                        Are you sure you want to ban {usersToModerate.filter(user => user.found).length} users
                        {banInAllChannels 
                            ? ` across ${moderatedChannels.length} channels` 
                            : selectedChannels.length > 0 
                                ? ` in ${selectedChannels.length} selected channels (${selectedChannels.join(', ')})` 
                                : ` in ${props.channelName}`}?
                    </Text>
                    
                    {usersToModerate.some(user => !user.found) && (
                        <Text color="orange">
                            Note: {usersToModerate.filter(user => !user.found).length} users could not be found and will not be banned.
                        </Text>
                    )}
                    
                    <Text fw={500}>This action cannot be undone.</Text>
                    
                    <Group justify="flex-end" mt="md">
                        <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                            Cancel
                        </Button>
                        <Button color="red" onClick={executeMassBan}>
                            Confirm Ban
                        </Button>
                    </Group>
                </Stack>
            )}
        </Stack>
    );
}
