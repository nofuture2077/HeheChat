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
      skyblue: [
        "#e4ffff",
        "#d0fcff",
        "#a1f7fe",
        "#6ff3fd",
        "#4feffd",
        "#3fedfc",
        "#33ecfd",
        "#23d1e2",
        "#00bbc9",
        "#00a2af"
      ],
      paleviolet: [
        "#f6eeff",
        "#e7daf7",
        "#cab1ea",
        "#ad86dd",
        "#9562d2",
        "#854bcb",
        "#7d3ec9",
        "#6b31b2",
        "#5f2aa0",
        "#52228e"
      ]
  },
});