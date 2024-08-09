import { useContext } from 'react';
import { Menu, Image } from '@mantine/core';
import { ChatEmotesContext } from '@/ApplicationContext';

export interface ChannelPickerProps {
  channels: string[];
  value: string | undefined;
  onChange: (channel: string)  => void;
  disabled?: boolean;
}

export function ChannelPicker(props: ChannelPickerProps) {
    const chatEmotes = useContext(ChatEmotesContext);

    const items = props.channels.map((item) => (
      <Menu.Item
        w={32}
        h={32}
        p={0}
        m={12}
        onClick={() => {props.onChange(item)}}
        key={item}
      >
        <Image src={chatEmotes.getLogo(item)?.props.src} width={32} height={32} style={{borderRadius: 16}}/>
    </Menu.Item>
    ));
    return (
      <Menu withinPortal disabled={props.disabled}>
        <Menu.Target>
            {props.value ? <Image src={chatEmotes.getLogo(props.value)?.props.src} width={32} height={32} style={{borderRadius: 16}}/> : <Image width={32} height={32} style={{borderRadius: 16}}/>}
        </Menu.Target>
        <Menu.Dropdown>{items}</Menu.Dropdown>
      </Menu>
    );
  }