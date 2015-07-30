var rewrite = require('../index.js');
var test = require('tape');

var Metalsmith = require('metalsmith');

function plugtest(options, fn) {
  Metalsmith('test/fixtures')
    .source('.')
    .destination('tmp')
    .use(rewrite(options)).build(function(err, files) {
      if(err) return console.log('err: ', err);
      fn(err, files);
    });
}

test('should pass through strings by defaults', function(t) {
  t.plan(1);
  plugtest({ }, function(err, files) {
    t.equal(files['p/b.js'].slug, 'test-b');
  });
})

test('accept an array of options', function(t) {
  t.plan(1);
  plugtest([{ // flattern
    filename: 'abc-{path.base}'
  }, { // flattern
    filename: '123-{path.base}'
  }], function(err, files) {
    t.equal(files['123-abc-a.md'].slug, 'test-a');
  });
})
 
test('interpolate path', function(t) {
  t.plan(1);
  plugtest({
    filename: '{path.base}',
  }, function(err, files) {
    t.equal(files['a.md'].slug, 'test-a');
  });
})

test('interpolate file metadata', function(t) {
  t.plan(2);
  plugtest({
    filename: '{slug}{path.ext}',
  }, function(err, files) {
    t.equal(files['test-a.md'].slug, 'test-a');
    t.equal(files['test-b.js'].slug, 'test-b');
  });
})

test('interpolate date with default format', function(t) {
  t.plan(2);
  plugtest({
    filename: '{date}/{path.base}',
  }, function(err, files) {
    t.equal(files['2015/07/a.md'].slug, 'test-a');
    t.equal(files['c.css'].slug, 'test-c');
  });
})

test('interpolate date with custom format', function(t) {
  t.plan(1);
  plugtest({
    filename: '{date}/index{path.ext}',
    date: 'YYYY/HH'
  }, function(err, files) {
    t.equal(files['2015/12/index.md'].slug, 'test-a');
  });
})

test('only process files with metadata set', function(t) {
  t.plan(2);
  plugtest({
    filename: '{beep}{path.ext}'
  }, function(err, files) {
    t.equal(files['doop.js'].slug, 'test-b');
    t.equal(files['d.html'].slug, 'test-d');
  });
})

test('only process files matched by pattern options', function(t) {
  t.plan(2);
  plugtest({
    pattern: 'p/*.js',
    filename: '{path.base}'
  }, function(err, files) {
    t.equal(files['p/a.md'].slug, 'test-a');
    t.equal(files['b.js'].slug, 'test-b');
  });
})

test('copy files if copy option is set to true', function(t) {
  t.plan(4);
  plugtest({
    copy: true,
    pattern: 'p/**/*',
    filename: '{path.base}'
  }, function(err, files) {
    t.equal(files['a.md'].slug, 'test-a');
    t.equal(files['b.js'].slug, 'test-b');
    t.equal(files['p/a.md'].slug, 'test-a');
    t.equal(files['p/b.js'].slug, 'test-b');
  });
})