import React, { useId } from "react"

import "./Collapse.css"

export function Collapse({ label, children }) {
  const id = useId()
  return (
    <div className="wrap-collapsible">
      <input id={id} className="toggle" type="checkbox" />
      <label htmlFor={id} className="lbl-toggle">{label}</label>
      <div className="collapsible-content">
        <div className="content-inner">
          {children}
        </div>
      </div>
    </div>
  )
}
