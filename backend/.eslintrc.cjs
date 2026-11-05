module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off',
    'import/extensions': ['error', 'ignorePackages'],
    'import/prefer-default-export': 'off',
    'no-underscore-dangle': ['error', { allow: ['_id', '__v'] }],
    'no-param-reassign': ['error', { props: false }],
    'object-curly-newline': 'off',
    'max-len': ['warn', { code: 140, ignoreStrings: true, ignoreTemplateLiterals: true }],
  },
};
