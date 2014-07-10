var test = require('tap').test,
    fs = require('fs'),
    browserify = require('browserify'),
    concat = require('concat-stream'),
    glify = require('../'),
    result = require('../example/fill.result.json');

test('browserified glify', function(t) {
    var b = browserify(require.resolve('../example/fill.js'));
    b.transform(glify);
    b.bundle().pipe(concat(function(data) {
        t.equal(data.toString(), fs.readFileSync('../example/fill.result.js', 'utf8'));
        t.end();
    }));
});

test('nodeified glify', function(t) {
    t.deepEqual(glify('../example/fill.*.glsl'), result);
    t.end();
});
