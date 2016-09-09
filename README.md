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
* $evalAsync - allows scheduling of a function to run later in the same digest. Preferable to $timeout because $timeout is beholden to browser event loop scheduling. $evalAsync ensures that it will run in the digest and prevent unnecessary re-rendering.