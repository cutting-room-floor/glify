var test = require('tap').test,
    fs = require('fs'),
    concat = require('concat-stream'),
    glify = require('../');

test('glify', function(t) {
    fs.createReadStream('../example/fill.js')
        .pipe(glify('../example/fill.js'))
        .pipe(concat(function(data) {
            t.equal(data, fs.readFileSync('../example/fill.result.js', 'utf8'));
            t.end();
        }));
});
