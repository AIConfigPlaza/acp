import { defineConfig } from 'tsup'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'))

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  shims: true,
  splitting: false,
  sourcemap: true,
  outDir: 'dist',
  target: 'node18',
  // 保留 console 输出
  minify: false,
  // 构建时注入版本号
  define: {
    '__VERSION__': JSON.stringify(pkg.version)
  },
  // 外部依赖
  external: [
    'commander',
    'inquirer',
    'axios',
    'chalk',
    'ora',
    'fs-extra',
    'cosmiconfig'
  ]
})
