import React from 'react'
import PropTypes from 'prop-types'

// component setup ---------------------------------------------------------------------------

export default class Spinner extends React.Component {
  // life cycle events -------------------------------------------------------------------------

  render() {
    let spinner = (
      <div className="loading-wrap fadeIn">
        <div className="spinner">
          <div className="spinnerinner" />
        </div>
        <span>{this.props.text}</span>
      </div>
    )
    return this.props.active ? spinner : null
  }
}

Spinner.propTypes = {
  text: PropTypes.string,
  active: PropTypes.bool,
}

Spinner.defaultProps = {
  text: 'Loading',
  active: false,
}
