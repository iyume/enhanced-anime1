import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: {
    css: true,
    html: true,
  },
  react: true,
  ignores: ['libs/gen'],
})
