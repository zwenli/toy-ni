import { defineBuildConfig } from 'unbuild'
import fg from 'fast-glob'

export default defineBuildConfig({
  entries: [
    ...fg.sync('src/commands/*.ts').map(i => i.slice(0, -3)),
  ], // 构建入口
  // outDir: 'dist', // 构建输入目录，默认为 dist
  clean: true, // 构建前是否清除dist输入目录下的文件，默认为false
  declaration: true, // 输出 .d.ts 文件
  rollup: {
    emitCJS: true, // 输出 commonjs 文件
    inlineDependencies: true, // 忽略内部依赖的警告
  },
})
