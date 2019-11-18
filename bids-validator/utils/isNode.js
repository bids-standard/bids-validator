const isBrowserWorker = () =>
  // eslint-disable-next-line no-undef
  typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope

const isNode = () => typeof window === 'undefined' && !isBrowserWorker()

export default isNode()
