[![codecov](https://codecov.io/gh/Ernxst/npm-module-starter-kit/branch/main/graph/badge.svg?token=M7P9X37MVB)](https://codecov.io/gh/Ernxst/npm-module-starter-kit)

# TypeScript NPM Module Starter Kit

This is a [clone-able monorepo template repository](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/creating-a-repository-from-a-template) for authoring an `npm` module with TypeScript. Out of the box, it:

* Provides minimally-viable [`tsconfig.json`](packages/tsconfig/tsconfig.base.json) settings
* Scaffolds a silly arithmetic module ([`src/index.ts`](packages/core/src/index.ts))
* Scaffolds test suites for full test coverage ([`src/__tests__`](packages/core/src/__test__/))
* Scaffolds an addons package
* Generates source maps
* Generates type definitions
* Generates multiple distribution formats:
  * ES Module (`dist/index.js`)
  * CommonJS (`dist/index.cjs`)
* Scaffolds a GitHub Action for Continuous Integration (CI) that:
  * lints codebase
  * type checks codebase
  * checks if compilation is successful
  * runs the test suite(s)
  * reports test coverage
  * automatic changelog releasing

All configuration is accessible via the `tsup.config.ts` files.

## Features

* 🔌 (Remote) caching with [Turborepo](https://turborepo.org)
* 🚀 [GitHub Actions](https://github.com/features/actions) for:
  * Semantic release versioning with [Changeset](https://github.com/changesets/changesets)
  * Labelling pull requests
  * Closing issues without reproductions
  * 📄 Upload coverage reports to [CodeCov](https://codecov.io)
* 🐶 [Husky](https://github.com/typicode/husky) git pre-commit integration
  * Commit message conventions enforced with [Commitlint](https://github.com/conventional-changelog/commitlint)
* 🧪 Unit testing with [Vitest](https://vitest.dev)
* 🔬 Code quality enforcement and linting with [ESLint](https://eslint.org)
* 🛠 Code formatting with [Prettier](https://prettier.io)
  * Formatting and linting on `git push` with [Nano-staged](https://github.com/usmanyunusov/nano-staged)
* 🔎 Type safety with [TypeScript](https://typescriptlang.org)
* 📄 GitHub guidelines and templates:
  * Issues
  * Commit conventions
  * Code of conduct
  * Contributing
  * Pull requests

## Setup

1. [Clone this template](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/creating-a-repository-from-a-template)
2. Replace all instances of `TODO` within the `license` and `package.json` files
3. Create [CodeCov](https://codecov.io) account (free for OSS)
4. Copy the provided CodeCov token as the `CODECOV_TOKEN` [repository secret](https://docs.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets#creating-encrypted-secrets-for-a-repository) (for CI reporting)
5. Replace [`src/index.ts`](packages/core/src/index.ts) with your own code! 🎉

## Commands

### `build`

Builds your modules for distribution in multiple formats (ESM, CommonJS).

```sh
pnpm run build
```

### `test`

Runs your test suite(s) (`/test/**`, `/__test__/**`) against your source code (`/src/**`).<br>Doing so allows for accurate code coverage.

```sh
pnpm test
```

## Publishing

> **Important:** Please finish [Setup](#setup) before continuing!

Once all `TODO` notes have been updated & your new module is ready to be shared, all that's left to do is decide its new version &mdash; AKA, do the changes constitute a `patch`, `minor`, or `major` release?

Once decided, you can run the following:

```sh
pnpm changeset
```

And then answer the prompted questions.

When you next push your changes to the remote repository, a changeset will automatically
be generated in a new pull request. Once you merge this pull request, a new release will
be visible in th repo.

## 💡 Contributing

To get started with development, you will need an editor (VS Code is recommended), a browser that runs JavaScript and some extra prerequisites:

* [Node.js (>= 14)](https://nodejs.org)
* [pnpm 8.2.0](https://pnpm.io/installation#using-corepack)

To get started with contributing to this project, first fork this git repository:

```sh
git clone https://github.com/Ernxst/pulsar.git
```

### 💪🏼 Submitting Improvements

If you have a suggestion that would make this app better, please fork the repo and create a pull request. You can also
simply open an issue with the tag "`enhancement`".

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

See [Contributing Guide](CONTRIBUTING.md) for more information.

## 🪪 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.
