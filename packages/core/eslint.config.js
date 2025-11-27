import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  vue: false,
  rules: {
    // 禁用有兼容性问题的规则
    'unicorn/error-message': 'off',
    // 允许 console 用于调试
    'no-console': 'off',
  },
})
