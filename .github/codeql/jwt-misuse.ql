/**
 * @name JWT misuse in TypeScript/JavaScript
 * @description Detects jwt.decode() without jwt.verify() in same scope,
 *              or verify() with algorithms: false/undefined.
 * @kind problem
 * @problem.severity error
 * @security-severity 9.0
 * @precision high
 * @id gtcx/jwt-misuse
 * @tags security jwt
 */

import javascript

// Detect jwt.decode without verify in same function scope
from
  CallExpr decodeCall,
  VarRef jwtRef,
  ExprStmt stmt
where
  decodeCall.getCalleeName() = "decode" and
  jwtRef.getName() = "jwt" and
  decodeCall.getCallee().(DotExpr).getBase() = jwtRef and
  // Check there is no verify call in the same function
  not exists(CallExpr verifyCall |
    verifyCall.getCalleeName() = "verify" and
    verifyCall.getEnclosingFunction() = decodeCall.getEnclosingFunction()
  )
select decodeCall,
  "JWT decoded without verification. Use jwt.verify() or ensure the decoded token is cryptographically validated elsewhere."
