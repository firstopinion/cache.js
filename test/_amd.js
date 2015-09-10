/*!
 * test/_amd.js
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

describe('amd - cache.js', function () {

  it('Should create a new instance.', function () {
    var cache = new Cache();
    assert.isInstanceOf(cache, Cache);
  });

});


});