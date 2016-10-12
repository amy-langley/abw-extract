"use strict";
import Baby from 'babyparse'
import JP from 'jsonpath'
import fs from 'fs'

function flatten(maybeArray){
  if(maybeArray && maybeArray[0] && maybeArray[0] instanceof Array)
    return flatten(maybeArray[0])

  return maybeArray || []
}

function tryMultiple(searchObj, ...queries){
  var result = []
  var query
  while(result.length < 1 && (query = queries.shift())){
    result = JP.query(searchObj, query)
  }

  return flatten(result)
}

function doParse(filename){
  const parsed = Baby.parseFiles(filename, { header: true })
  const rows = parsed.data

  var results = []
  var row = -1;

  for(let val of rows){

    row++

    let user_name, created_at, subject_ids, workflow_version
    ({user_name, created_at, subject_ids, workflow_version} = val)

    let subject_id, subject_data, annotations
    subject_id = parseInt(subject_ids, 10)
    try{ subject_data = JSON.parse(val.subject_data) } catch(x){ }
    try{ annotations = JSON.parse(val.annotations) } catch(x) { }

    // ignore classifications where there's no subject id
    // or subject data or annotations
    if(!subject_id || !subject_data || !annotations){
      console.log(`WARNING: invalid data in row ${row}`)
      continue
    }

    // pluck subject data off
    let source_file, start_time, date, gate, tape
    ({source_file, start_time, date, gate, tape} = subject_data[subject_id])

    let inits = tryMultiple(annotations, `$[?(@.task=="init")].value`,`$[?(@.key=="init")].value`)
    let t1s = tryMultiple(annotations, `$[?(@.task=="T1")].value`,`$[?(@.key=="T1")].value`)
    let t2s = tryMultiple(annotations, `$[?(@.task=="T2")].value`,`$[?(@.key=="T2")].value`)

    //T1 seems to be optional, so handle that
    if(t1s.length < 1)
      t1s.push(null)

    // write a warning if we're missing an init or a t2
    if(inits.length < 1 || t2s.length < 1)
      console.log(`WARNING: missing annotations in row ${row}`)

    var initval, t1val, t2val
    for(initval of inits)
      for(t2val of t2s)
        for(t1val of t1s){
          results.push({
            classification_id: row,
            user_name: user_name,
            created_at: created_at,
            workflow_version: workflow_version,
            subject_zooID: subject_id,
            source_file: source_file,
            start_time: start_time,
            date: date,
            gate: gate,
            tape: tape,
            initAnswer: initval,
            t1Answer: t1val,
            t2Answer: t2val
          })
        }
  }

  return results
}

try {
  var results = doParse('arizona-batwatch-classifications.csv')
  var resultText = Baby.unparse(results, {header: true})
  fs.writeFile("output.csv", resultText, function(err){
    if(err)
      throw err

    console.log()
    console.log("SUCCESS: File 'output.csv' written")
  })
} catch (e) {
  console.log()
  console.log(`FAILURE: ${e}`)
}
