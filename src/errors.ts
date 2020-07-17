export const errorLookupDictionary = (index: number, plural: string) => [
  `Could not find index "${index}" in the dictionary of "${plural}"`,
];

export const errorLookupResolver = (to: string) => [
  `Cannot find the resolver, for the to value "${to}"`,
];

export const errorLookupNormalized = (plural: string) => [
  `Cannot find the dictionary for "${plural}"`,
];

export const errorResolver = (plural: string, from: string) => [
  `Can't find the resolver of "${plural} -> ${from}"`,
];

export const errorTo = (plural: string, from: string) => [
  `Can't find the "to" value of "${plural} -> ${from}"`,
];
