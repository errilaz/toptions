# toptions

> Options parsing & nothing else.

## Features

- Parses options
- Optional configuration
- TypeScript support
- No coercion
- No validation
- No dependencies

## Install

```sh
npm install toptions
# or
pnpm add toptions
# or
yarn add toptions
# or
bun add toptions
```

## Example

```ts
import options from "toptions"

const parse = options({
  // Positional option
  path: options.arg(0),
  // Named option (type is: string | undefined)
  dist: options.flag("d"),
  // Named option with a default (type is: string)
  port: options.flag("p", 3000),
  // Append multiple values to "exclude"
  exclude: options.list("e"),
  // Boolean --help option
  help: options.bit("h"),
  // Increments the "log" option
  log: options.level("l"),
  // Parses everything after a --
  nodeargs: options.raw(),
})

const { path, dist, port, exclude, help, log, nodeargs } = parse(process.argv.slice(2))
```
