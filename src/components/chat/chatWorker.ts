import { ChatClient, ChatMessage, parseTwitchMessage } from '@twurple/chat';
import { StaticAuthProvider, AuthProvider } from '@twurple/auth';

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
      break;

    case 'SEND_MESSAGE':
        chatClient.say(data.channel, data.text);
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
      self.postMessage({ type: 'CHANNELS', data: {
        targetChannels: data.targetChannels,
        currentChannels: chatClient.currentChannels.map(s => s.slice(1))
      } });
      break;

    case 'STOP':
      chatClient.quit();
      close(); // Terminates the worker
      break;

    default:
      break;
  }
};
