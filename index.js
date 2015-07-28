var debug = require('debug')('metalsmith-rewrite');
var path = require('path');
var multi = require('multimatch');
var getPath = require('object-path-get');
var interpolate = require('interpolate');
var _ = require('lodash');


/**
 * Expose `plugin`.
 */

module.exports = plugin;


/**
 * Metalsmith plugin that renames a glob of files using string interpolation
 * patterns and file metadata or function.
 *
 * @param {Object|Array} options
 *   @property {String} pattern
 *   @property {String|Function} filename
 *   @property {Boolean} copy
 *   @property {String} date
 * @return {Function}
 */

function plugin(options) {
  var patterns = normalize(options);

  return function(files, metalsmith, done) {
    patterns.forEach(function(pattern) {
      Object.keys(files).forEach(function(file) {
        var data = files[file];
        var rw = data.rewrite === undefined || data.rewrite === true;
       
        debug('checking file: ' + file);

        if (multi(file, pattern.pattern) && rw) {
          var paths = path.parse(file);
          var meta = extend({}, files[file], metalsmith.metadata(), { path: extend(paths, { }) });
          var name = pattern.filename(meta, file, pattern);
          
          if (file !== name) {
            files[name] = _.cloneDeep(files[file], function(value) {
              if (value instanceof Buffer) {
                return new Buffer(value);
              }
            });
            
            debug('rewriting to: ' + name);

            if (!pattern.copy) delete files[file];
          }
        }
      });
    });

    done();
  };
}


/**
 * Normalizes options arguments
 *
 * @param {Object|Array} options
 *   @property {String} pattern
 *   @property {String|Function} filename
 *   @property {Boolean} copy
 *   @property {String} date
 * @return {Array} patterns
 */

function normalize(patterns) {
  if (Array.isArray(patterns)) {
    return patterns.map(_normalize);
  } else {
    return [_normalize(patterns)];
  }

  function _normalize(data) {
    var ext;
    var type = typeof data;
    var def = {
      date: format('YYYY/MM'),
      pattern: ['**'],
      copy: false 
    };

    if (type === 'string') 
      ext = { filename: transformString(data) };
    else if (type === 'function') 
      ext = { filename: data };
    else 
      ext = extend({}, data, { 
        date: format(data.date), 
        filename: transformString(data.filename),
        pattern: Array.isArray(data.pattern) ? data.pattern : [data.pattern]
      });

    return extend({}, def, ext);
  }
}


/**
 * Verify that expected keys are found in data 
 *
 * @param {String} string
 * @param {Object} data
 * @return {Boolean}
 */

function dataExists(str, data) {
  return str.match(/{[\w\.]+}/g).filter(function(e) {
    var pth = e.substr(1).substr(0, e.length - 2);
    return getPath(data, pth);
  }).length > 0;
}


/**
 * Transforms formatted string into callback function 
 *
 * @param {String} formatted string
 * @return {Function}
 */

function transformString(str) {
  return function(meta, filename, opts) {
    if(multi(filename, opts.pattern).length && dataExists(str, meta)) {
      var pth = interpolate(str, meta);
      return pth.indexOf('./') !== -1 ? pth.substr(2) : pth;
    }

    return filename;
  }
}


/**
 * Return a formatter for a given moment.js format `string`.
 *
 * @param {String} string
 * @return {Function}
 */

function format(string) {
  return string !== undefined ? function(date) {
    return moment(date).utc().format(string);
  } : undefined;
}