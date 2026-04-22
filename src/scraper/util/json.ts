// TODO: Move to fast-json-stringify or similar for performance

export const parseJson = <T = unknown>(input: string): T | null => {
  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
};

export const stringifyJson = (
  input: Record<string, unknown>,
): string | null => {
  try {
    return JSON.stringify(input);
  } catch {
    return null;
  }
};
