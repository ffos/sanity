import type {Node} from 'react'
// @flow
import React from 'react'
import cx from 'classnames'
import styles from './styles/FocusArea.css'

type Props = {
  children: Node,
  className: string
}

export class FocusArea extends React.Component<Props> {
  _element: ?HTMLDivElement

  focus() {
    if (this._element) {
      this._element.focus()
    }
  }

  handleFocus = event => {
    if (event.target === this._element) {
      console.log('Me!')
      this.props.onFocus(event)
    } else {
      console.log('Not me')
    }
  }

  render() {
    const {children, className, ...rest} = this.props
    const classNames = cx(className, styles.root)
    return (
      <div
        {...rest}
        tabIndex={0}
        className={classNames}
        ref={el => {
          this._element = el
        }}
        onFocus={this.handleFocus}
      >
        {children}
      </div>
    )
  }
}
