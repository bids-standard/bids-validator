import React, { useEffect, useRef } from "react";
import "./SchemaPicker.css";
import type { SchemaFile } from "./schemaOption.ts";

interface Props {
  text: string;
  onTextChange: (value: string) => void;
  file: (SchemaFile & { name: string }) | null;
  onFileChange: (file: (SchemaFile & { name: string }) | null) => void;
}

export function SchemaPicker(
  { text, onTextChange, file, onFileChange }: Props,
) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const url = file?.blobUrl;
    if (!url) return;
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file?.blobUrl]);

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    onFileChange({ blobUrl: URL.createObjectURL(f), name: f.name });
  }

  function clearFile() {
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const fileSelected = file !== null;

  return (
    <div className="schema-picker">
      <label className="schema-picker-row">
        <span>Schema version or URL</span>
        <input
          type="text"
          value={text}
          disabled={fileSelected}
          placeholder="stable, v1.10.0, or https://…/schema.json"
          onChange={(e) => onTextChange(e.target.value)}
        />
      </label>
      <div className="schema-picker-row">
        <label>
          <span>Use local schema file</span>
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelected}
          />
        </label>
        {fileSelected && (
          <>
            <span className="schema-picker-filename">{file!.name}</span>
            <button type="button" onClick={clearFile}>Clear file</button>
          </>
        )}
      </div>
      <p className="schema-picker-hint">
        Leave empty to validate against the bundled schema.
      </p>
    </div>
  );
}
