import { Stack, Fieldset } from '@mantine/core';
import { ColorSchemeToggle } from '../../colorscheme/colorscheme';

export function GeneralUISettings() {
    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Color Mode" variant='filled'>
                <ColorSchemeToggle />
            </Fieldset>
        </Stack>
    );
}
