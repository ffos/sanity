// @flow
import React from 'react'
import type {Path} from './typedefs/path'
import PatchEvent from './PatchEvent'
import generateHelpUrl from '@sanity/generate-help-url'
import type {Type} from '../../schema/src/sanity/typedefs'
import * as PathUtils from './utils/pathUtils'

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
    if (PathUtils.hasFocus(focusPath, path)) {
      this.focus()
    }
  }

  componentDidUpdate(prevProps) {
    const hadFocus = PathUtils.hasFocus(prevProps.focusPath, prevProps.path)
    const hasFocusNow = PathUtils.hasFocus(this.props.focusPath, this.props.path)
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
    if (!this._input) {
      // should never happen
      throw new Error('Attempted to set focus on an invalid input component')
    }
    if (typeof this._input.focus !== 'function') {
      console.warn(
        'Encountered an input component without a required ".focus()" method. Read more at %s',
        generateHelpUrl('input-component-missing-required-method')
      )
    } else {
      this._input.focus()
    }
  }

  handleChange = patchEvent => {
    const {type, onChange} = this.props
    if (type.readOnly) {
      return
    }
    onChange(patchEvent)
  }

  handleFocus = nextFocusPath => {
    const {path, onFocus, focusPath} = this.props
    if (!onFocus) {
      console.warn(
        'FormBuilderInput was used without passing an onFocus handler. Read more at %s',
        generateHelpUrl('input-component-missing-required-method')
      )
      return
    }
    if (!Array.isArray(nextFocusPath)) { // some inputs may call onFocus with native event
      onFocus(path)
      return
    }
    if (!PathUtils.isEqual(focusPath, nextFocusPath)) {
      onFocus([...path, ...nextFocusPath])
    }
  }

  handleBlur = focusPath => {
    const {path, onBlur} = this.props
    if (!onBlur) {
      console.warn(
        'FormBuilderInput was used without passing an onBlur handler. Read more at %s',
        generateHelpUrl('input-component-missing-required-method')
      )
      return
    }
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

    const childFocusPath = PathUtils.startsWith(path, focusPath) ? PathUtils.trimLeft(path, focusPath) : []

    const isLeaf = childFocusPath.length === 0
    const leafProps = isLeaf ? {} : {focusPath: childFocusPath}
    //
    // const debug = false ? content => (
    //     <div style={{border: '1px dashed green', padding: 4}}>
    //       {type.title}
    //       <pre style={{color: 'red'}}>{JSON.stringify(this.props.focusPath)}</pre>
    //       {content}
    //     </div>
    //   ) : content => content

    return (
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
