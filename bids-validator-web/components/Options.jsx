import React from 'react'

const Options = ({ setOption, options }) => (
  <>
    <form className="options" onClick={setOption}>
      <label><strong>Options:</strong></label>
      <input name="ignoreWarnings" type="checkbox" checked={options.ignoreWarnings} readOnly />
      <label htmlFor="ignoreWarnings">Ignore Warnings</label>
      <input name="ignoreNiftiHeaders" type="checkbox" checked={options.ignoreNiftiHeaders} readOnly />
      <label htmlFor="ignoreNiftiHeaders">Ignore NIfTI Headers</label>
    </form>
    <hr />
  </>
)

export default Options