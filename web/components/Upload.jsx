// dependencies -------------------------------------------------------

import React from 'react'
import ReactDOM from 'react-dom'

class Upload extends React.Component {
  // life cycle events --------------------------------------------------

  componentDidMount() {
    ReactDOM.findDOMNode(this).setAttribute('webkitdirectory', true)
    ReactDOM.findDOMNode(this).setAttribute('directory', true)
    this._setRefs(this.refs)
  }

  render() {
    return (
      <input
        type="file"
        className="dirUpload-btn"
        onClick={this._click.bind(this)}
        onChange={this._onFileSelect.bind(this)}
        ref="fileSelect"
      />
    )
  }

  // custom methods -----------------------------------------------------

  _click(e) {
    ReactDOM.findDOMNode(this.refs.fileSelect).value = null
    if (this.props.onClick) {
      this.props.onClick(e)
    }
  }

  _onFileSelect(e) {
    if (e.target && e.target.files.length > 0) {
      let files = e.target.files
      let results = { list: files }
      this.props.onChange(results)
    }
  }

  _setRefs(refs) {
    if (this.props.setRefs) {
      this.props.setRefs(refs)
    }
  }
}

export default Upload
