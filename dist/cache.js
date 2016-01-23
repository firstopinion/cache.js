(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], function () {
      return (root.returnExportsGlobal = factory());
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    root['Cache'] = factory();
  }
}(this, function () {

/**
 * lscache library
 * Copyright (c) 2011, Pamela Fox
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* jshint undef:true, browser:true, node:true */
/* global define */
var cache, _lscache_;
(function (root, factory) {
  if (true) {
    // AMD. Register as an anonymous module.
    _lscache_ = function () {
      return typeof factory === 'function' ? factory() : factory;
    }();
  } else if (typeof module !== 'undefined' && module.exports) {
    // CommonJS/Node module
    module.exports = factory();
  } else {
    // Browser globals
    root.lscache = factory();
  }
}(this, function () {
  // scope
  var cachedStorage;
  var cachedJSON;
  var cacheBucket = '';
  var warnings = false;
  var lscache = {
    // Prefix for all lscache keys
    PREFIX: 'lscache-',
    // Suffix for the key name on the expiration items in localStorage
    SUFFIX: '-cacheexpiration',
    // expiration date radix (set to Base-36 for most space savings)
    EXPIRY_RADIX: 10,
    // time resolution in minutes
    EXPIRY_UNITS: 60 * 1000,
    // Determines if localStorage is supported in the browser;
    // result is cached for better performance instead of being run each time.
    // Feature detection is based on how Modernizr does it;
    // it's not straightforward due to FF4 issues.
    // It's not run at parse-time as it takes 200ms in Android.
    _supportsStorage: function () {
      var key = '__lscachetest__';
      var value = key;
      if (cachedStorage !== undefined) {
        return cachedStorage;
      }
      try {
        lscache._setItem(key, value);
        lscache._removeItem(key);
        cachedStorage = true;
      } catch (e) {
        if (lscache._isOutOfSpace(e)) {
          // If we hit the limit, then it means we have support, 
          cachedStorage = true;  // just maxed it out and even the set test failed.
        } else {
          cachedStorage = false;
        }
      }
      return cachedStorage;
    },
    // Check to set if the error is us dealing with being out of space
    _isOutOfSpace: function (e) {
      if (e && e.name === 'QUOTA_EXCEEDED_ERR' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.name === 'QuotaExceededError') {
        return true;
      }
      return false;
    },
    // Determines if native JSON (de-)serialization is supported in the browser.
    _supportsJSON: function () {
      /*jshint eqnull:true */
      if (cachedJSON === undefined) {
        cachedJSON = window.JSON != null;
      }
      return cachedJSON;
    },
    /**
     * Returns a string where all RegExp special characters are escaped with a \.
     * @param {String} text
     * @return {string}
     */
    _escapeRegExpSpecialCharacters: function (text) {
      return text.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
    },
    /**
     * Returns the full string for the localStorage expiration item.
     * @param {String} key
     * @return {string}
     */
    _expirationKey: function (key) {
      return key + lscache.SUFFIX;
    },
    /**
     * Returns the number of minutes since the epoch.
     * @return {number}
     */
    _currentTime: function () {
      return Math.floor(new Date().getTime() / lscache.EXPIRY_UNITS);
    },
    /**
     * ECMAScript max Date (epoch + 1e8 days)
     */
    _getMaxDate: function () {
      lscache._maxDate = lscache._maxDate || Math.floor(8640000000000000 / lscache.EXPIRY_UNITS);
      return lscache._maxDate;
    },
    /**
     * Wrapper functions for localStorage methods
     */
    _getItem: function (key) {
      return localStorage.getItem(lscache.PREFIX + cacheBucket + key);
    },
    _setItem: function (key, value) {
      // Fix for iPad issue - sometimes throws QUOTA_EXCEEDED_ERR on setItem.
      localStorage.removeItem(lscache.PREFIX + cacheBucket + key);
      localStorage.setItem(lscache.PREFIX + cacheBucket + key, value);
    },
    _removeItem: function (key) {
      localStorage.removeItem(lscache.PREFIX + cacheBucket + key);
    },
    _eachKey: function (fn) {
      var prefixRegExp = new RegExp('^' + lscache.PREFIX + lscache._escapeRegExpSpecialCharacters(cacheBucket) + '(.*)');
      // Loop in reverse as removing items will change indices of tail
      for (var i = localStorage.length - 1; i >= 0; --i) {
        var key = localStorage.key(i);
        key = key && key.match(prefixRegExp);
        key = key && key[1];
        if (key && key.indexOf(lscache.SUFFIX) < 0) {
          fn(key, lscache._expirationKey(key));
        }
      }
    },
    _flushItem: function (key) {
      var exprKey = lscache._expirationKey(key);
      lscache._removeItem(key);
      lscache._removeItem(exprKey);
    },
    _flushExpiredItem: function (key) {
      var exprKey = lscache._expirationKey(key);
      var expr = lscache._getItem(exprKey);
      if (expr) {
        var expirationTime = parseInt(expr, lscache.EXPIRY_RADIX);
        // Check if we should actually kick item out of storage
        if (lscache._currentTime() >= expirationTime) {
          lscache._removeItem(key);
          lscache._removeItem(exprKey);
          return true;
        }
      }
    },
    _warn: function (message, err) {
      if (!warnings)
        return;
      if (!('console' in window) || typeof window.console.warn !== 'function')
        return;
      window.console.warn('lscache - ' + message);
      if (err)
        window.console.warn('lscache - The error was: ' + err.message);
    },
    /**
     * Stores the value in localStorage. Expires after specified number of minutes.
     * @param {string} key
     * @param {Object|string} value
     * @param {number} time
     */
    set: function (key, value, time) {
      if (!lscache._supportsStorage())
        return;
      // If we don't get a string value, try to stringify
      // In future, localStorage may properly support storing non-strings
      // and this can be removed.
      if (typeof value !== 'string') {
        if (!lscache._supportsJSON())
          return;
        try {
          value = JSON.stringify(value);
        } catch (e) {
          // Sometimes we can't stringify due to circular refs
          // in complex objects, so we won't bother storing then.
          return;
        }
      }
      try {
        lscache._setItem(key, value);
      } catch (e) {
        if (lscache._isOutOfSpace(e)) {
          // If we exceeded the quota, then we will sort
          // by the expire time, and then remove the N oldest
          var storedKeys = [];
          var storedKey;
          lscache._eachKey(function (key, exprKey) {
            var expiration = lscache._getItem(exprKey);
            if (expiration) {
              expiration = parseInt(expiration, lscache.EXPIRY_RADIX);
            } else {
              // TODO: Store date added for non-expiring items for smarter removal
              expiration = lscache._getMaxDate();
            }
            storedKeys.push({
              key: key,
              size: (lscache._getItem(key) || '').length,
              expiration: expiration
            });
          });
          // Sorts the keys with oldest expiration time last
          storedKeys.sort(function (a, b) {
            return b.expiration - a.expiration;
          });
          var targetSize = (value || '').length;
          while (storedKeys.length && targetSize > 0) {
            storedKey = storedKeys.pop();
            lscache._warn('Cache is full, removing item with key \'' + key + '\'');
            lscache._flushItem(storedKey.key);
            targetSize -= storedKey.size;
          }
          try {
            lscache._setItem(key, value);
          } catch (e) {
            // value may be larger than total quota
            lscache._warn('Could not add item with key \'' + key + '\', perhaps it\'s too big?', e);
            return;
          }
        } else {
          // If it was some other error, just give up.
          lscache._warn('Could not add item with key \'' + key + '\'', e);
          return;
        }
      }
      // If a time is specified, store expiration info in localStorage
      if (time) {
        lscache._setItem(lscache._expirationKey(key), (lscache._currentTime() + time).toString(lscache.EXPIRY_RADIX));
      } else {
        // In case they previously set a time, remove that info from localStorage.
        lscache._removeItem(lscache._expirationKey(key));
      }
    },
    /**
     * Retrieves specified value from localStorage, if not expired.
     * @param {string} key
     * @return {string|Object}
     */
    get: function (key) {
      if (!lscache._supportsStorage())
        return null;
      // Return the de-serialized item if not expired
      if (lscache._flushExpiredItem(key)) {
        return null;
      }
      // Tries to de-serialize stored value if its an object, and returns the normal value otherwise.
      var value = lscache._getItem(key);
      if (!value || !lscache._supportsJSON()) {
        return value;
      }
      try {
        // We can't tell if its JSON or a string, so we try to parse
        return JSON.parse(value);
      } catch (e) {
        // If we can't parse, it's probably because it isn't an object
        return value;
      }
    },
    /**
     * Removes a value from localStorage.
     * Equivalent to 'delete' in memcache, but that's a keyword in JS.
     * @param {string} key
     */
    remove: function (key) {
      if (!lscache._supportsStorage())
        return;
      lscache._flushItem(key);
    },
    /**
     * Returns whether local storage is supported.
     * Currently exposed for testing purposes.
     * @return {boolean}
     */
    supported: function () {
      return lscache._supportsStorage();
    },
    /**
     * Flushes all lscache items and expiry markers without affecting rest of localStorage
     */
    flush: function () {
      if (!lscache._supportsStorage())
        return;
      lscache._eachKey(function (key) {
        lscache._flushItem(key);
      });
    },
    /**
     * Flushes expired lscache items and expiry markers without affecting rest of localStorage
     */
    flushExpired: function () {
      if (!lscache._supportsStorage())
        return;
      lscache._eachKey(function (key) {
        lscache._flushExpiredItem(key);
      });
    },
    /**
     * Appends lscache.PREFIX so lscache will partition data in to different buckets.
     * @param {string} bucket
     */
    setBucket: function (bucket) {
      cacheBucket = bucket;
    },
    /**
     * Resets the string being appended to lscache.PREFIX so lscache will use the default storage behavior.
     */
    resetBucket: function () {
      cacheBucket = '';
    },
    /**
     * Sets whether to display warnings when an item is removed from the cache or not.
     */
    enableWarnings: function (enabled) {
      warnings = enabled;
    }
  };
  // Return the module
  return lscache;
}));
/*!
 * cache.js
 */
cache = function (require) {
  /* -----------------------------------------------------------------------------
   * dependencies
   * ---------------------------------------------------------------------------*/
  var lscache = _lscache_;
  /* -----------------------------------------------------------------------------
   * Cache
   *
   * Cache class with ttl, namespace, and bucket support (wrapper around lscache).
   * ---------------------------------------------------------------------------*/
  var Cache = function (options) {
    options = options || {};
    this.namespace = options.namespace;
    this.bucket = options.bucket;
    this.ttl = options.ttl;
  };
  Cache.prototype.bucketId = function () {
    var id = '';
    if (this.namespace) {
      id += this.namespace + '-';
    }
    if (this.bucket) {
      id += this.bucket + '-';
    }
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
  Cache.prototype.all = function () {
    var data = {};
    lscache.setBucket(this.bucketId());
    lscache._eachKey(function (key, exprKey) {
      data[key] = lscache._getItem(key);
    });
    return data;
  };
  /* -----------------------------------------------------------------------------
   * expose
   * ---------------------------------------------------------------------------*/
  return Cache;
}({});

return cache;


}));