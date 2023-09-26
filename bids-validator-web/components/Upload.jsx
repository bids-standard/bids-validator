// dependencies -------------------------------------------------------

import React from 'react'

class Upload extends React.Component {
  // life cycle events --------------------------------------------------
  render() {
    return (
      <input
        type="file"
        className="dirUpload-btn"
        onClick={this.props.onClick}
        onChange={this._onFileSelect.bind(this)}
        ref={this.fileSelectRef}
        directory=""
        webkitdirectory=""
      />
    )
  }

  // custom methods -----------------------------------------------------
  _onFileSelect(e) {
    if (e.target && e.target.files.length > 0) {
      let files = e.target.files
      let results = { list: files }
      this.props.onChange(results)
    }
  }
}

export default Upload
