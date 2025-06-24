import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  typescript: true,
  javascript: true,
  lessOpinionated: true,
}, {
  rules: {
    'curly': 'off',
    'style/curly': 'off',
    'no-console': 'off',
    'style/no-console': 'off',
  },
})
