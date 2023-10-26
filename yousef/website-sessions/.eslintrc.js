module.exports = {
  extends: '@onidivo/eslint-config-typescript',
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    'no-param-reassign': 0,
    'import/no-named-default': 0,
    'prettier/prettier': ['error', { printWidth: 120 }],
    'max-len': ['error', { code: 120 }]
  }
}
