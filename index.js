"use strict";
import Baby from 'babyparse'
import JP from 'jsonpath'

const parsed = Baby.parseFiles('arizona-batwatch-classifications.csv', { header: true })
const rows = parsed.data

// console.log(rows[Math.floor(rows.length/2)])

var results = []
var good = 0;
var bad = 0;

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

  var inits = JP.query(annotations, `$[?(@.task=="init")].value`)
  if(inits.length < 1){
    console.log("no match task, trying key")
    var inits = JP.query(annotations, `$[?(@.key=="init")].value`)
  }


}

console.log("good",good)
console.log("bad",bad)
