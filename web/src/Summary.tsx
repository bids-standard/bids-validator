import React from "react"
import "./Summary.css"

const summary = {
  "sessions": [],
  "subjects": ["01", "02"],
  "subjectMetadata": [{ "participantId": "01", "age": 25, "sex": "M" }, {
    "participantId": "02",
    "age": 27,
    "sex": "F",
  }],
  "tasks": [],
  "modalities": ["MRI"],
  "secondaryModalities": ["MRI_Structural"],
  "totalFiles": 6,
  "size": 623891,
  "dataProcessed": false,
  "pet": {},
  "dataTypes": ["anat"],
  "schemaVersion": "0.7.3-dev",
}

/**
 * Format bytes as human-readable text.
 *
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @return Formatted string.
 */
function humanFileSize(bytes, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024

  if (Math.abs(bytes) < thresh) {
    return bytes + " B"
  }

  const units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"]
  let u = -1
  const r = 10 ** dp

  do {
    bytes /= thresh
    ;++u
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1
  )

  return bytes.toFixed(dp) + " " + units[u]
}

export function Summary({ data }) {
  return (
    <span className="summary">
      <div className="row">
        <div className="column">
          <h3>Summary:</h3>
          <ul>
            <li>
              {data.totalFiles} File{data.totalFiles === 1 ? "" : "s"},{" "}
              {humanFileSize(data.size)}
            </li>
            <li>
              {data.subjects.length} Subjects, {data.sessions.length} Sessions
            </li>
            <li>
              Schema version: {data.schemaVersion}
            </li>
          </ul>
        </div>
        <div className="column">
          <h3>Available Tasks:</h3>
          <ul>
            {data.tasks.map((task) => <li key={task}>{task}</li>)}
          </ul>
        </div>
        <div className="column">
          <h3>Available Modalities:</h3>
          <ul>
            {data.modalities.map((modality) => (
              <li key={modality}>{modality}</li>
            ))}
          </ul>
        </div>
      </div>
    </span>
  )
}
