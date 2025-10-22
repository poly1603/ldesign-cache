export default {
  external: (id: string) => {
    if (id.includes('node_modules')) return true
    if (/^(fsevents|chokidar)/.test(id)) return true
    return false
  },
  typescript: {
    tsconfig: './tsconfig.build.json'
  },
  output: {
    esm: {
      dir: 'es',
      preserveStructure: true,
      dts: true
    },
    cjs: {
      dir: 'lib',
      preserveStructure: true,
      dts: true
    }
  }
}
