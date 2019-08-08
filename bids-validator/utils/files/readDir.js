const ignore = require('ignore')
const readFile = require('./readFile')
const path = require('path')
const fs = require('fs')
const isNode = typeof window === 'undefined'

/**
 * Read Directory
 *
 * In node it takes a path to a directory and returns
 * an array containing all of the files to a callback.
 * Used to input and organize files in node, in a
 * similar structure to how chrome reads a directory.
 * In the browser it simply passes the file dir
 * object to the callback.
 * @param {String} dir Path to read
 * @param {Object} options
 * @param {boolean} options.followSymbolicDirectories enable to recursively follow directory symlinks
 * @returns {Promise<Object>}
 */
async function readDir(dir, options = { followSymbolicDirectories: true }) {
  const ig = await getBIDSIgnore(dir)
  const fileArray = isNode
    ? await preprocessNode(path.resolve(dir), ig, options)
    : preprocessBrowser(dir, ig)

  return fileArrayToObject(fileArray)
}

/**
 * Transform array of file-like objects to one object with each file as a property
 * @param {Array[Object]} fileArray
 * @returns {Object}
 */
function fileArrayToObject(fileArray) {
  const filesObj = {}
  // converting array to object
  for (let j = 0; j < fileArray.length; j++) {
    filesObj[j] = fileArray[j]
  }
  return filesObj
}

/**
 * Preprocess file objects from a browser
 *
 * 1. Filters out ignored files and folder.
 * 2. Adds 'relativePath' field of each file object.
 */
function preprocessBrowser(filesObj, ig) {
  const filesList = []
  for (let i = 0; i < filesObj.length; i++) {
    const fileObj = filesObj[i]
    fileObj.relativePath = harmonizeRelativePath(fileObj.webkitRelativePath)
    if (ig.ignores(path.relative('/', fileObj.relativePath))) {
      fileObj.ignore = true
    }
    filesList.push(fileObj)
  }
  return filesList
}

/**
 * Harmonize Relative Path
 *
 * Takes a file and returns the browser style relative path
 * base on the environment.
 *
 * Since this may be called in the browser, do not call Node.js modules
 *
 * @param {String} path Relative path to normalize
 * @returns {String}
 */
function harmonizeRelativePath(path) {
  // This hack uniforms relative paths for command line calls to 'BIDS-examples/ds001/' and 'BIDS-examples/ds001'
  if (path.indexOf('\\') !== -1) {
    // This is likely a Windows path - Node.js
    const pathParts = path.split('\\')
    return '/' + pathParts.slice(1).join('/')
  } else if (path[0] !== '/') {
    // Bad POSIX path - Node.js
    const pathParts = path.split('/')
    return '/' + pathParts.slice(1).join('/')
  } else {
    // Already correct POSIX path - Browsers (all platforms)
    return path
  }
}

/**
 * Preprocess directory path from a Node CLI
 *
 * 1. Recursively travers the directory tree
 * 2. Filters out ignored files and folder.
 * 3. Harmonizes the 'relativePath' field
 */
function preprocessNode(dir, ig, options) {
  var str = dir.substr(dir.lastIndexOf(path.sep) + 1) + '$'
  var rootpath = dir.replace(new RegExp(str), '')
  return getFiles(dir, rootpath, ig, options)
}

/**
 * Recursive helper function for 'preprocessNode'
 */
async function getFiles(
  dir,
  rootPath,
  ig,
  options = { followSymbolicDirectories: true },
) {
  let files
  files = await fs.promises.readdir(dir, { withFileTypes: true })
  const filesAccumulator = []
  // Closure to merge the next file depth into this one
  const recursiveMerge = async nextRoot => {
    Array.prototype.push.apply(
      filesAccumulator,
      await getFiles(nextRoot, rootPath, ig, options),
    )
  }
  for (const file of files) {
    const fullPath = path.join(dir, file.name)
    const relativePath = harmonizeRelativePath(
      path.relative(rootPath, fullPath),
    )
    const ignore = ig.ignores(path.relative('/', relativePath))
    const fileObj = {
      name: file.name,
      path: fullPath,
      relativePath,
      ignore,
    }
    if (!ignore) {
      // Three cases to consider: directories, files, symlinks
      if (file.isDirectory()) {
        await recursiveMerge(fullPath)
      } else if (file.isSymbolicLink()) {
        // Allow skipping symbolic links which lead to recursion
        // Disabling this is a big performance advantage on high latency
        // storage but it's a good default for versatility
        if (options.followSymbolicDirectories) {
          try {
            const targetPath = await fs.promises.realpath(fullPath)
            const targetStat = await fs.promises.stat(targetPath)
            // Either add or recurse from the target depending
            if (targetStat.isDirectory()) {
              await recursiveMerge(targetPath)
            } else {
              filesAccumulator.push(fileObj)
            }
          } catch (err) {
            // Symlink points at an invalid target, skip it
            return
          }
        } else {
          // This branch assumes all symbolic links are not directories
          filesAccumulator.push(fileObj)
        }
      } else {
        filesAccumulator.push(fileObj)
      }
    }
  }
  return filesAccumulator
}

async function getBIDSIgnore(dir) {
  const ig = ignore()
    .add('.*')
    .add('!*.icloud')
    .add('/derivatives')
    .add('/sourcedata')
    .add('/code')

  const bidsIgnoreFileObj = getBIDSIgnoreFileObj(dir)
  if (bidsIgnoreFileObj) {
    return readFile(bidsIgnoreFileObj).then(content => {
      ig.add(content)
      return ig
    })
  }
  return ig
}

/**
 * Get File object corresponding to the .bidsignore file
 * @param dir
 * @returns File object or null if not found
 */
function getBIDSIgnoreFileObj(dir) {
  var bidsIgnoreFileObj = null
  if (isNode) {
    bidsIgnoreFileObj = getBIDSIgnoreFileObjNode(dir)
  } else {
    bidsIgnoreFileObj = getBIDSIgnoreFileObjBrowser(dir)
  }
  return bidsIgnoreFileObj
}

function getBIDSIgnoreFileObjNode(dir) {
  var bidsIgnoreFileObj = null
  var path = dir + '/.bidsignore'
  if (fs.existsSync(path)) {
    bidsIgnoreFileObj = { path: path }
  }
  return bidsIgnoreFileObj
}

function getBIDSIgnoreFileObjBrowser(dir) {
  var bidsIgnoreFileObj = null
  for (var i = 0; i < dir.length; i++) {
    var fileObj = dir[i]
    var relativePath = harmonizeRelativePath(fileObj.webkitRelativePath)
    if (relativePath === '/.bidsignore') {
      bidsIgnoreFileObj = fileObj
      break
    }
  }
  return bidsIgnoreFileObj
}

module.exports = {
  default: readDir,
  readDir,
  getFiles,
  fileArrayToObject,
  harmonizeRelativePath,
}
