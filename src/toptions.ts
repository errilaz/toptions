/** 
 * Creates a strongly typed CLI parser function.
*/
function options<OptionsDefinition extends OptionsDefinitionBase>(definition: OptionsDefinition) {
  // TODO: level max
  let rawOption: null | string = null
  let argsOption: null | string = null
  let restOption: null | [number, string] = null
  const positional: string[] = []
  const lookupAlias: { [alias: string]: string | undefined } = {}
  const defaultConfig = {} as any
  for (const name in definition) {
    const option = definition[name]
    defaultConfig[name] = cloneValue(option.defaultValue)
    if (option.type === "raw") {
      rawOption = name
    }
    else if (option.type === "args") {
      argsOption = name
    }
    else if (option.type === "arg") {
      positional[option.index] = name
    }
    else if (option.type === "rest") {
      restOption = [option.index, name]
    }
    else if (option.alias) {
      lookupAlias[option.alias] = name
    }
  }
  return parse

  function parse(argv: string[]) {
    const config = cloneRecord(defaultConfig)
    config.unrecognized = {
      named: [],
      positional: []
    }
    let remainingArgs = positional.slice()
    let consumeRest = false
    for (let a = 0; a < argv.length; a++) {
      const arg = argv[a]
      if (consumeRest) {
        config[restOption![1]].push(arg)
      }
      if (arg === "--") {
        if (rawOption === null) continue
        config[rawOption] = argv.slice(a + 1)
        break
      }
      else if (arg.startsWith("--") || (arg[0] === "-" && arg.length === 2)) {
        const alias = arg[1]
        const isAlias = alias !== "-"
        if (isAlias && !lookupAlias[alias]) {
          config.unrecognized.named.push(alias)
          continue
        }
        const name = isAlias ? lookupAlias[alias]! : dashedToCamel(arg.substring(2))
        const option = definition[name]
        if (!option) {
          config.unrecognized.named.push(name)
          continue
        }
        if (option.type === "bit") {
          config[name] = true
          continue
        }
        const hasNext = argv[a + 1] && argv[a + 1][0] !== "-"
        if (option.type === "flag") {
          if (hasNext) {
            config[name] = argv[++a]
            if (consumeRest) {
              config[restOption![1]].push(argv[a])
            }
          }
          continue
        }
        if (option.type === "list") {
          if (hasNext) {
            config[name].push(argv[++a])
            if (consumeRest) {
              config[restOption![1]].push(argv[a])
            }
          }
          continue
        }
        if (option.type === "level") {
          config[name]++
          continue
        }
      }
      else if (arg.startsWith("-") && arg.length > 2) {
        const letters = arg.substring(1).split("")
        for (const letter of letters) {
          const name = lookupAlias[letter]
          if (!name) {
            config.unrecognized.named.push(letter)
            continue
          }
          const option = definition[name]
          if (!option) {
            config.unrecognized.named.push(name)
            continue
          }
          if (option.type === "bit") {
            config[name] = true
          }
          else if (option.type === "level") {
            config[name]++
          }
        }
      }
      else {
        if (restOption?.[0] === a) {
          consumeRest = true
          const name = restOption[1]
          config[name] = []
        }
        else if (remainingArgs.length > 0) {
          const [name] = remainingArgs.splice(0, 1)
          config[name] = arg
          continue
        }
        else if (argsOption !== null) {
          config[argsOption].push(arg)
        }
        else {
          config.unrecognized.positional.push(arg)
        }
      }
    }
    return config as unknown as Options<OptionsDefinition>
  }
}

export type OptionsDefinitionBase = {
  [name: string]: Option
}

export type Options<OptionsDefinition extends OptionsDefinitionBase> = {
  [O in keyof OptionsDefinition]: OptionsDefinition[O]["defaultValue"]
} & {
  unrecognized: {
    named: string[]
    positional: string[]
  }
}

module options {
  /** Positional string argument. */
  export function arg(index: number): ArgOption
  export function arg(index: number, defaultValue: string): ArgOptionDefault
  export function arg(index: number, defaultValue?: string): ArgOption | ArgOptionDefault {
    return { type: "arg", index, defaultValue }
  }

  /** All position string arguments. */
  export function args(defaultValue: string[] = []): ArgsOption {
    return { type: "args", defaultValue }
  }

  /** Named boolean option, no parameters. */
  export function bit(alias?: string): BitOption {
    return { type: "bit", alias, defaultValue: false }
  }

  /** Named string option. */
  export function flag(alias?: string): FlagOption
  export function flag(alias: string, defaultValue: string): FlagOptionDefault
  export function flag(alias?: string, defaultValue?: string): FlagOption | FlagOptionDefault {
    return { type: "flag", alias, defaultValue }
  }

  /** Named list option */
  export function list(alias?: string, defaultValue: string[] = []): ListOption {
    return { type: "list", alias, defaultValue }
  }

  /** Repeatable named number level. */
  export function level(alias?: string): LevelOption {
    return { type: "level", alias, defaultValue: 0 }
  }

  /** Everything after the --. */
  export function raw(): RawOption {
    return { type: "raw", defaultValue: undefined }
  }

  /** Consumes parameters after the given positional argument. */
  export function rest(index: number, defaultValue: string[] = []): RestOption {
    return { type: "rest", index, defaultValue }
  }
}

export default options

export type Option =
  | ArgOption
  | ArgOptionDefault
  | ArgsOption
  | BitOption
  | FlagOption
  | FlagOptionDefault
  | ListOption
  | LevelOption
  | RawOption
  | RestOption

export interface ArgOption {
  type: "arg"
  index: number
  defaultValue: string | undefined
}

export interface ArgOptionDefault {
  type: "arg"
  index: number
  defaultValue: string
}

export interface ArgsOption {
  type: "args"
  defaultValue: string[]
}

export interface BitOption {
  type: "bit"
  alias?: string
  defaultValue: boolean
}

export interface FlagOption {
  type: "flag"
  alias?: string
  defaultValue: string | undefined
}

export interface FlagOptionDefault {
  type: "flag"
  alias?: string
  defaultValue: string
}

export interface ListOption {
  type: "list"
  alias?: string
  defaultValue: string[]
}

export interface LevelOption {
  type: "level"
  alias?: string
  defaultValue: number
}

export interface RawOption {
  type: "raw"
  defaultValue: string[] | undefined
}

export interface RestOption {
  type: "rest"
  index: number
  defaultValue: string[]
}

/** Converts dashed-case to camelCase. */
function dashedToCamel(dashed: string) {
  return dashed.replace(/-[a-z]/g, ([, c]) => c.toUpperCase())
}

/** Clone simple values and arrays. */
function cloneValue(x: any) {
  if (Array.isArray(x)) return x.slice()
  return x
}

/** Clone a record one-deep. */
function cloneRecord(record: any): any {
  const clone = {} as any
  for (const key in record) {
    clone[key] = cloneValue(record[key])
  }
  return clone
}