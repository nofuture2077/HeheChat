import { Slider, Stack, Text, Space } from '@mantine/core';
import { ColorSchemeToggle } from '../ColorSchemeToggle/ColorSchemeToggle';
import { useContext } from 'react';
import { ChatConfigContext } from '@/ApplicationContext';


export function UISettings() {
    const chatConfig = useContext(ChatConfigContext);
    const marks = [11, 12, 13, 14, 15, 16, 17, 18].map(x => ({value: x, label: x + "px"}));
    return (
    <Stack>
        
        <Text size="md">Font Size</Text>
        <Slider value={chatConfig.fontSize} onChange={chatConfig.setFontSize} min={11} max={18} label={(value) => `${value} px`} marks={marks} />
        <Space h={"md"}/>
        <Text size="md">Color Mode</Text>
        <ColorSchemeToggle/>
    </Stack>)
}