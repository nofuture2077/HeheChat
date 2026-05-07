import { Slider, Stack, Button, Fieldset } from '@mantine/core';
import { IconReload } from '@tabler/icons-react';
import { ColorSchemeToggle } from '../../colorscheme/colorscheme';
import { useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';

export function GeneralUISettings() {
    const config = useContext(ConfigContext);
    const marks = [14, 18, 22, 26].map(x => ({ value: x, label: x + "px" }));

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Hehechat" variant='filled'>
                <Stack>
                    <Button variant="light" leftSection={<IconReload size={14} />} onClick={() => window.location.reload()}>Reload</Button>
                </Stack>
            </Fieldset>

            <Fieldset legend="Font Size" variant='filled'>
                <Slider w="calc(100% - 20px)" m="10" value={config.fontSize} onChange={config.setFontSize} min={14} max={26} label={(value) => `${value} px`} marks={marks} />
            </Fieldset>

            <Fieldset legend="Color Mode" variant='filled'>
                <ColorSchemeToggle />
            </Fieldset>
        </Stack>
    );
}
