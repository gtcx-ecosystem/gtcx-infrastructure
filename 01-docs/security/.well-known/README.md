---
title: 'Security Well-Known Resources'
status: 'current'
date: '2026-05-25'
owner: 'security-lead'
role: 'security-lead'
tier: 'critical'
tags: ['security', 'well-known', 'security.txt', 'compliance']
review_cycle: 'annual'
---

# Security Well-Known Resources

This directory contains security resources published under the `/.well-known/` path.

## Files

| File                             | Path                                          | Purpose                                                                                         |
| -------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [`security.txt`](./security.txt) | `https://gtcx.trade/.well-known/security.txt` | Security contact and policy references per [securitytxt.org](https://securitytxt.org) RFC draft |

## Deployment

`security.txt` should be served at `https://gtcx.trade/.well-known/security.txt` with `Content-Type: text/plain; charset=utf-8`.
