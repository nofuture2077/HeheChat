import { useContext, useEffect, useState } from 'react';
import { Menu, Image } from '@mantine/core';
import { ChatEmotesContext } from '@/ApplicationContext';
import classes from './ChannelPicker.module.css';

export interface ChannelPickerProps {
  channels: string[];
  value: string | undefined;
  onChange: (channel: string)  => void;
  disabled?: boolean;
}

export function ChannelPicker(props: ChannelPickerProps) {
    const chatEmotes = useContext(ChatEmotesContext);
    const [isFirefox, setIsFirefox] = useState(false);

    // Detect Firefox browser
    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        setIsFirefox(userAgent.includes('firefox'));
    }, []);

    const items = props.channels.map((item) => (
      <Menu.Item
        w={32}
        h={32}
        p={0}
        m={12}
        onClick={() => {props.onChange(item)}}
        key={item}
        className={classes.menuItem}
      >
        <Image src={chatEmotes.getLogo(item)?.props.src} width={38} height={38} style={{borderRadius: 19}}/>
      </Menu.Item>
    ));
    
    return (
      <Menu 
        withinPortal={!isFirefox} // Disable portal for Firefox
        disabled={props.disabled}
        position="bottom-start"
        shadow="md"
        zIndex={1000} // Ensure high z-index for expanded mode
      >
        <Menu.Target>
            {props.value ?
              <Image
                src={chatEmotes.getLogo(props.value)?.props.src}
                width={44}
                height={44}
                style={{display: 'block'}}
                className={classes.channelImage}
              /> :
              <Image
                width={44}
                height={44}
                style={{display: 'block'}}
                className={classes.channelImage}
              />
            }
        </Menu.Target>
        <Menu.Dropdown className={classes.dropdown}>{items}</Menu.Dropdown>
      </Menu>
    );
  }
