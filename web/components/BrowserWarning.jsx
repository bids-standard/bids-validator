import React from 'react'

// component setup -----------------------------------------------------------

const BrowserWarning = () => (
  <div className="alert alert-danger" role="alert">
    <h4>
      <strong>Sorry this demo does not support your current browser. </strong>
      Although the validator itself works in multiple browsers as well as
      node.js, this demo only works in Chrome or Firefox. At this point Chrome
      and Firefox are the only browsers to support folder selection from a file
      input. Please try this out in Chrome or Firefox.
    </h4>
  </div>
)

export default BrowserWarning
