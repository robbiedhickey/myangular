'use strict';
var _ = require('lodash');

function Scope() {
  this.$$watchers = [];
  this.$$lastDirtyWatch = null;
}

function initWatchVal() { }

Scope.prototype.$watch = function (watchFn, listenerFn, valueEq) {
  var self = this;
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn || function () { },
    valueEq: !!valueEq,
    last: initWatchVal
  };
  this.$$watchers.unshift(watcher);
  this.$$lastDirtyWatch = null;

  return function(){
    var index = self.$$watchers.indexOf(watcher);
    if(index >= 0){
      self.$$watchers.splice(index, 1);
      // modifying the underlying array may cause the digest cycle to skip a watcher
      // disable our lastDirtyWatch optimization in this case.
      self.$$lastDirtyWatch = null;
    }
  };
};

Scope.prototype.$digest = function () {
  var ttl = 10;
  var dirty;
  this.$$lastDirtyWatch = null;

  do {
    dirty = this.$$digestOnce();

    if (dirty && (ttl-- === 0)) {
      throw '10 digest iterations reached. Abandoning digest cycle';
    }

  } while (dirty);
};

Scope.prototype.$$digestOnce = function () {
  var self = this;
  var newValue, oldValue, dirty;
  _.forEachRight(this.$$watchers, function (watcher) {
    try {
      if(watcher){
        newValue = watcher.watchFn(self);
        oldValue = watcher.last;
        if (!self.$$areEqual(newValue, oldValue, watcher.valueEq)) {
          self.$$lastDirtyWatch = watcher;
          // make deep copy if value equality enabled
          watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
          watcher.listenerFn(
            newValue,
            // don't leak initWatchValue abstraction 
            oldValue === initWatchVal ? newValue : oldValue,
            self);
          dirty = true;
        } else if (self.$$lastDirtyWatch === watcher) {
          dirty = false;
          return false;
        }
      }
    } catch(e) {
      console.error(e);
    }
  });
  return dirty;
};

Scope.prototype.$$areEqual = function (newValue, oldValue, valueEq) {
  if (valueEq) {
    return _.isEqual(newValue, oldValue);
  }

  // NaN is never equal to itself, force equality to end digest
  if (typeof newValue === 'number' &&
    typeof oldValue === 'number' &&
    isNaN(newValue) && isNaN(oldValue)) {
    return true;
  }

  return newValue === oldValue;
};

Scope.prototype.$eval = function(expr, locals) {
  return expr(this, locals);
};

Scope.prototype.$apply = function(expr) {
  try{
    return this.$eval(expr);
  } finally {
    this.$digest();
  }
};

module.exports = Scope;