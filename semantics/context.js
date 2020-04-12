/*
 * Semantic Analysis Context
 *
 * A context object holds state for the semantic analysis phase.
 *
 *   const Context = require('./semantics/context');
 */

// const { TypeDec } = require("../ast");

const FunctionObject = require('../ast/function-object');

const {
  standardFunctions,
  IntType,
  LongType,
  StringType,
  BoolType,
  NoneType,
} = require('./builtins');

require('./analyzer');

// When doing semantic analysis we pass around context objects.
//
// A context object holds:
//
//   1. A reference to the parent context (or null if this is the root context).
//      This allows to search for declarations from the current context outward.
//
//   2. A reference to the current function we are analyzing, if any. If we are
//      inside a function, then return expressions are legal, and we will be
//      able to type check them.
//
//   3. Whether we are in a loop (to know that a `break` is okay).
//
//   4. A map for looking up all identifiers declared in this context.

class Context {
  constructor({ parent = null, currentFunction = null, inLoop = false } = {}) {
    Object.assign(this, {
      parent,
      currentFunction,
      inLoop,
      variableDeclarations: new Map(),
      classDeclarations: new Map(),
    });
  }

  createChildContextForFunctionBody(currentFunction) {
    // When entering a new function, we're not in a loop anymore
    return new Context({ parent: this, currentFunction, inLoop: false });
  }

  createChildContextForLoop() {
    // When entering a loop body, just set the inLoop field, retain others
    return new Context({
      parent: this,
      currentFunction: this.currentFunction,
      inLoop: true,
    });
  }

  createChildContextForBlock() {
    // For a block, we have to retain both the function and loop settings.
    return new Context({
      parent: this,
      currentFunction: this.currentFunction,
      inLoop: this.inLoop,
    });
  }

  addVar(id, entity) {
    if (this.variableDeclarations.has(id)) {
      throw new Error(`Identifier already declared in this scope`);
    }
    this.variableDeclarations.set(id, entity);
  }

  addClass(id, entity) {
    if (this.classDeclarations.has(id)) {
      throw new Error(`Class identifier already declared in this scope`);
    }
    this.classDeclarations.set(id, entity);
  }

  // Returns the entity bound to the given identifier, starting from this
  // context and searching "outward" through enclosing contexts if necessary.
  lookupVar(id) {
    for (let context = this; context !== null; context = context.parent) {
      if (context.variableDeclarations.has(id)) {
        return context.variableDeclarations.get(id);
      }
    }
    throw new Error(`Identifier ${id} has not been declared`);
  }

  lookupClass(id) {
    for (let context = this; context !== null; context = context.parent) {
      if (context.classDeclarations.has(id)) {
        return context.classDeclarations.get(id);
      }
    }
    throw new Error(`Identifier ${id} has not been declared`);
  }

  assertIsFunction(entity) {
    if (entity.constructor !== FunctionObject) {
      throw new Error(`Call is not a function`);
    }
  }
}

Context.INITIAL = new Context();
standardFunctions.forEach(f => {
  Context.INITIAL.variableDeclarations[f.id] = f;
});
[IntType, LongType, StringType, BoolType, NoneType].forEach(type => {
  Context.INITIAL.classDeclarations.set(type.name, type);
});

module.exports = Context;
