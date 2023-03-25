import { describe, it, expect } from "vitest"
import options from "../src/toptions"

describe("options", () => {

  const noUnrec = { unrecognized: { named: [], positional: [] }}

  it("should parse positional argument", () => {
    const result = options({ p1: options.arg(0) })(["foo"])

    expect(result).toStrictEqual({ p1: "foo", ...noUnrec })
  })

  it("should parse multiple positional arguments", () => {
    const result = options({ p1: options.arg(0), p2: options.arg(1) })(["foo", "bar"])

    expect(result).toStrictEqual({ p1: "foo", p2: "bar", ...noUnrec })
  })

  it("should parse unrecognized options", () => {
    const result = options({ p1: options.arg(0) })(["foo", "bar", "--biz"])

    expect(result).toStrictEqual({ p1: "foo", unrecognized: { named: ["biz"], positional: ["bar"]} })
  })

  it("should return defaults", () => {
    const result = options({ p1: options.arg(0, "foo"), bar: options.flag("f", "baz") })([])

    expect(result).toStrictEqual({ p1: "foo", bar: "baz", ...noUnrec })
  })

  it("should parse named flag", () => {
    const result = options({ foo: options.flag() })(["--foo", "bar"])

    expect(result).toStrictEqual({ foo: "bar", ...noUnrec })
  })

  it("should parse both positional args and named flags", () => {
    const result = options({ foo: options.arg(0), bar: options.flag() })(["--bar", "baz", "buz"])

    expect(result).toStrictEqual({ bar: "baz", foo: "buz", ...noUnrec })
  })

  it("should parse aliases", () => {
    const result = options({ foo: options.flag("f"), bar: options.bit("b") })(["-f", "buz", "-b"])

    expect(result).toStrictEqual({ foo: "buz", bar: true, ...noUnrec })
  })

  it("should increment levels", () => {
    const result = options({ foo: options.level("f") })(["--foo", "--foo", "-f", "-ff"])

    expect(result).toStrictEqual({ foo: 5, ...noUnrec })
  })

  it("should parse lists", () => {
    const result = options({ foo: options.list("f" )})(["--foo", "bar", "--foo", "buz", "-f", "baz"])

    expect(result).toStrictEqual({ foo: ["bar", "buz", "baz"], ...noUnrec })
  })

  it("should parse args list", () => {
    const result = options({ foo: options.args() })(["bar", "baz", "biz"])

    expect(result).toStrictEqual({ foo: ["bar", "baz", "biz"], ...noUnrec })
  })

  it("should parse many types of options simultaneously", () => {
    const result = options({
      foo: options.arg(0),
      bar: options.flag(),
      baz: options.bit(),
      buz: options.level(),
      biz: options.list(),
      boz: options.raw(),
    })([
      "--bar", "fuz",
      "--buz",
      "--biz", "faz",
      "boo",
      "--baz",
      "--buz",
      "--biz", "fiz",
      "--", "doo", "goo",
    ])

    expect(result).toStrictEqual({
      foo: "boo",
      bar: "fuz",
      baz: true,
      buz: 2,
      biz: ["faz", "fiz"],
      boz: ["doo", "goo"],
      ...noUnrec,
    })
  })

})