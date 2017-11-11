// @flow
import type {Path, PathSegment} from '../typedefs/path'

export function isSegmentEqual(pathSegment: PathSegment, otherPathSegment: PathSegment) {
  const pathSegmentType = typeof pathSegment
  const otherPathSegmentType = typeof otherPathSegment
  if (pathSegmentType !== otherPathSegmentType) {
    return false
  }
  if (pathSegmentType === 'string' || pathSegmentType === 'number') {
    return pathSegment === otherPathSegment
  }
  if (!pathSegment || !otherPathSegment) {
    return false
  }
  return pathSegment._key === otherPathSegment._key
}

export function hasFocus(focusPath: Path, path: Path): boolean {
  const inputLeaf = path[path.length - 1]
  const [head, ...tail] = focusPath
  return tail.length === 0 && isSegmentEqual(inputLeaf, head)
}

export function isExpanded(segment: PathSegment, focusPath: Path): boolean {
  const [head] = focusPath
  return isSegmentEqual(segment, head)
}


export function startsWith(prefix: Path, path: Path): boolean {
  return prefix.every((segment, i) => isSegmentEqual(segment, path[i]))
}

export function trimLeft(prefix: Path, path: Path): Path {
  if (prefix.length === 0 || path.length === 0) {
    return path
  }
  const [prefixHead, ...prefixTail] = prefix
  const [pathHead, ...pathTail] = path
  if (!isSegmentEqual(prefixHead, pathHead)) {
    return path
  }
  return trimLeft(prefixTail, pathTail)
}
