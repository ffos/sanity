// @flow

// A utility wrapper class to process parsed jsonpath expressions

import descend from './descend'
import toPath from './toPath'
import parse from './parse'

type Probe = Object

export default class Expression {
  expr : Object
  constructor(expr : Object) {
    // This is a wrapped expr
    if (expr.expr) {
      this.expr = expr.expr
    } else {
      this.expr = expr
    }
    if (!this.expr.type) {
      throw new Error('Attempt to create Expression for expression with no type')
    }
  }
  isPath() : bool {
    return this.expr.type == 'path'
  }
  isUnion() : bool {
    return this.expr.type == 'union'
  }
  isCollection() : bool {
    return this.isPath() || this.isUnion()
  }
  isConstraint() : bool {
    return this.expr.type == 'constraint'
  }
  isRecursive() : bool {
    return this.expr.type == 'recursive'
  }
  isExistenceConstraint() : bool {
    return this.isConstraint() && this.expr.operator == '?'
  }
  isIndex() : bool {
    return this.expr.type == 'index'
  }
  isRange() : bool {
    return this.expr.type == 'range'
  }
  expandRange(probe : Probe) : Object {
    let start = this.expr.start || 0
    start = interpretNegativeIndex(start, probe)
    let end = this.expr.end || probe.getLength()
    end = interpretNegativeIndex(end, probe)
    const step = this.expr.step || 1
    return {start, end, step}
  }
  isAttributeReference() : bool {
    return this.expr.type == 'attribute'
  }
  // Is a range or index -> something referencing indexes
  isIndexReference() : bool {
    return this.isIndex() || this.isRange()
  }
  name() : string {
    return this.expr.name
  }
  constraintTargetIsSelf() {
    return this.isConstraint() && this.expr.lhs.type == 'alias' && this.expr.lhs.target == 'self'
  }
  constraintTargetIsAttribute() {
    return this.isConstraint() && this.expr.lhs.type == 'attribute'
  }
  testConstraint(probe : Probe) : bool {
    if (this.constraintTargetIsSelf()) {
      if (!probe.isPrimitiveValue()) {
        return false
      }
      if (this.isExistenceConstraint()) {
        return true
      }
      const lhs = probe.value()
      const rhs = this.expr.rhs.value
      return testBinaryOperator(lhs, this.expr.operator, rhs)
    }
    if (!this.constraintTargetIsAttribute()) {
      throw new Error(`Constraint target ${this.expr.lhs.type} not supported`)
    }
    const lhs = probe.getField(this.expr.lhs.name)
    if (lhs === null || !lhs.isPrimitiveValue()) {
      // LHS is void and empty, or it is a collection
      return false
    }
    const rhs = this.expr.rhs.value
    return testBinaryOperator(lhs.value(), this.expr.operator, rhs)
  }
  pathNodes() {
    if (this.isPath()) {
      return this.expr.nodes
    }
    return [this.expr]
  }
  prepend(node) {
    if (!node) {
      return this
    }
    return new Expression({
      type: 'path',
      nodes: node.pathNodes().concat(this.pathNodes())
    })
  }
  concat(other) {
    if (!other) {
      return this
    }
    return other.prepend(this)
  }
  descend() {
    return descend(this.expr).map(headTail => {
      const [head, tail] = headTail
      return {
        head: head ? new Expression(head) : null,
        tail: tail ? new Expression(tail) : null
      }
    })
  }
  unwrapRecursive() {
    if (!this.isRecursive()) {
      throw new Error(`Attempt to unwrap recursive on type ${this.expr.type}`)
    }
    return new Expression(this.expr.term)
  }
  toIndicies(probe : Probe) : Array<number> {
    if (!this.isIndexReference()) {
      throw new Error('Node cannot be converted to indexes')
    }
    if (this.expr.type == 'index') {
      return [interpretNegativeIndex(this.expr.value, probe)]
    } else if (this.expr.type == 'range') {
      const result : Array<number> = []
      let {start, end, step} = this.expandRange(probe)
      if (step < 0) {
        [start, end] = [end, start]
      }
      for (let i = start; i < end; i++) {
        result.push(i)
      }
      return result
    }
    throw new Error(`Unable to convert ${this.expr.type} to indicies`)
  }
  toFieldReferences() : Array<any> {
    if (this.isIndexReference()) {
      return this.toIndicies()
    }
    if (this.isAttributeReference()) {
      return [this.name()]
    }
    throw new Error(`Can't convert ${this.expr.type} to field references`)
  }
  toString() : string {
    return toPath(this.expr)
  }
  static fromPath(path : string) {
    return (new Expression(parse(path)))
  }
  static attributeReference(name : string) {
    return new Expression({
      type: 'attribute',
      name: name
    })
  }
  static indexReference(i : number) {
    return new Expression({
      type: 'index',
      value: i
    })
  }
}

// Tests an operator on two given primitive values
function testBinaryOperator(lhsValue, operator, rhsValue) {
  switch (operator) {
    case '>':
      return lhsValue > rhsValue
    case '>=':
      return lhsValue >= rhsValue
    case '<':
      return lhsValue < rhsValue
    case '<=':
      return lhsValue <= rhsValue
    case '==':
      return lhsValue == rhsValue
    case '!=':
      return lhsValue != rhsValue
    default:
      throw new Error(`Unsupported binary operator ${operator}`)
  }
}
function interpretNegativeIndex(index : number, probe : Probe) {
  if (index < 0) {
    return index + probe.getLength()
  }
  return index
}