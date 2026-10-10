module.exports = {
  extends: ['mantine'],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'import/extensions': 'off',
    // '${username}' style placeholders are intentional message templates
    'no-template-curly-in-string': 'off',
    'no-plusplus': 'off',
    'no-continue': 'off',
  },
};
