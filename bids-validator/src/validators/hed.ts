import hedValidator from "../deps/hed-validator.ts";
import { hedOldToNewLookup } from "../issues/list.ts";
import { GenericSchema } from "../types/schema.ts";
import { IssueFile } from "../types/issues.ts";
import { BIDSContext, BIDSContextDataset } from "../schema/context.ts";
import { DatasetIssues } from "../issues/datasetIssues.ts";
import { ColumnsMap } from "../types/columns.ts";

export class BidsJson extends hedValidator.bids.BidsJsonFile {}
export class BidsSidecar extends hedValidator.bids.BidsSidecar {}
export class BidsEventFile extends hedValidator.bids.BidsEventFile {}
export class SchemasSpec extends hedvalidator.common.schema.types.SchemasSpec {}

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


let hedSchemas: SchemasSpec | undefined | null = undefined;
function setHedSchemas(datasetDescriptionJson) {
  const datasetDescriptionData = new hedValidator.bids.BidsJsonFile(
    '/dataset_description.json',
    datasetDescriptionJson,
    context.file
  )
  try {
    hedSchemas = await hedValidator.bids.buildBidsSchemas(
      datasetDescriptionData,
      null,
    )
    return []
  } catch (issueError) {
    hedSchemas = null
    return hedValidator.bids.BidsHedIssue.fromHedIssues(
      issueError,
      datasetDescriptionData.file,
    )
  }
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
  let file;
  let hedValidationIssues = []

  try {
    if (context.extension == ".tsv" && context.columns.length) {
      if ((!"HED") in context.columns && !sidecarValueHasHed(context.sidecar)) {
        return;
      }
      file = hedValidateTsv(schema, context);
    }
    if (context.extension == ".json" && sidecarValueHasHed(context.json)) {
      file = hedValidateJson(schema, context);
    }
    if (file === undefined) {
      return
    }
    hedValidationIssues = validateFile(file, headSchemas)
  } catch {
    // old code 109
  }
  hedValidationIssues.map((hedIssue) => {
    const code = hedIssue.code;
    if (code in hedOldToNewLookup) {
      context.issues.addNonSchemaIssue(
        hedOldToNewLookup[code],
        [{ ...hedIssue.file, evidence: hedIssue.evidence }],
      );
    }
  })
}

async function buildHedTsvFile(
  schema: GenericSchema,
  context: BIDSContext,
): Promise<void> {
  const tsvContent = columnsToContent(context.columns);

  const eventFile = new hedValidator.bids.BidsTsvFile(
    context.path,
    tsvContent,
    context.file,
    [],
    context.sidecar,
  );
  return eventFile
}

async function buildHedSidecarFile(
  schema: GenericSchema,
  context: BIDSContext,
): Promise<void> {
  const sidecarFile = new hedValidator.bids.BidsSidecar(
    context.path,
    await context.json,
    context.file,
  );
  return sidecarFile
}

function validateFile(file, hedSchemas) {
  const issues = file.validate(hedSchemas)
  if (issues === null) {
    throw new Error()
  }
  return issues
}
