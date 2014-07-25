var fs = require('fs');

function read_csv(filename, headers) {
    var raw_data = fs.readFileSync(filename, 'utf-8').
                    replace(/\r?\n|\r/g, ',').
                    split(',');

    var data = {};
    for (var i=0;i<AGE_GROUPS.length;i++) {
        data[i] = {};
        for (var j=0;j<headers.length;j++) {
            var value = raw_data[j*(AGE_GROUPS.length) + i];
            value = parseInt(value, 10);
            data[i][headers[j]] = value;
        }
    }

    return data;
}

const AGE_GROUPS = ['<22',
                    '22-24', 
                    '25-27', 
                    '28-30', 
                    '31-33', 
                    '34-36', 
                    '37-39',
                    '40-42',
                    '43-45',
                    '46-48',
                    '49-51',
                    '52-54',
                    '55-57',
                    '58-60'];

var slowest = 18*60 + 20;
var fastest = 8*60 + 30;
var run_header = [];
var run_seconds = [];
for (var i=slowest;i>=fastest;i-=10) {
    var min = Math.floor(i/60);
    var sec = i - min * 60;

    min = min < 10 ? "0" + min : min;
    sec = sec < 10 ? "0" + sec : sec;

    run_header.push(min + ":" + sec);
    run_seconds.push(i);
}
var sitpushup_header = [];
for (var i=1;i<=60;i++) {
    sitpushup_header.push(i);
}

var run_data = read_csv('./ippt-run.csv', run_seconds);
var situp_data = read_csv('./ippt-situp.csv', sitpushup_header);
var pushup_data = read_csv('./ippt-pushup.csv', sitpushup_header);

var json_data = {};
json_data.meta = {age_groups: AGE_GROUPS};
json_data.data = {};
json_data.data.run = run_data;
json_data.data.pushup = pushup_data;
json_data.data.situp = situp_data;

console.log(JSON.stringify(json_data));
