# metalsmith-rewrite

Metalsmith plugin that renames a glob of files using string interpolation patterns with file metadata or function.

Metalsmith-rewrite can take the place of move, copy, rename, and permalinks.

## Installation

    $ npm install metalsmith-rewrite --save-dev

## Javascript Usage

Pass with options to `Metalsmith#use`:

```js
var rewrite = require('metalsmith-rewrite');

metalsmith.use(rewrite({
  pattern: 'blog/**/*.html',
  filename: 'blog/{date}/index.html',
  date: 'YYYY/MM'
}));
```

You can also pass an array of patterns to rewrite:

```js
var rewrite = require('metalsmith-rewrite');

metalsmith.use(rewrite([{
  // flatten folder
  pattern: 'portfolio/**/*.html',
  filename: 'portfolio/{type}-{slug}.html',
}, {
  // copy all html files to archive
  copy: true,
  pattern: '**/*.html',
  filename: 'archive/{date}/{path.base}', 
  date: 'YYYY'
}, {
  // permalinks page.html => page/index.html
  pattern: ['**', '!**/index.html'],
  filename: '{path.dir}/{path.name}/index.html',

}]));

```

## Options

There are a couple options available to make rewrite more us


## License

MIT