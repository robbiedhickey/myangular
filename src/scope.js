'use strict';
var _ = require('lodash');

function Scope() {
  this.$$watchers = [];
  this.$$lastDirtyWatch = null;
  this.$$asyncQueue = [];
  this.$$applyAsyncQueue = [];
  this.$$applyAsyncId = null;
  this.$$postDigestQueue = [];
  this.$$phase = null;
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

  return function () {
    var index = self.$$watchers.indexOf(watcher);
    if (index >= 0) {
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
  this.$beginPhase('$digest');

  if (this.$$applyAsyncId) {
    clearTimeout(this.$$applyAsyncId);
    this.$$flushApplyAsync();
  }

  do {

    // run async tasks in current digest
    while (this.$$asyncQueue.length) {
      try {
        var asyncTask = this.$$asyncQueue.shift();
        asyncTask.scope.$eval(asyncTask.expression);
      } catch (e) {
        console.error(e);
      }
    }

    dirty = this.$$digestOnce();

    if ((dirty || this.$$asyncQueue.length) && (ttl-- === 0)) {
      throw '10 digest iterations reached. Abandoning digest cycle';
    }

  } while (dirty || this.$$asyncQueue.length);
  this.$clearPhase();

  while (this.$$postDigestQueue.length) {
    try {
      this.$$postDigestQueue.shift()();
    } catch (e) {
      console.error(e);
    }
  }
};

Scope.prototype.$$digestOnce = function () {
  var self = this;
  var newValue, oldValue, dirty;
  _.forEachRight(this.$$watchers, function (watcher) {
    try {
      if (watcher) {
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
    } catch (e) {
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

Scope.prototype.$eval = function (expr, locals) {
  return expr(this, locals);
};

Scope.prototype.$evalAsync = function (expr, locals) {
  var self = this;
  if (!self.$$phase && !self.$$asyncQueue.length) {
    setTimeout(function () {
      if (self.$$asyncQueue.length) {
        self.$digest();
      }
    }, 0);
  }
  self.$$asyncQueue.push({ scope: self, expression: expr });
};

Scope.prototype.$apply = function (expr) {
  try {
    this.$beginPhase('$apply');
    return this.$eval(expr);
  } finally {
    this.$clearPhase();
    this.$digest();
  }
};

Scope.prototype.$applyAsync = function (expr) {
  var self = this;
  self.$$applyAsyncQueue.push(function () {
    self.$eval(expr);
  });
  if (self.$$applyAsyncId === null) {
    self.$$applyAsyncId = setTimeout(function () {
      self.$apply(_.bind(self.$$flushApplyAsync, self));
    }, 0);
  }
};

Scope.prototype.$$flushApplyAsync = function () {
  while (this.$$applyAsyncQueue.length) {
    try {
      this.$$applyAsyncQueue.shift()();
    } catch (e) {
      console.error(e);
    }
  }
  this.$$applyAsyncId = null;
};

Scope.prototype.$beginPhase = function (phase) {
  if (this.$$phase) {
    throw this.$$phase + ' already in progress.';
  }
  this.$$phase = phase;
};

Scope.prototype.$clearPhase = function () {
  this.$$phase = null;
};

Scope.prototype.$$postDigest = function (fn) {
  this.$$postDigestQueue.push(fn);
};

Scope.prototype.$watchGroup = function (watchFns, listenerFn) {
  var self = this;
  var newValues = new Array(watchFns.length);
  var oldValues = new Array(watchFns.length);
  var changeReactionScheduled = false;
  var firstRun = true;

  if(watchFns.length === 0){
    self.$evalAsync(function(){
      listenerFn(newValues, newValues, self);
    });
  }

  function watchGroupListener() {
    if(firstRun){
      firstRun = false;
      listenerFn(newValues, newValues, self);
    } else {
      listenerFn(newValues, oldValues, self);
    }
    changeReactionScheduled = false;
  }

  var destroyFunctions = _.map(watchFns, function(watchFn, i){
    return self.$watch(watchFn, function (newValue, oldValue) {
      newValues[i] = newValue;
      oldValues[i] = oldValue;
      if(!changeReactionScheduled){
        changeReactionScheduled = true;
        self.$evalAsync(watchGroupListener);
      }
    });
  });

  return function(){
    _.forEach(destroyFunctions, function(destroyFunction){
      destroyFunction();
    });
  };
};

  module.exports = Scope;