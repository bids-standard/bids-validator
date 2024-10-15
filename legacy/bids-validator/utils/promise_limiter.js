/* limits promises to LIMIT to prevent memory overuse */

import pLimit from 'p-limit'

const LIMIT = 200

export default pLimit(LIMIT)
