// dependencies -------------------------------------------------------

import React from 'react'
import pluralize from 'pluralize'
import bytes from 'bytes'
import List from './List'

class Summary extends React.Component {
  // life cycle events --------------------------------------------------

  render() {
    let summary = this.props.summary
    if (summary) {
      var numSessions =
        summary.sessions.length > 0 ? summary.sessions.length : 1
      return (
        <div>
          <h3>{this.props.dirName}</h3>
          <div className="card container my-3">
            <div className="card-header row summary p-4">
              <div className="col-sm">
                <h5>Summary</h5>
                <ul>
                  <li>
                    {summary.totalFiles} {pluralize('File', summary.totalFiles)}
                    , {bytes(summary.size)}
                  </li>
                  <li>
                    {summary.subjects.length} -{' '}
                    {pluralize('Subject', summary.subjects.length)}
                  </li>
                  <li>
                    {numSessions} - {pluralize('Session', numSessions)}
                  </li>
                </ul>
              </div>
              <div className="col-sm">
                <h5>Available Tasks</h5>
                <ul>
                  <List items={summary.tasks} />
                </ul>
              </div>
              <div className="col-sm">
                <h5>Available Modalities</h5>
                <ul>
                  <List items={summary.modalities} />
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      return null
    }
  }
}

export default Summary
