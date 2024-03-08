import hedValidator from '../deps/hed-validator.ts'
export class BidsSidecar extends hedValidator.validator.BidsSidecar {}
export class BidsEventFile extends hedValidator.bids.BidsEventFile {} 
export class BidsJsonFile extends hedValidator.bids.BidsJsonFile {} 

export class HEDArgs {
  eventData: BidsEventFile[]
  sidecarData: BidsSidecar[]
  datasetDescription: BidsJsonFile
  dir: string

  constructor() {
    this.eventData = [] as BidsEventFile[]
    this.sidecarData = [] as BidsSidecar[]
    this.datasetDescription = {} as BidsJsonFile
    this.dir = ''
  }
}

