type DeepMergeObject = Record<string, unknown>;

const isObject = (item: unknown): item is DeepMergeObject =>
  item !== null && typeof item === "object" && !Array.isArray(item);

export const deepmerge = <T extends DeepMergeObject, U extends DeepMergeObject>(
  target: T,
  source: U,
): T & U => {
  const result = { ...target } as T & U;

  for (const key in source) {
    if (Object.hasOwn(source, key)) {
      const sourceValue = source[key];
      const targetValue = target[key as keyof T];

      if (isObject(sourceValue) && isObject(targetValue)) {
        result[key as keyof (T & U)] = deepmerge(
          targetValue,
          sourceValue,
        ) as (T & U)[keyof (T & U)];
      } else {
        result[key as keyof (T & U)] = sourceValue as (T & U)[keyof (T & U)];
      }
    }
  }

  return result;
};
