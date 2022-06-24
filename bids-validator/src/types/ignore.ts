/**
 * Abstract .bidsignore handler
 */
export interface FileIgnoreRules {
  test: (path: string) => boolean
}
