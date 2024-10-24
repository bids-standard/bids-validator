import React from 'react'
import PropTypes from 'prop-types'

export default class List extends React.Component {
  render() {
    if (this.props.items) {
      return this.props.items.map((item, index) => {
        return <li key={index}>{item}</li>
      })
    }
  }
}

List.propTypes = {
  items: PropTypes.array,
}
List.defaultProps = {
  items: [],
}
