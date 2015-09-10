/*!
 * test/_umd.js
 */

define(function (require) {


/* -----------------------------------------------------------------------------
 * dependencies
 * ---------------------------------------------------------------------------*/

var assert = require('proclaim');
var Cache = require('cache/cache');


/* -----------------------------------------------------------------------------
 * test
 * ---------------------------------------------------------------------------*/

describe('umd - cache.js', function () {

  it('Should create a new instance.', function () {
    var cache = new Cache();
    assert.isInstanceOf(cache, Cache);
  });

});


});