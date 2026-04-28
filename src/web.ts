/**
 * Entrypoint to create a bundle that can be imported in the web app
 *
 * Used in /web/src/App.tsx
 */
export { fileListToTree } from '@bids/validator/files/browser'
export { getVersion, validate, type ValidationResult } from '@bids/validator/validate'
