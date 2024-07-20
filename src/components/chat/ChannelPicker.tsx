import { useState, useContext } from 'react';
import { Menu, Image } from '@mantine/core';
import { ChatEmotes, ChatConfigContext } from '@/ApplicationContext';


export function ChannelPicker() {
    const chatEmotes = useContext(ChatEmotes);
    const config = useContext(ChatConfigContext);

    const [opened, setOpened] = useState(false);
    const chatChannel = config.getChatChannel();
    if (!chatChannel) {
        return <span></span>
    }
    const items = config.channels.map((item) => (
      <Menu.Item
        w={32}
        h={32}
        p={0}
        m={12}
        onClick={() => config.setChatChannel(item)}
        key={item}
      >
        <Image src={chatEmotes.getLogo(item)?.props.src} width={32} height={32} style={{borderRadius: 16}}/>
    </Menu.Item>
    ));
    return (
      <Menu
        onOpen={() => setOpened(true)}
        onClose={() => setOpened(false)}
        withinPortal
      >
        <Menu.Target>
            <Image src={chatEmotes.getLogo(chatChannel)?.props.src} width={32} height={32} style={{borderRadius: 16}}/>
        </Menu.Target>
        <Menu.Dropdown bg='black'>{items}</Menu.Dropdown>
      </Menu>
    );
  }