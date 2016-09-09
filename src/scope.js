'use strict';
var _ = require('lodash');

function Scope(){
  this.$$watchers = [];
  this.$$lastDirtyWatch = null;
}

function initWatchVal() { }

Scope.prototype.$watch = function(watchFn, listenerFn){
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn || function() {},
    last: initWatchVal
  };
  this.$$watchers.push(watcher);
  this.$$lastDirtyWatch = null;
};

Scope.prototype.$digest = function(){
  var ttl = 10;
  var dirty;
  this.$$lastDirtyWatch = null;

  do {
    dirty = this.$$digestOnce();

    if(dirty && (ttl-- === 0)){
      throw '10 digest iterations reached. Abandoning digest cycle';
    }

  } while(dirty);
};

Scope.prototype.$$digestOnce = function() {
  var self = this;
  var newValue, oldValue, dirty;
  _.forEach(this.$$watchers, function(watcher){
    newValue = watcher.watchFn(self);
    oldValue = watcher.last;
    if(newValue !== oldValue){
      self.$$lastDirtyWatch = watcher;
      watcher.last = newValue;
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
  });
  return dirty;
};

module.exports = Scope;