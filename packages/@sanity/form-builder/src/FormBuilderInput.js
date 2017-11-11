// @flow
import React from 'react'
import type {Path} from './typedefs/path'
import PatchEvent from './PatchEvent'
import type {Type} from '../../schema/src/sanity/typedefs'
import {hasFocus, startsWith, trimLeft} from './utils/pathUtils'

function setFocus(input) {
  if (!input) {
    console.log('Missing input. Check your refs.')
    return
  }
  if (typeof input.focus === 'function') {
    input.focus()
  } else {
    console.warn('Input component %o has no focus method. Please implement', input)
  }
}

type Props = {
  value: any,
  type: Type,
  onChange: PatchEvent => void,
  onFocus: Path => void,
  onBlur: () => void,
  focusPath: Path,
  level: number,
  isRoot: boolean,
  path: Array<PathSegment>
}

const ENABLE_CONTEXT = () => {}

export const FormBuilderInput = class FormBuilderInput extends React.Component<Props> {

  static contextTypes = {
    formBuilder: ENABLE_CONTEXT,
    getValuePath: ENABLE_CONTEXT
  }

  static childContextTypes = {
    getValuePath: ENABLE_CONTEXT
  }

  static defaultProps = {
    focusPath: [],
    path: []
  }

  _input: ?FormBuilderInput

  getValuePath = () => {
    return this.context.getValuePath().concat(this.props.path)
  }

  getChildContext() {
    return {
      getValuePath: this.getValuePath
    }
  }

  componentDidMount() {
    const {focusPath, path} = this.props
    if (hasFocus(focusPath, path)) {
      this.focus()
    }
  }

  componentDidUpdate(prevProps) {
    const hadFocus = hasFocus(prevProps.focusPath, prevProps.path)
    const hasFocusNow = hasFocus(this.props.focusPath, this.props.path)
    if (!hadFocus && hasFocusNow) {
      this.focus()
    }
  }

  resolveInputComponent(type: Type) {
    return this.context.formBuilder.resolveInputComponent(type)
  }

  setInput = (component: ?FormBuilderInput) => {
    this._input = component
  }

  focus() {
    setFocus(this._input)
  }

  handleChange = patchEvent => {
    const {type, onChange} = this.props
    if (type.readOnly) {
      return
    }
    onChange(patchEvent)
  }

  handleFocus = focusPath => {
    const {path, onFocus} = this.props
    onFocus([...path, ...focusPath])
  }

  handleBlur = focusPath => {
    const {path, onBlur} = this.props
    onBlur([...path, ...focusPath])
  }

  render() {
    const {
      onChange,
      onFocus,
      onBlur,
      path,
      value,
      type,
      level,
      focusPath,
      isRoot,
      ...rest
    } = this.props

    const InputComponent = this.resolveInputComponent(type)

    if (!InputComponent) {
      return <div>No input resolved for type {JSON.stringify(type.name)}</div>
    }

    const rootProps = isRoot ? {isRoot} : {}

    const childFocusPath = startsWith(path, focusPath) ? trimLeft(path, focusPath) : []

    const isLeaf = childFocusPath.length === 0
    const leafProps = isLeaf ? {} : {focusPath: childFocusPath}

    const debug = false ? (content => (
        <div style={{border: '1px dashed green', padding: 4}}>
          {type.title}
          <pre style={{color: 'red'}}>{JSON.stringify(this.props.focusPath)}</pre>
          {content}
        </div>
      )) : (content => content)

    return debug(
      <InputComponent
        {...rest}
        {...rootProps}
        {...leafProps}
        value={value}
        type={type}
        onChange={this.handleChange}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        level={level}
        ref={this.setInput}
      />
    )
  }
}
