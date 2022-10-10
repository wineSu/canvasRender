import typescript from 'rollup-plugin-typescript2'
import commonjs from 'rollup-plugin-commonjs'

export default {
  input: 'src/index.ts',
  output: [
    { file: 'dist/index.d.ts', format: 'esm', exports: 'named' },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    },
    {
      file: 'dist/index.js',
      format: 'umd',
      sourcemap: true,
      name: 'Canvs'
    }
  ],
  plugins: [
    typescript({
      tsconfig: 'tsconfig.json',
      removeComments: true,
      useTsconfigDeclarationDir: true
    }),
    commonjs({
      include: 'node_modules/**',
      namedExports: {
        'css-layout': ['computeLayout']
      }
    })
  ]
}
