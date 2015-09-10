/*!
 * test/cache.js
 */

define(function (require) {


/* -----------------------------------------------------------------------------
 * dependencies
 * ---------------------------------------------------------------------------*/

var assert = require('proclaim');
var sinon = require('sinon');
var Cache = require('cache');


/* -----------------------------------------------------------------------------
 * helpers
 * ---------------------------------------------------------------------------*/

var ttlDate = function (ttl) {
  var d = (Date.now()/60000) + ttl;
  var s = d.toString(10);
  var i = parseInt(s, 10);

  return i * 60000;
};


/* -----------------------------------------------------------------------------
 * test
 * ---------------------------------------------------------------------------*/

describe('cache.js', function () {

  beforeEach(function () {
    localStorage.clear();
  });

  it('Should utilize passed namespace option', function () {
    var cache1 = new Cache({ namespace: 'ns1' });
    var cache2 = new Cache({ namespace: 'ns2' });

    // get & set
    cache1.set('k1', 'v1');
    cache2.set('k2', 'v2');
    assert.equal(localStorage['lscache-ns1-k1'], 'v1');
    assert.equal(localStorage['lscache-ns2-k2'], 'v2');
    assert.equal(cache1.get('k1'), 'v1');
    assert.equal(cache2.get('k2'), 'v2');

    // remove
    cache1.remove('k1');
    cache2.remove('k2');
    assert.isUndefined(localStorage['lscache-ns1-k1']);
    assert.isUndefined(localStorage['lscache-ns2-k2']);

    // flush
    cache1.set('k1', 'v1');
    cache1.flush();
    assert.isUndefined(localStorage['lscache-ns1-k1']);
  });

  it('Should utilize passed bucket option', function () {
    var cache1 = new Cache({ bucket: 'b1' });
    var cache2 = new Cache({ bucket: 'b2' });

    // get & set
    cache1.set('k1', 'v1');
    cache2.set('k2', 'v2');
    assert.equal(localStorage['lscache-b1-k1'], 'v1');
    assert.equal(localStorage['lscache-b2-k2'], 'v2');
    assert.equal(cache1.get('k1'), 'v1');
    assert.equal(cache2.get('k2'), 'v2');

    // remove
    cache1.remove('k1');
    cache2.remove('k2');
    assert.isUndefined(localStorage['lscache-b1-k1']);
    assert.isUndefined(localStorage['lscache-b2-k2']);

    // flush
    cache1.set('k1', 'v1');
    cache1.flush();
    assert.isUndefined(localStorage['lscache-b1-k1']);
  });


  it('Should utilize passed ttl option', function () {
    var ttl = 10080;
    var cache1 = new Cache({ ttl: ttl });
    var date1, date2;

    date1 = ttlDate(ttl);
    cache1.set('k1', 'v1');
    date2 = ttlDate(ttl);

    var expires = localStorage['lscache-k1-cacheexpiration'] * 60000;
    assert.greaterThanOrEqual(expires, date1);
    assert.lessThanOrEqual(expires, date2);
  });

  it('Should allow overriding ttl option with ttl param', function () {
    var ttl1 = 10080;
    var ttl2 = 1440;
    var cache1 = new Cache({ ttl: ttl1 });
    var date1, date2;

    date1 = ttlDate(ttl2);
    cache1.set('k1', 'v1', ttl2);
    date2 = ttlDate(ttl2);

    var expires = localStorage['lscache-k1-cacheexpiration'] * 60000;
    assert.greaterThanOrEqual(expires, date1);
    assert.lessThanOrEqual(expires, date2);
  });

});


});