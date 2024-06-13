import hedValidator from "../deps/hed-validator.ts";
import { hedOldToNewLookup } from "../issues/list.ts";
import { GenericSchema } from "../types/schema.ts";
import { IssueFile } from "../types/issues.ts";
import { BIDSContext, BIDSContextDataset } from "../schema/context.ts";
import { DatasetIssues } from "../issues/datasetIssues.ts";
import { ColumnsMap } from "../types/columns.ts";

export class BidsSidecar extends hedValidator.validator.BidsSidecar {}
export class BidsEventFile extends hedValidator.bids.BidsEventFile {}

// https://stackoverflow.com/questions/17428587/transposing-a-2d-array-in-javascript
function transpose(matrix: string[][]) {
  return matrix[0].map((col, i) => matrix.map((row) => row[i]));
}

function columnsToContent(columns: ColumnsMap) {
  const cols = [] as [][];
  for (let header in columns) {
    // @ts-expect-error
    cols.push(columns[header]);
  }
  const rows = transpose(cols);
  return {
    headers: Object.keys(columns),
    rows,
  };
}

function detectHed(tsvData: BidsEventFile[], sidecarData: BidsSidecar[]) {
  return (
    sidecarData.some((sidecarFileData) => {
      return Object.values(sidecarFileData.sidecarData).some(
        sidecarValueHasHed,
      );
    }) ||
    tsvData.some((tsvFileData) => {
      return "HED" in tsvFileData.parsedTsv;
    })
  );
}

export function testDetectHed(dsContext: BIDSContextDataset) {
  return detectHed(dsContext.hedArgs.eventData, dsContext.hedArgs.sidecarData);
}

function sidecarValueHasHed(sidecarValue: unknown) {
  return (
    sidecarValue !== null &&
    typeof sidecarValue === "object" &&
    "HED" in sidecarValue &&
    sidecarValue.HED !== undefined
  );
}


export interface HedIssue {
  code: number;
  file: IssueFile;
  evidence: string;
}

export async function hedValidate(
  schema: GenericSchema,
  context: BIDSContext,
): Promise<void> {
  if (context.extension == ".tsv" && context.columns.length) {
    if ((!"HED") in context.columns && !sidecarValueHasHed(context.sidecar)) {
      return;
    }
    const tsvContent = columnsToContent(context.columns);
    const eventFile = new BidsEventFile(
      context.path,
      [],
      context.sidecar,
      tsvContent,
      context.file,
    );

    const sidecarFile = new BidsSidecar(
      context.path,
      await context.json,
      context.file,
    );
    const ddJsonFile = new BidsSidecar(
      "dataset_description.json",
      context.dataset.dataset_description,
      context.file,
    );
    let hedDs = new hedValidator.validator.BidsDataset([eventFile], [
      sidecarFile,
    ], ddJsonFile);

    await hedValidator.validator
      .validateBidsDataset(hedDs)
      .then((hedValidationIssues: HedIssue[]) => {
        const newStyle = hedValidationIssues.map((hedIssue) => {
          const code = hedIssue.code;
          if (code in hedOldToNewLookup) {
            context.issues.addNonSchemaIssue(
              hedOldToNewLookup[code],
              [{ ...hedIssue.file, evidence: hedIssue.evidence }],
            );
          }
        });
      });
  }
}
