import { ChatClient, ChatMessage, ClearChat } from '@twurple/chat';
import { StaticAuthProvider } from '@twurple/auth';

let chatClient: ChatClient;
let newMessages: ChatMessage[] = [];

self.onmessage = async (e) => {
  const { type, data } = e.data;

  switch (type) {
    case 'INIT':
      const authProvider = new StaticAuthProvider(data.clientId, data.accessToken);
      chatClient = new ChatClient({
        channels: data.channels,
        authProvider: authProvider,
        rejoinChannelsOnReconnect: true
      });
      await chatClient.connect();
      chatClient.onMessage((channel, user, text, msg) => {
        if (data.ignoredUsers.indexOf(user) !== -1) return;
        newMessages.push(msg);
        self.postMessage({ type: 'NEW_MESSAGE', data: msg.rawLine });
      });
      chatClient.onMessageRemove((channel, id, deleteMessage) => {
        self.postMessage({ type: 'DELETED_MESSAGE', data: {
          channel,
          channelId: deleteMessage.channelId,
          msgId: id,
          username: deleteMessage.userName,
          date: deleteMessage.date
        } });
      });
      chatClient.onBan((channel, user, msg) => {
        self.postMessage({ type: 'BAN_MESSAGE', data: {
          channel,
          channelId: msg.channelId,
          userId: msg.targetUserId,
          username: user,
          date: msg.date
        } });
      });
      chatClient.onTimeout((channel, user, duration, msg) => {
        self.postMessage({ type: 'TIMEOUT_MESSAGE', data: {
          channel,
          channelId: msg.channelId,
          username: user,
          userId: msg.targetUserId,
          duration: duration * 1000,
          date: msg.date
        } });
      });
      chatClient.onRaid((channel, user, raidInfo, msg) => {
        self.postMessage({ type: 'RAID_MESSAGE', data: {
          channel,
          channelId: msg.channelId,
          username: user,
          date: msg.date,
          viewerCount: raidInfo.viewerCount
        } });
      });
      break;

    case 'SEND_MESSAGE':
      chatClient.say(data.channel, data.text, { replyTo: data.replyTo });
      break;

    case 'JOIN_CHANNEL':
      chatClient.join(data.channel);
      break;

    case 'LEAVE_CHANNEL':
      chatClient.part(data.channel);
      break;

    case 'GET_MESSAGES':
      self.postMessage({ type: 'ALL_MESSAGES', data: newMessages.map(m => m.rawLine) });
      break;

    case 'GET_CHANNELS':
      self.postMessage({
        type: 'CHANNELS', data: {
          targetChannels: data.targetChannels,
          currentChannels: chatClient.currentChannels.map(s => s.slice(1))
        }
      });
      break;

    case 'STOP':
      chatClient.quit();
      close(); // Terminates the worker
      break;

    default:
      break;
  }
};
