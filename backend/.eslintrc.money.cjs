// Money-only ESLint config used by the git pre-commit hook (.husky/pre-commit).
//
// It enables ONLY the type-aware Decimal-concat guard so the hook stays fast and
// can't be blocked by the codebase's unrelated pre-existing lint debt. A bad `+`
// on a Prisma Decimal (whose valueOf() is a STRING, so "666"+"21000"="66621000")
// is the one class of bug we refuse to let merge. For full linting run the
// normal `npm run lint` (uses .eslintrc.js).
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
    // Resolve `project` relative to THIS file's dir (backend/), not the cwd the
    // hook runs eslint from — keeps it correct regardless of where it's invoked.
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  root: true,
  env: { node: true, jest: true },
  // Test files are excluded from tsconfig, so type-aware lint can't parse them.
  ignorePatterns: ['.eslintrc.js', '.eslintrc.money.cjs', 'dist/**', 'node_modules/**', '**/*.test.ts', '**/*.spec.ts', 'src/tests/**'],
  rules: {
    // allowAny:true on purpose. A Decimal/object operand (the actual concat bug:
    // "666"+"21000") is still flagged regardless of this flag — that's what we're
    // guarding. allowAny:false additionally flags every `any + x` (legit time/slot
    // math all over the codebase), which is too noisy for a commit gate: devs would
    // just --no-verify and the guard would die. Keep it tight on the real bug class.
    '@typescript-eslint/restrict-plus-operands': ['error', { allowAny: true, allowBoolean: false, allowNullish: false }],
  },
};
