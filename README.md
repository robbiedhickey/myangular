# Summary

Outline the features covered in each chapter

## Chapter 1 - Scopes and Dirty-checking

* The two-sided process underlying Angular’s dirty-checking: $watch and $digest.
* The dirty-checking loop and the TTL mechanism for short-circuiting it.
* The difference between reference-based and value-based comparison.
* Exception handling in the Angular digest.
* Destroying watches so they won’t get executed again.

## Chapter 2 - Scope Methods

* $eval - $eval doesn't have much purpose yet. Later it will allow passing of string expressions, and be responsible for compiling and executing them. It also has the added benefit of being explicit that code is dealing with the scope.
* $apply - standard way for integrating external code into angular lifecycle. Simple executes a method (which gets access to scope object) and triggers a digest.
* $evalAsync - allows scheduling of a function to run later in the same digest. Preferable to $timeout because $timeout is beholden to browser event loop scheduling. $evalAsync ensures that it will run in the digest and prevent unnecessary re-rendering. $evalAsync should also schedule a digest if none is running.
* Scope Phases - lets angular internals query when a digest is running. '$digest' and '$apply' are two of them, otherwise it will be null.
* $applyAsync - coalesce many $apply invocations. Rather than happen immediately, they are scheduled to run soon. This also guards you against calling $apply while another digest is running, which will throw an exception. applyAsync in that sense is a safer operation and has the same desired effect. Note that it always defers the invocation. Main goal is optimization, to execute invocations that are scheduled in quick succession in one digest.
* $$postDigest - schedules a function to run after the next digest completes. Unlike apply, does not schedule a digest.
* $watchGroup - takes several watch functions and fires listener when any of them change. It should also defer the listener call to a moment when all watches have been checked so we don't run them multiple times.

## Chapter 3 - Scope Inheritance

Relies heavily on Javascript prototypal inheritance with a few added bells and whistles. We will go over both regular and isolated forms of scope. 

* Root Scope - this is effectively what we have been working with to date. A root scope has no parent. 
* $new - used to make child scopes. A child scope by default shares the properties of its parent's scope. 'inheritance' describe block has a good set of tests describing the behavior we should expect from a child scope. 
* attribute shadowing - A consequence of prototypal inheritance is that attributes on the child can 'hide' attributes on the parent. This is referred to as attribute shadowing. This can be confusing when a child wants to modify a parent's member. The workaround for this is, on the parent, to wrap the attribute in an object. Then the child can set the property on the parent.
* Separated watches - with current implementation, all watchers are stored on root scope. This means, any time we want to trigger a digest we have to trigger all watchers in the scope hierarchy. 
* Recursive Digest - we don't want watches to run **up** the hierarchy but we do want them to run **down** the hierarchy. Therefor, scopes need to know what children they have. We will implement this using a $$children array, while angular implements this as a linked list ($$nextSibling, $$prevSibling, etc) for performance reasons. 
* $apply and $evalAsync should trigger digests from root. 
* Isolated Scopes - we create it from a parent, but do not set the parent to its prototype, thus disabling prototypal inheritance. This is handled by passing true to the $new call. 
* Substitue parent scope - scopes also allow the ability to provide some other scope to be the parent of the new scope, while still maintaining the normal inheritance chain. 
* Destroying scope - means that all of its watchers are removed and that the scope itself is remove from the $$children of its parent.

## Chapter 4 - Watch Collections

* Provide an efficent way to watch for groups of changes in objects and arrays. Has the array changed? Have items been added/removed/reordered. We are doing this with value based equality checking but it has to deep watch the entire graph. $watchCollection will be an optimized version of the value-based $watch we already have. We will now effectively have watches that specialize in certain types of data structures.
* Think of the watchCollection as having two top level conditional branches, for objects and arrays. Non-collection watches should just defer to $watch implementation.
