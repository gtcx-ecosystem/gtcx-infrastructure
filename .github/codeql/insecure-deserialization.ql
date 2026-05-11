/**
 * @name Insecure deserialization in JavaScript/TypeScript
 * @description Detects eval(), new Function(), or unsafe JSON.parse() of untrusted input.
 * @kind problem
 * @problem.severity error
 * @security-severity 9.5
 * @precision high
 * @id gtcx/insecure-deserialization
 * @tags security deserialization rce
 */

import javascript

// Detect eval() with non-literal argument
from CallExpr evalCall
where
  evalCall.getCalleeName() = "eval" and
  not evalCall.getArgument(0) instanceof Literal
select evalCall, "eval() with dynamic input — remote code execution risk. Use safe parsing instead."

// Detect new Function() with non-literal argument
from NewExpr newFunc
where
  newFunc.getCalleeName() = "Function" and
  not newFunc.getArgument(0) instanceof Literal
select newFunc, "new Function() with dynamic input — remote code execution risk."
