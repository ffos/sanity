// @flow
import type {ItemValue, ArrayType} from './typedefs'

import React from 'react'
import type {Node} from 'react'
import styles from './styles/ItemValue.css'
import ConfirmButton from './ConfirmButton'
import LinkIcon from 'part:@sanity/base/link-icon'
import TrashIcon from 'part:@sanity/base/trash-icon'
import EditItemFold from 'part:@sanity/components/edititem/fold'
import EditItemPopOver from 'part:@sanity/components/edititem/popover'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import {FormBuilderInput} from '../../FormBuilderInput'
import PatchEvent from '../../PatchEvent'
import Preview from '../../Preview'

import {DragHandle} from 'part:@sanity/components/lists/sortable'
import {IntentLink} from 'part:@sanity/base/router'
import {resolveTypeName} from '../../utils/resolveTypeName'
import type {Path} from '../../typedefs/path'
import type {Type} from '../../typedefs'

type Props = {
  type: ArrayType,
  value: ItemValue,
  level: number,
  layout?: 'media' | 'default',
  onRemove: (ItemValue) => void,
  onChange: (PatchEvent) => void,
  onFocus: (Path, ItemValue) => void,
  onBlur: void => void,
  onEditStart: (ItemValue) => void,
  onEditStop: (ItemValue) => void,
  focusPath: Path,
  isExpanded: boolean
}

export default class RenderItemValue extends React.Component<Props> {

  static defaultProps = {
    level: 0
  }

  handleEditStart = event => {
    const {value, onEditStart} = this.props
    onEditStart(value)
  }

  handleEditStop = () => {
    const {value, onEditStop} = this.props
    onEditStop(value)
  }

  handleKeyPress = (event: SyntheticKeyboardEvent<*>) => {
    const {value, onEditStart} = this.props
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onEditStart(value)
    }
  }

  handleRemove = () => {
    const {onRemove, value} = this.props
    onRemove(value)
  }

  handleChange = (event: PatchEvent) => {
    const {onChange, value} = this.props
    onChange(event, value)
  }

  getMemberType(): ?Type {
    const {value, type} = this.props
    const itemTypeName = resolveTypeName(value)
    return type.of.find(memberType => memberType.name === itemTypeName)
  }

  renderEditItemForm(item: ItemValue): Node {
    const {type, focusPath, onFocus, onBlur} = this.props
    const options = type.options || {}

    const memberType = this.getMemberType() || {}

    // Reset level if a full screen modal
    const level = options.editModal === 'fullscreen' ? 1 : this.props.level + 1

    const content = (
      <FormBuilderInput
        type={memberType}
        level={level}
        value={item}
        onChange={this.handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        focusPath={focusPath}
        path={[{_key: item._key}]}
      />
    )
    // return content

    if (options.editModal === 'fullscreen') {
      return (
        <FullscreenDialog title={memberType.title} onClose={this.handleEditStop} isOpen>
          {content}
        </FullscreenDialog>
      )
    }

    if (options.editModal === 'fold') {
      return (
        <div className={styles.popupAnchorRelative}>
          <EditItemFold title={memberType.title} onClose={this.handleEditStop}>
            {content}
          </EditItemFold>
        </div>
      )
    }

    return (
      <div className={styles.popupAnchor}>
        <EditItemPopOver onClose={this.handleEditStop} key={item._key}>
          {content}
        </EditItemPopOver>
      </div>
    )
  }

  render() {
    const {value, isExpanded, type} = this.props

    const options = type.options || {}
    const isGrid = options.layout === 'grid'
    const isSortable = options.sortable !== false
    const previewLayout = isGrid ? 'media' : 'default'

    return (
      <div
        className={isGrid ? styles.gridItem : styles.listItem}
        ref={this.setElement}
      >
        <div className={styles.inner}>
          {!isGrid && isSortable && <DragHandle className={styles.dragHandle} />}

          <div
            className={styles.preview}
            tabIndex={0}
            onClick={this.handleEditStart}
            onKeyPress={this.handleKeyPress}
          >
            <Preview
              layout={previewLayout}
              value={value}
              type={this.getMemberType()}
            />
          </div>

          <div className={styles.functions}>
            {
              value._ref && (
                <IntentLink
                  className={styles.linkToReference}
                  intent="edit"
                  params={{id: value._ref}}
                >
                  <LinkIcon />
                </IntentLink>
              )
            }
            {!type.readOnly && (
              <ConfirmButton
                tabIndex={0}
                kind="simple"
                color="danger"
                icon={TrashIcon}
                title="Delete"
                onClick={this.handleRemove}
              >
                {doConfirm => doConfirm && 'Confirm delete'}
              </ConfirmButton>
            )}
          </div>
        </div>
        <div
          className={options.editModal === 'fold' ? styles.editRootFold : styles.editRoot}
        >
          {isExpanded && this.renderEditItemForm(value)}
        </div>
      </div>
    )
  }
}
