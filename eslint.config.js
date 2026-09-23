/**
 * The same rules the framework holds itself to.
 *
 * This is a small application and could get away with less. It does not,
 * because it is the first Firsthand code most people will read, and because
 * the framework's own `docs/architecture/code-rules.md` argues that a limit
 * nobody enforces is a preference. The numbers below are that page's.
 *
 * The limits skip blank lines and comments deliberately: the reasoning in this
 * project lives above the code, and a size limit that counted prose would be a
 * limit on explaining yourself.
 */
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** SOLID and clean-code limits (code-rules §1, §2). */
const shape = {
  'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
  'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
  'max-statements': ['error', 30],
  complexity: ['error', 12],
  'max-depth': ['error', 4],
  'max-nested-callbacks': ['error', 3],
  'max-params': ['error', 4],
  'no-param-reassign': ['error', { props: false }],
  'no-else-return': ['error', { allowElseIf: false }],
  'no-lonely-if': 'error',
  'prefer-const': 'error',
  'no-var': 'error',
  'object-shorthand': ['error', 'properties'],
  'prefer-template': 'error',
};

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'public/runtime/**',
      'src/generated/**',
      // The default sketch. It is compiled by the playground rather than by
      // the build, against types the editor loads at runtime — so linting it
      // here would be linting a file this project does not own the context of.
      'src/defaults/weather.demo.tsx',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      ...shape,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      // `../` is for leaving a directory; this project is one directory deep
      // and has no `@/` alias, so the rule that matters here is the shape of
      // what is imported rather than the spelling of the path.
      // The package entry, and only it: `monaco-editor` pulls in every
      // language Monaco has ever supported, and this playground writes TSX.
      // The deep paths — the API entry, the contributions, the workers — are
      // exactly what replaces it.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'monaco-editor',
              message:
                "Import 'monaco-editor/esm/vs/editor/editor.api.js' instead; the package entry bundles sixty languages this playground does not use.",
            },
          ],
        },
      ],
    },
  },
  {
    // Tests say what they mean at whatever length that takes, and a `describe`
    // is a grouping rather than a function.
    files: ['test/**/*.ts', 'e2e/**/*.ts'],
    rules: {
      'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': 'off',
      'max-nested-callbacks': ['error', 6],
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
  {
    // Configuration and scripts: outside `tsconfig.json`, so there are no
    // types to lint with.
    files: ['scripts/**/*.mjs', '*.config.js'],
    ...tseslint.configs.disableTypeChecked,
  },
);
