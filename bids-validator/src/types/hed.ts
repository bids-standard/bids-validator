import hedValidator from "../deps/hed-validator.ts";
export class BidsSidecar extends hedValidator.validator.BidsSidecar {}
export class BidsEventFile extends hedValidator.bids.BidsEventFile {}
export class BidsJsonFile extends hedValidator.bids.BidsJsonFile {}

export class HEDArgs {
  eventData: BidsEventFile[];
  sidecarData: BidsSidecar[];
  datasetDescription: BidsJsonFile;
  dir: string;

  constructor(
    eventData = [] as BidsEventFile[],
    sidecarData = [] as BidsSidecar[],
    datasetDescription = {} as BidsJsonFile,
    dir = '',
  ) {
    this.eventData = eventData;
    this.sidecarData = sidecarData;
    this.datasetDescription = datasetDescription;
    this.dir = dir;
  }
}
