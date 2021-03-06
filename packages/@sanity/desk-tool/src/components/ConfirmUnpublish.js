import PropTypes from 'prop-types'
import React from 'react'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import Spinner from 'part:@sanity/components/loading/spinner'

import enhanceWithReferringDocuments from './enhanceWithReferringDocuments'
import DocTitle from './DocTitle'
import ReferringDocumentsList from './ReferringDocumentsList'

export default enhanceWithReferringDocuments(class ConfirmDelete extends React.PureComponent {
  static propTypes = {
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    published: PropTypes.object,
    draft: PropTypes.object,
    referringDocuments: PropTypes.array,
    isCheckingReferringDocuments: PropTypes.bool
  }

  handleAction = action => {
    const {onCancel, onConfirm} = this.props
    if (action.name === 'confirm') {
      onConfirm()
    }
    if (action.name === 'cancel') {
      onCancel()
    }
  }

  render() {
    const {isCheckingReferringDocuments, referringDocuments, draft, published, onCancel} = this.props

    const hasReferringDocuments = referringDocuments.length > 0
    const canContinue = !isCheckingReferringDocuments && !hasReferringDocuments
    const actions = [
      canContinue && {name: 'confirm', title: 'Unpublish now'},
      {name: 'cancel', title: hasReferringDocuments ? 'Ok, got it' : 'Cancel', kind: 'secondary'}
    ].filter(Boolean)

    const title = (isCheckingReferringDocuments && 'Checking…')
      || (hasReferringDocuments ? 'Cannot unpublish' : 'Confirm unpublish')

    return (
      <Dialog
        isOpen
        showHeader
        centered
        title={title}
        onClose={onCancel}
        onAction={this.handleAction}
        actions={actions}
      >
        {isCheckingReferringDocuments && <Spinner message="Looking for referring documents…" />}
        {hasReferringDocuments && (
          <div>
            <h3>
              Found {referringDocuments.length === 1 ? 'a document' : `${referringDocuments.length} documents`} that
              refers to <DocTitle document={(draft || published)} />
            </h3>
            <p>
              You cannot unpublish a document that other documents are referring to.
              In order to continue, every reference
              to <strong><DocTitle document={(draft || published)} /></strong> needs
              to be removed from
              the following document{referringDocuments.length > 1 && 's'}:
            </p>
            <ReferringDocumentsList documents={referringDocuments} />
          </div>
        )}
        {!isCheckingReferringDocuments && !hasReferringDocuments && (
          <div style={{padding: 10}}>
            <p>
              Are you sure you would like to unpublish the document{' '}
              <strong>
                <DocTitle document={(draft || published)} />
              </strong>?
            </p>
            <h2>Careful!</h2>
            <p>
              If you unpublish, this document will no longer be available for the public, but it will not be
              deleted and can be published again later if you change your mind.
            </p>
          </div>
        )}
      </Dialog>
    )
  }
})
