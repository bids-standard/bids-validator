// dependencies -----------------------------------------------------------

import React from 'react'
import { Card, Collapse, Alert } from 'react-bootstrap'
import PropTypes from 'prop-types'
import pluralize from 'pluralize'
import Issues from './Issues'

// component setup --------------------------------------------------------

export default class ValidationResults extends React.Component {
  constructor() {
    super()
    this.state = {
      warningsOpen: false,
      errorsOpen: false,
    }
  }
  // life cycle events ------------------------------------------------------

  render() {
    let errors = this.props.errors
    let warnings = this.props.warnings

    // errors
    let errorsWrap
    if (errors.length > 0) {
      let fileCount = this._countFiles(errors)
      let errorHeader = (
        <span>
          view {errors.length} {pluralize('error', errors.length)}{' '}
          {this._countText(fileCount)}
        </span>
      )
      errorsWrap = (
        <Card className="fadeIn upload-panel error-wrap my-3" key="1">
          <Alert
            onClick={() =>
              this.setState({ errorsOpen: !this.state.errorsOpen })
            }
            aria-controls="errors-issues"
            aria-expanded={this.state.errorsOpen}
            variant="danger"
            className="mb-0">
            {errorHeader}
          </Alert>
          <Collapse in={this.state.errorsOpen}>
            <Card.Body id="errors-issues">
              <Issues issues={errors} issueType="Error" />
            </Card.Body>
          </Collapse>
        </Card>
      )
    }

    //warnings
    let warningWrap
    if (warnings.length > 0) {
      let fileCount = this._countFiles(warnings)
      let warningHeader = (
        <span>
          view {warnings.length} {pluralize('warning', warnings.length)}{' '}
          {this._countText(fileCount)}
        </span>
      )
      warningWrap = (
        <Card className="fadeIn upload-panel warning-wrap my-3" key="2">
          <Alert
            onClick={() =>
              this.setState({ warningsOpen: !this.state.warningsOpen })
            }
            aria-controls="warning-issues"
            aria-expanded={this.state.warningsOpen}
            variant="warning"
            className="mb-0">
            {warningHeader}
          </Alert>
          <Collapse in={this.state.warningsOpen}>
            <Card.Body id="warning-issues">
              <Issues issues={warnings} issueType="Warning" />
            </Card.Body>
          </Collapse>
        </Card>
      )
    }

    // validations errors and warning wraps
    return (
      // <Menu className="validation-messages" accordion>
      <div>
        {errorsWrap}
        {warningWrap}
      </div>
      // </Menu>
    )
  }

  // custom methods ---------------------------------------------------------

  _countFiles(issues) {
    let numFiles = 0
    for (let issue of issues) {
      if (issue.files.length > 1 || !!issue.files[0].file) {
        numFiles += issue.files.length
      }
    }
    return numFiles
  }

  _countText(count) {
    if (count > 0) {
      return (
        <span>
          in {count} {pluralize('files', count)}
        </span>
      )
    }
  }
}

ValidationResults.propTypes = {
  errors: PropTypes.array,
  warnings: PropTypes.array,
}

ValidationResults.Props = {
  errors: [],
  warnings: [],
}
