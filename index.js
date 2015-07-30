var debug = require('debug')('metalsmith-rewrite');
var path = require('path');
var multi = require('multimatch');
var getPath = require('object-path-get');
var interpolate = require('interpolate');
var moment = require('moment');
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
          var paths = parsePath(file);
          var meta = _.extend({}, files[file], metalsmith.metadata(), { path: paths });
          if (files[file].date) _.extend(meta, { date: pattern.date(files[file].date) });

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
 * Verify that expected keys are found in data 
 *
 * @param {String} string
 * @param {Object} data
 * @return {Boolean}
 */

function parsePath(filename) {
  var parts = {};
  parts.dir = path.dirname(filename);
  parts.ext = path.extname(filename);
  parts.name = path.basename(filename, parts.ext);
  parts.base = parts.name + parts.ext;
  return parts;
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
      pattern: ['**'],
      filename: transformString('./{path.dir}/{path.base}'),
      date: format('YYYY/MM'),
      copy: false 
    };

    if (type === 'string') 
      ext = { filename: transformString(data) };
    else if (type === 'function') 
      ext = { filename: data };
    else {
      if (data.pattern) data.pattern = Array.isArray(data.pattern) ? data.pattern : [data.pattern];
      if (data.date) data.date = format(data.date);
      if (data.filename) data.filename = transformString(data.filename);

      ext = _.extend({}, data);
    }

    return _.extend({}, def, ext);
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
  var st = str.match(/{[\w\.]+}/g)
  var ls = st.filter(function(e) {
    var pth = e.substr(1).substr(0, e.length - 2);
    var p = getPath(data, pth);
    return p !== undefined && p.length > 0 && p !== '';
  });

  return ls.length === st.length;
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

function format(format) {
  return function(date) {
    return moment(date).utc().format(format);
  }
}