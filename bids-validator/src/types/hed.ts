import hedValidator from '../deps/hed-validator.ts'
export class BidsSidecar extends hedValidator.validator.BidsSidecar {}
export class BidsEventFile extends hedValidator.bids.BidsEventFile {} 

export class HEDArgs {
  eventData: BidsEventFile[]
  sidecarData: BidsSidecar[]
  datasetDescription: string 
  dir: string

  constructor() {
    this.eventData = [] as BidsEventFile[]
    this.sidecarData = [] as BidsSidecar[]
    this.datasetDescription = ''
    this.dir = ''
  }
}

