var fs = require('fs');

var records = [];

function addRecord(rec) {
	records.push({
		model: "MUDObject",
		data: {
			id: rec[0],
			name: rec[1],
			description: rec[2],
			location: rec[3],
			MUDObjectContents: rec[4],
			MUDObjectExits: rec[5],
			//next = 6
			key: rec[7],
			failureMessage: rec[8],
			successMessage: rec[9],
			othersFailureMessage: rec[10],
			othersSuccessMessage: rec[11],
			owner: rec[12],
			pennies: rec[13],
			type: getType(parseInt(rec[14])),
			flags: parseInt(rec[14]),
			password: rec[15]
		}
	});
}

function getType(i) {
	if (i&0x0) return 'ROOM';
	if (i&0x1) return 'THING';
	if (i&0x2) return 'EXIT';
	if (i&0x3) return 'PLAYER';
}

//Read the old data format
fs.readFile('/Users/jsh2/Downloads/tinymud-1.4/small.db', {encoding: 'ascii'}, function (err, data) {
  if (err) throw err;
  
  var lines = data.split("\n");
  var rec = [];
  for (var i=0; i<lines.length - 1; i++) {
  	rec.push(lines[i].trim());
  	
  	if (lines[i+1].indexOf('#') === 0) {
		addRecord(rec);
		rec = [];
  	}
  	if (lines[i+1].indexOf('***END OF DUMP***')===0) {
  		addRecord(rec);
  		break;
  	}
  }

  console.log(JSON.stringify(records, null, 4));
});

// //write the new one
// var outputFilename = '/tmp/my.json';

// fs.writeFile(outputFilename, JSON.stringify(myData, null, 4), function(err) {
//     if(err) {
//       console.log(err);
//     } else {
//       console.log("JSON saved to " + outputFilename);
//     }
// }); 