export interface InitMessage {
    type: 'INIT';
    data: {
      channels: string[];
      ignoredUsers: string[];
      clientId: string;
      accessToken: string;
    };
  }
  
  export interface JoinChannelMessage {
    type: 'JOIN_CHANNEL';
    data: {
      channel: string;
    };
  }
  
  export interface LeaveChannelMessage {
    type: 'LEAVE_CHANNEL';
    data: {
      channel: string;
    };
  }

  export interface GetChannelsMessage {
    type: 'GET_CHANNELS';
    data: {
      targetChannels: string[];
    };
  }
  
  export interface GetMessagesMessage {
    type: 'GET_MESSAGES';
  }
  
  export interface StopMessage {
    type: 'STOP';
  }
  
  export interface NewMessage {
    type: 'NEW_MESSAGE';
    data: string;
  }

  export interface SendMessage {
    type: 'SEND_MESSAGE';
    data: {
        channel: string;
        text: string;
    };
  }
  
  export interface AllMessages {
    type: 'ALL_MESSAGES';
    data: string[];
  }

  export interface ChannelsMessage {
    type: 'CHANNELS';
    data: {
        currentChannels: string[];
        targetChannels: string[];
    };
  }
  
  export type WorkerMessage =
    | InitMessage
    | SendMessage
    | JoinChannelMessage
    | LeaveChannelMessage
    | GetMessagesMessage
    | StopMessage
    | GetChannelsMessage;
  
  export type WorkerResponse =
    | NewMessage
    | AllMessages
    | ChannelsMessage;
  