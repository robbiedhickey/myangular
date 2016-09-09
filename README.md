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
* $watchGroup - takes several watch functions and fires listener when any of them change.