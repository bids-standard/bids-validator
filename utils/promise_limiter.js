/* limits promises to LIMIT to prevent memory overuse */

const pLimit = require('p-limit')
const LIMIT = 200

module.exports = pLimit(LIMIT)
