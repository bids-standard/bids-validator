import start from './start';
import reset from './reset';
import quickTest from './quickTest';
import quickTestError from './quickTestError';
import fullTest from './fullTest';
import subIDsesIDmismatchTest from './subSesMismatchTest';

export default {
  options: {},
  issues: [],
  start: start,
  quickTestError: quickTestError,
  quickTest: quickTest,
  fullTest: fullTest,
  subIDsesIDmismatchtest: subIDsesIDmismatchTest,
  reset: reset,
};
