/**
 * Creates a new regex that is the disjunction of its arguments.
 * Based on https://stackoverflow.com/a/9215436
 * @param args Regexes to combine
 * @returns A regex that will match any of the given Regexes
 */
export function any(...args: RegExp[]) {
  const components = args.map((arg) => arg.source);

  return new RegExp("(?:" + components.join(")|(?:") + ")");
}
