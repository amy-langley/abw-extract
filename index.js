"use strict";
import Baby from 'babyparse'
import JP from 'jsonpath'

const parsed = Baby.parseFiles('arizona-batwatch-classifications.csv', { header: true })
const rows = parsed.data

// console.log(rows[Math.floor(rows.length/2)])

var results = []
var yes = 0, no = 0

for(let val of rows){

  let user_name, created_at, subject_ids, workflow_version
  ({user_name, created_at, subject_ids, workflow_version} = val)

  let subject_id, subject_data, annotations
  subject_id = parseInt(subject_ids, 10)
  try{ subject_data = JSON.parse(val.subject_data) } catch(x){ }
  try{ annotations = JSON.parse(val.annotations) } catch(x) { }

  // ignore classifications where there's no subject id
  // or subject data or annotations
  if(!subject_id || !subject_data || !annotations)
    continue

  // pluck subject data off
  let source_file, start_time, date, gate, tape
  ({source_file, start_time, date, gate, tape} = subject_data[subject_id])

  let inits = tryMultiple(annotations, `$[?(@.task=="init")].value`,`$[?(@.key=="init")].value`)
  let t1s = tryMultiple(annotations, `$[?(@.task=="T1")].value`,`$[?(@.key=="T1")].value`)
  let t2s = tryMultiple(annotations, `$[?(@.task=="T2")].value`,`$[?(@.key=="T2")].value`)

}

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

console.log('yes', yes)
console.log('no', no)
