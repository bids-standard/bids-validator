const { assert } = require('chai')
const {
  readLsTreeLines,
  readCatFileLines,
  processFiles,
} = require('../files/readDir')
const ignore = require('ignore')

describe('gitTreeMode functions', () => {
  describe('readLsTreeLines', () => {
    it('will handle regular files', () => {
      const lsTreeLines = [
        '100644 blob longkeystring    1000000\tfile/path',
        '100644 blob anotherlongkeystring     1\tpath/to/file',
      ]

      const output = readLsTreeLines(lsTreeLines)
      assert.hasAllKeys(output, ['files', 'symlinkFilenames', 'symlinkObjects'])
      assert.isEmpty(output.symlinkFilenames)
      assert.isEmpty(output.symlinkObjects)
      assert.equal(output.files[0].path, 'file/path')
      assert.equal(output.files[0].size, 1000000)
      assert.equal(output.files[1].key, 'anotherlongkeystring')
      assert.isString(output.files[1].id)
    })

    it('will handle symlinked files', () => {
      const lsTreeLines = [
        '120000 blob e886cd8566b5e97db1fc41bb9364fc22cbe81426     199\tsymlink/filepath',
        '120000 blob e2cd091677489a0377d9062347c32d3efebf4322     199\they/jude/dont/be/afraid',
      ]
      const expected = {
        files: [],
        symlinkFilenames: ['symlink/filepath', 'hey/jude/dont/be/afraid'],
        symlinkObjects: [
          'e886cd8566b5e97db1fc41bb9364fc22cbe81426',
          'e2cd091677489a0377d9062347c32d3efebf4322',
        ],
      }
      assert.deepEqual(readLsTreeLines(lsTreeLines), expected)
    })
  })

  describe('readCatFileLines', () => {
    it('creates file objects from git cat-file output', () => {
      const catFileOutput = [
        'hash blob 140',
        '.git/annex/objects/Mv/99/SHA256E-s54--42c98d14dbe3d066d35897a61154e39ced478cd1f0ec6159ba5f2361c4919878.json/SHA256E-s54--42c98d14dbe3d066d35897a61154e39ced478cd1f0ec6159ba5f2361c4919878.json',
        'otherhash blob 140',
        '.git/annex/objects/QV/mW/SHA256E-s99--bbef536348750373727d3b5856398d7377e5d7e23875eed026b83d12cee6f885.json/SHA256E-s99--bbef536348750373727d3b5856398d7377e5d7e23875eed026b83d12cee6f885.json',
      ]
      const symlinkFilenames = ['path/to/file/a', 'path/to/file/b']
      const output = readCatFileLines(catFileOutput, symlinkFilenames)
      assert.equal(output[0].path, symlinkFilenames[0])
      assert.equal(output[0].size, 54)
      assert.equal(
        output[1].key,
        'SHA256E-s99--bbef536348750373727d3b5856398d7377e5d7e23875eed026b83d12cee6f885.json',
      )
      assert.isString(output[1].id)
    })
  })

  describe('processFiles', () => {
    const ig = ignore()
      .add('.*')
      .add('/derivatives')
    it('aggregates, filters, and augments the files given to it', () => {
      const filesA = [
        {
          path: '.DS_Store',
          size: 1000000,
          id: 'athousandthousand',
          key: 'amillion',
        },
        {
          path: 'path/to/a',
          size: 100,
          id: '4yhct827ty08q4uv507829',
          key: 'oiweurykjsvmxcnvjqweir',
        },
        {
          path: 'path/to/b',
          size: 99,
          id: 'q',
          key: '213494759827349237492759493045982734982',
        },
      ]
      const filesB = [
        {
          path: 'path/to/c',
          size: 98,
          id: 'ididid',
          key: 'o',
        },
        {
          path: 'path/to/d',
          size: 1,
          id: 'none',
          key: 'hairpin',
        },
        {
          path: 'derivatives/to/derivative_file',
          size: 1,
          id: 'gone',
          key: 'with_the_wind',
        },
      ]
      const expected = [
        {
          path: '/path/to/dataset/path/to/a',
          size: 100,
          id: '4yhct827ty08q4uv507829',
          key: 'oiweurykjsvmxcnvjqweir',
          relativePath: '/path/to/a',
          name: 'a',
        },
        {
          path: '/path/to/dataset/path/to/b',
          size: 99,
          id: 'q',
          key: '213494759827349237492759493045982734982',
          relativePath: '/path/to/b',
          name: 'b',
        },
        {
          path: '/path/to/dataset/path/to/c',
          size: 98,
          id: 'ididid',
          key: 'o',
          relativePath: '/path/to/c',
          name: 'c',
        },
        {
          path: '/path/to/dataset/path/to/d',
          size: 1,
          id: 'none',
          key: 'hairpin',
          relativePath: '/path/to/d',
          name: 'd',
        },
      ]
      const output = processFiles('/path/to/dataset', ig, filesA, filesB)
      const fileNames = output.map(file => file.name)
      assert(!fileNames.includes('.DS_Store'), 'filters out ignored files')
      assert(!fileNames.includes('derivative_file'), 'filters out ignored directories')
      assert.deepEqual(fileNames, ['a', 'b', 'c', 'd'], 'aggregates files')
      assert.isString(output[0].relativePath, 'adds relativePath to files')
      assert.isString(output[1].relativePath, 'adds name to files')
    })
  })
})
