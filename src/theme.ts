import { createTheme, virtualColor } from '@mantine/core';

export const theme = createTheme({
  white: 'rgb(245, 245, 245)',
  black: 'rgb(30, 30, 30)',
  colors: {
      primary: virtualColor({
          name: 'primary',
          dark: 'gray',
          light: 'dark',
      }),
  },
});