const fs = require("fs")
const axios = require("axios")
const readline = require("readline")

const checkPath = (path, lang) => {
  if (!fs.existsSync(path)) {
    console.log('The path does not exist.')
    return false
  }
  
  if (!fs.existsSync(`${path}/course/${lang}`)) {
    console.log(`Cannot access ${path}/course/${lang}`)
    return false
  }
  
  if (!fs.existsSync(`${path}/course/${lang}/assets`)) {
    console.log('The path does not include an assets folder in the expected place')
    return false
  }
  
  if (!fs.existsSync(`${path}/course/${lang}/assets.json`)) {
    console.log('The path does not include an assets.json file in the expected place')
    return false
  }
  
  if (!fs.existsSync(`${path}/course/${lang}/contentObjects.json`)) {
    console.log('The path does not include an contentObjects.json file in the expected place')
    return false
  }
  
  return true
}

const fetch = async (path, lang) => {
  const validPath = checkPath(path, lang)
  if (!validPath) return
  
  let assetsJSON = JSON.parse(fs.readFileSync(`${path}/course/${lang}/assets.json`, { encoding: 'UTF-8'}));
  let contentObjectsJSON = fs.readFileSync(`${path}/course/${lang}/contentObjects.json`, { encoding: 'UTF-8'});
  
  const pattern = new RegExp(/(?:")(http[^'">]+)(?:\\)/g)
  let matches = contentObjectsJSON.match(pattern)
  
  if (!matches || matches.length < 1) {
    console.log('No matches')
    return
  }
  
  for (let match of matches) {
    match = match.replace('"', '').replace('\\','')
    path_to_file = match.split('/')
    filename = path_to_file.pop();
    path_to_file = path_to_file.join('/')
    
    let response = await axios({
      method: 'get',
      url: match,
      responseType: 'stream'
    })
    
    response.data.pipe(fs.createWriteStream(`${path}/course/${lang}/assets/${filename}`))
    // update contentObjects
    contentObjectsJSON = contentObjectsJSON.replace(match, `course/${lang}/assets/${filename}`)
    // update assets
    assetsJSON[filename] = {
      title: '',
      description: '',
      tags: []
    }
    console.log(`Updated ${filename}`)
  }
  fs.writeFileSync(`${path}/course/${lang}/contentObjects.json`, contentObjectsJSON)
  fs.writeFileSync(`${path}/course/${lang}/assets.json`, JSON.stringify(assetsJSON, null, 2))
  // console.log(matches)
}

const eachRecursive = function(obj, callback) {
  
  for (var k in obj) {
    if (typeof obj[k] == "object" && obj[k] !== null) {
      eachRecursive(obj[k]);
    } else {
      console.log(obj[k])
      // callback(obj[k])
    }
  }
}

const proof = async (path, lang) => {
  console.log(path)
  const validPath = checkPath(path, lang)
  if (!validPath) return
  
  let coList = JSON.parse(fs.readFileSync(`${path}/course/${lang}/contentObjects.json`, { encoding: 'UTF-8'}))
  let dictionary = JSON.parse(fs.readFileSync('./src/proof.json', { encoding: 'UTF-8'}));

  coList.map((co, idx) => {
    // console.log(idx, co)
    for (var key in co) {
      if (typeof co[key] == "string") {
        Object.keys(dictionary.replace).map((term, termid) => {
          // console.log(`coList[${idx}][${key}].includes(${term})?`)
          if (coList[idx][key].includes(term)) {
            console.log(`Updating ${term}=>${dictionary.replace[term]} in coList[${idx}][${key}]`)
            coList[idx][key] = coList[idx][key].replace(term, dictionary.replace[term])
          }
        })
        dictionary.warn.map((term, termid) => {
          // console.log(`coList[${idx}][${key}].includes(${term})?`)
          if (coList[idx][key].toLowerCase().includes(term.toLowerCase())) {
            console.log(`WARNNG ${term} in coList[${idx}][${key}]: ${coList[idx][key]}`)
          }
        })
      }
    }
  })
  
  //console.log(coList)
  
  fs.writeFileSync(`${path}/course/${lang}/contentObjects.json`, JSON.stringify(coList, null, 2))
  
  return
}

module.exports = {
  fetch,
  proof
}