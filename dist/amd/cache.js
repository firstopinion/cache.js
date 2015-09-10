/*!
 * cache.js
 */


define(function (require) {


/* -----------------------------------------------------------------------------
 * dependencies
 * ---------------------------------------------------------------------------*/

var lscache = require('lscache');


/* -----------------------------------------------------------------------------
 * Cache
 *
 * Base cache class that allows specifying global bucket and ttl.
 * ---------------------------------------------------------------------------*/

var Cache = function (options) {
  options = options || {};

  this.namespace = options.namespace;
  this.bucket = options.bucket;
  this.ttl = options.ttl;
};

Cache.prototype.bucketId = function () {
  var id = '';

  if (this.namespace) { id += this.namespace + '-'; }
  if (this.bucket) { id += this.bucket + '-'; }

  return id;
};

Cache.prototype.get = function () {
  lscache.setBucket(this.bucketId());
  return lscache.get.apply(lscache, arguments);
};

Cache.prototype.set = function (key, val, ttl) {
  lscache.setBucket(this.bucketId());
  return lscache.set.call(lscache, key, val, ttl || this.ttl);
};

Cache.prototype.remove = function () {
  lscache.setBucket(this.bucketId());
  return lscache.remove.apply(lscache, arguments);
};

Cache.prototype.flush = function () {
  lscache.setBucket(this.bucketId());
  return lscache.flush.apply(lscache, arguments);
};

Cache.prototype.flushExpired = function () {
  lscache.setBucket(this.bucketId());
  return lscache.flushExpired.apply(lscache, arguments);
};


/* -----------------------------------------------------------------------------
 * expose
 * ---------------------------------------------------------------------------*/

return Cache;


});