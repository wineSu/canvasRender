import {X2jOptionsOptional} from './type';

interface Utils {
  (string: string, regex: RegExp): string[][];
}

interface Match {
  (string: string, regex: RegExp): boolean;
}

export const getAllMatches: Utils = function (string: string, regex: RegExp) {
  const matches = []
  let match = regex.exec(string)
  while (match) {
    const allmatches = []
    const len = match.length
    for (let index = 0; index < len; index++) {
      allmatches.push(match[index])
    }
    matches.push(allmatches)
    match = regex.exec(string)
  }
  return matches
}

export const doesMatch: Match = function (string, regex) {
  const match = regex.exec(string)
  return !(match === null || typeof match === 'undefined')
}

export const doesNotMatch: Match = function (string, regex) {
  return !doesMatch(string, regex)
}

export const isExist = function (v: any) {
  return typeof v !== 'undefined'
}

export const isEmptyObject = function (obj: object) {
  return Object.keys(obj).length === 0
}

/**
 * Copy all the properties of a into b.
 * @param {*} target
 * @param {*} a
 */
export const merge = function (target: { [x: string]: any }, a: { [x: string]: any }, arrayMode: any) {
  if (a) {
    const keys = Object.keys(a) // will return an array of own properties
    const len = keys.length //don't make it inline
    for (let i = 0; i < len; i++) {
      if (arrayMode === 'strict') {
        target[keys[i]] = [a[keys[i]]]
      } else {
        target[keys[i]] = a[keys[i]]
      }
    }
  }
}

export const getValue = function (v: any) {
  if (isExist(v)) {
    return v
  } else {
    return ''
  }
}

export const buildOptions = function (options: any, defaultOptions: any, props: string | any[]) {
  const newOptions = {} as any;
  if (!options) {
    return defaultOptions //if there are not options
  }

  for (let i = 0; i < props.length; i++) {
    if (options[props[i]] !== undefined) {
      newOptions[props[i]] = options[props[i]]
    } else {
      newOptions[props[i]] = defaultOptions[props[i]]
    }
  }
  return newOptions
}
