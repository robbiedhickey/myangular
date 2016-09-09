'use strict';
var _ = require('lodash');

function Scope(){
  this.$$watchers = [];
}

function initWatchVal() { }

Scope.prototype.$watch = function(watchFn, listenerFn){
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn || function() {},
    last: initWatchVal
  };
  this.$$watchers.push(watcher);
};

Scope.prototype.$digest = function(){
  var ttl = 10;
  var dirty;
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
      watcher.last = newValue;
      watcher.listenerFn(
        newValue, 
        // don't leak initWatchValue abstraction 
        oldValue === initWatchVal ? newValue : oldValue, 
        self);
        dirty = true;
    }
  });
  return dirty;
};

module.exports = Scope;