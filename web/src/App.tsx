import React, { useEffect, useState } from "react";
import "./App.css";
import { directoryOpen } from "https://esm.sh/browser-fs-access@0.35.0";
import confetti from "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.module.mjs";
import Markdown from "react-markdown";
import { fileListToTree, getVersion, validate } from "../dist/validator/web.js";
import type { ValidationResult } from "../../src/types/validation-result.ts";
import { Collapse } from "./Collapse.tsx";
import { Summary } from "./Summary.tsx";
import { SchemaPicker } from "./SchemaPicker.tsx";
import {
  computeEffectiveSchema,
  isSchemaLoadError,
  type SchemaFile,
} from "./schemaOption.ts";

function formatMessage(text) {
  if (!text) return "";
  return text.replaceAll(
    "SPEC_ROOT/",
    "https://bids-specification.readthedocs.io/en/stable/",
  );
}

function Files({ issues }) {
  const unique = new Map(issues.map(({ location, issueMessage }) => {
    return [`${location}${issueMessage ?? ""}`, { location, issueMessage }];
  }));
  return (
    <ul>
      {[...unique.values()].map(({ location, issueMessage }) => {
        return (
          <li key={location}>
            {location}
            {issueMessage && (
              <>
                {" ("}
                <span style={{ display: "inline-block", verticalAlign: "top" }}>
                  <Markdown components={{ p: "span" }}>
                    {formatMessage(issueMessage)}
                  </Markdown>
                </span>
                {")"}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Issue({ data }) {
  const { code, severity } = data.issues[0];
  const ret = [];
  for (const [subCode, subIssues] of data.groupBy("subCode")) {
    if (subIssues.size === 0) {
      continue;
    }
    const label = `${severity}: ${code}` +
      (subCode === "None" ? "" : ` (${subCode})`);
    ret.push(
      <div className={severity}>
        <Collapse label={label}>
          <div className="markdown-text">
            <Markdown>{formatMessage(data.codeMessages.get(code))}</Markdown>
          </div>
          <Files issues={subIssues.issues}></Files>
          <p>
            <a href={`https://neurostars.org/search?q=${code}`}>
              Search for this issue on Neurostars.
            </a>
          </p>
        </Collapse>
      </div>,
    );
  }
  return ret;
}

function App() {
  const [validation, setValidation] = useState<ValidationResult>();
  const [schemaText, setSchemaText] = useState<string>("");
  const [schemaFile, setSchemaFile] = useState<
    (SchemaFile & { name: string }) | null
  >(null);
  const [schemaError, setSchemaError] = useState<string | undefined>();

  async function validateDir() {
    const dirHandle = await directoryOpen({ recursive: true });
    const fileTree = await fileListToTree(dirHandle);
    const schema = computeEffectiveSchema(schemaText, schemaFile);
    try {
      setValidation(await validate(fileTree, { schema }));
      setSchemaError(undefined);
    } catch (err) {
      if (isSchemaLoadError(err)) {
        setSchemaError(
          err instanceof Error ? err.message : String(err),
        );
        setValidation(undefined);
      } else {
        setSchemaError(
          `Validation failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        setValidation(undefined);
      }
    }
  }

  const [version, setVersion] = useState<string>();
  // useEffect avoids rerunning getVersion on every render
  useEffect(() => getVersion().then(setVersion), []);

  const advanced = (
    <>
      <Collapse label="Advanced options">
        <SchemaPicker
          text={schemaText}
          onTextChange={setSchemaText}
          file={schemaFile}
          onFileChange={setSchemaFile}
        />
      </Collapse>
      {schemaError && <div className="error schema-error">{schemaError}</div>}
    </>
  );

  let validatorOutput;

  if (validation) {
    const errorList = [];
    const warningList = [];
    let success = "";
    for (
      const [code, issues] of validation.issues.filter({ severity: "error" })
        .groupBy("code")
    ) {
      if (code === "None") {
        continue;
      }
      errorList.push(...Issue({ data: issues }));
    }
    for (
      const [code, issues] of validation.issues.filter({ severity: "warning" })
        .groupBy("code")
    ) {
      if (code === "None") {
        continue;
      }
      warningList.push(...Issue({ data: issues }));
    }
    if (errorList.length === 0 && warningList.length === 0) {
      success = (
        <div className="success">
          <Collapse label="No Issues Detected!">
            <div>Thanks for Everything. I Have No Complaints Whatsoever.</div>
          </Collapse>
        </div>
      );
      confetti({
        particleCount: 500,
        spread: 180,
        ticks: 400,
      });
    }
    validatorOutput = (
      <>
        <button onClick={validateDir}>Reselect Files</button>
        {advanced}
        <div>
          <ul className="issues-list">
            {errorList}
            {warningList}
            {success}
          </ul>
          <Summary data={validation.summary} />
          <a
            href={`data:application/json;charset=utf-8,${
              encodeURIComponent(JSON.stringify(validation))
            }`}
            target="_blank"
            download="bids-validator-output.json"
          >
            Save JSON log.
          </a>
        </div>
      </>
    );
    if (errorList.length === 0) {
    }
  } else {
    validatorOutput = (
      <>
        <h2>
          Select a{" "}
          <a href="https://bids.neuroimaging.io" target="_blank">
            BIDS dataset
          </a>{" "}
          to validate.
        </h2>
        <button onClick={validateDir}>Select Dataset Files</button>
        {advanced}
      </>
    );
  }
  return (
    <>
      <h1>BIDS Validator</h1>
      {validatorOutput}
      <div>
        <em>BIDS Validator version: {version}</em>
      </div>
      <div>
        Note: Selecting a dataset only performs validation. Files are never
        uploaded.
      </div>
      <div>
        The legacy BIDS Validator is available{" "}
        <a href="https://bids-standard.github.io/legacy-validator/">here.</a>
      </div>
    </>
  );
}

export default App;
