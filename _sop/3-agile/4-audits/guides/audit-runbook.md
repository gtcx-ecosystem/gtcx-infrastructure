# Guide: Audit Runbook

How to run an audit end-to-end with consistent quality and traceability.

## Scope

Use this runbook for:

- Code quality audits
- Security audits
- Hallucination audits
- Accessibility or usability audits

## Inputs

- The target repo and revision (commit hash or branch)
- Audit type (code quality, security, hallucination, accessibility, usability)
- Timebox and depth (quick scan vs full audit)

## Steps

1. **Define the audit scope**
   - What is in-scope and out-of-scope
   - What time window or release is covered
   - What “pass” or “fail” means

2. **Select the template**
   - Use the matching template in `../templates/`
   - Do not modify the template structure during the audit

3. **Gather evidence**
   - Collect logs, screenshots, file paths, and test output
   - Record file paths and line references where applicable

4. **Execute the review**
   - Work section-by-section in the template
   - Verify claims against primary sources or code
   - Document any gaps or uncertainties

5. **Assign severity**
   - Use the severity rubric in the template
   - Be explicit about impact and likelihood

6. **Summarize findings**
   - Provide an executive summary
   - List top risks and required actions

7. **Publish and notify**
   - Save the report under `../reports/`
   - Notify the owner and stakeholders

## Quality Bar

- Findings are concrete and reproducible
- Evidence is referenced with paths or links
- No vague language (“looks wrong” → explain why)
- Clear next steps and owners

## Reference

- [Audit Templates](../templates/README.md)
- [Documentation Hygiene Template](../../8-hygiene/templates/documentation-hygiene.md)

## Metadata

- **Owner**: Audit Lead
- **Effective Date**: 2026-03-01
- **Last Reviewed**: 2026-03-01
- **Next Review**: 2026-09-01
