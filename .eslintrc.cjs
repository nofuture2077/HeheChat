module.exports = {
  extends: ['mantine'],
  plugins: ['react-hooks'],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'import/extensions': 'off',
    // '${username}' style placeholders are intentional message templates
    'no-template-curly-in-string': 'off',
    'no-plusplus': 'off',
    'no-continue': 'off',
  },
};
