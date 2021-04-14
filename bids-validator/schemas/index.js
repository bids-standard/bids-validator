const yaml = require('js-yaml')
const fs = require('fs')

const datatypes = ['anat', 'beh', 'dwi', 'eeg', 'fmap', 'func', 'ieeg', 'meg']

const generateRegex = (pythonRegex = false) => {
  // Python regex needs a 'P' before matching group name
  let P = pythonRegex ? 'P' : ''

  const regex = {
    label: '[a-zA-Z0-9]+',
    index: '[0-9]+',
    sub_ses_dirs:
      '^[\\/\\\\](sub-[a-zA-Z0-9]+)[\\/\\\\](?:(ses-[a-zA-Z0-9]+)[\\/\\\\])?',
    type_dir: '[\\/\\\\]',
    sub_ses_entity: '\\1(_\\2)?',
    optional: '?',
    required: '',
  }

  const entities = yaml.safeLoad(fs.readFileSync('./entities.yaml', 'utf8'))

  let datatypes_yaml = {}
  datatypes.map(x => {
    datatypes_yaml[x] = yaml.safeLoad(
      fs.readFileSync(`./datatypes/${x}.yaml`, 'utf8'),
    )
  })

  datatypes_regex = {}
  datatypes.map(type => {
    datatypes_yaml[type].map(datatype_yaml => {
      let file_regex = ''
      file_regex = `${regex.sub_ses_dirs}${type}${regex.type_dir}${regex.sub_ses_entity}`
      Object.keys(datatype_yaml.entities).map(entity => {
        // sub and ses entities in file name handled by directory pattern matching groups
        if (entity === 'sub' || entity === 'ses') {
          return
        }
        console.log(type)
        console.log(entity)
        console.log('-----------')
        let format = regex[entities[entity].format]
        file_regex = file_regex.concat(
          `(?${P}<${entity}>_${entity}-${format})${
            regex[entities[entity].entity]
          }`,
        )
      })
      let suffix_regex = `_(?${P}<suffix>${datatype_yaml.suffixes.join('|')})`
      let ext_regex = `(?${P}<ext>${datatype_yaml.extensions.join('|')})`
      file_regex = file_regex.concat(`${suffix_regex}${ext_regex}$`)
      if (!datatypes_regex[type]) {
        datatypes_regex[type] = []
      }
      datatypes_regex[type].push(file_regex)
    })
  })
  console.log(datatypes_regex)
  let filename = pythonRegex ? 'python_regex.json' : 'regex.json'
  fs.writeFileSync(`./${filename}`, JSON.stringify(datatypes_regex, null, 2))
}

generateRegex()
