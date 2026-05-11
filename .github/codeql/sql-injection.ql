/**
 * @name SQL injection risk in TypeScript/JavaScript
 * @description Detects raw SQL string concatenation or interpolation
 *              that may be vulnerable to SQL injection.
 * @kind problem
 * @problem.severity error
 * @security-severity 8.5
 * @precision high
 * @id gtcx/sql-injection
 * @tags security sql injection
 */

import javascript

from
  CallExpr queryCall,
  VarRef dbRef
where
  queryCall.getCalleeName() = "query" and
  queryCall.getArgument(0) instanceof AddExpr and
  (
    dbRef.getName() = "db" or
    dbRef.getName() = "pool" or
    dbRef.getName() = "client" or
    dbRef.getName() = "prisma"
  ) and
  queryCall.getCallee().(DotExpr).getBase() = dbRef
select queryCall,
  "Potential SQL injection: raw SQL concatenation detected. Use parameterized queries (e.g., $1, ?) or an ORM."
