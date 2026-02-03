# Project Adaptation Guide

## Purpose
This guide helps you adapt the GTCX Universal Agile Template to any project - new or existing. Follow these steps to ensure consistency, quality, and professional agile practices across all GTCX projects.


## Quick Start Process

### Step 1: Copy the Template Structure
```bash
# For new projects
cp -r /path/to/gtcx-ecosystem-agile/agile/ your-new-project/

# For existing projects  
cp -r /path/to/gtcx-ecosystem-agile/agile/ your-existing-project/
```

### Step 2: Customize Core Documents
1. **Update `README.md`** with your project name and specifics
2. **Fill out `project-specification-template.md`** with your project details
3. **Customize templates** in the `templates/` folder for your needs

### Step 3: Set Up Project Documentation
1. **Choose relevant templates** from `templates/` folder
2. **Copy process templates** from `../templates/` as needed
3. **Create project-specific documents** using the templates


## Template Customization Levels

### Level 1: Basic Customization (Required)
- Replace all `[PROJECT_NAME]` placeholders
- Update document headers with project info
- Fill out project specification template
- Customize README.md

### Level 2: Standard Customization (Recommended)
- Select relevant templates for your project type
- Customize user story templates
- Set up compliance framework
- Configure quality assurance processes

### Level 3: Advanced Customization (Optional)
- Create project-specific templates
- Add custom sections to existing templates
- Integrate with project-specific tools
- Customize workflow processes


## Template Selection Guide

### For Protocol Projects (TradePass, Geotag, GCI)
**Essential Templates:**
- `technical-architecture-template.md`
- `system-architecture-spec-template.md`
- `api-specification-template.md`
- `compliance-framework-template.md`
- `deployment-requirements-template.md`

**Process Templates (from ../templates/):**
- `prd-template.md`
- `qa-test-plan-template.md`
- `uat-test-plan-template.md`

### For Platform Projects (PVP, VaultMark)
**Essential Templates:**
- `technical-architecture-template.md`
- `deployment-requirements-template.md`
- `api-specification-template.md`
- `frontend-strategy-template.md`

**Process Templates (from ../templates/):**
- `prd-template.md`
- `sprint-planning-template.md`
- `retrospective-workflow.md`

### For Mobile Projects
**Essential Templates:**
- `design-system-template.md`
- `user-journey-maps-template.md`
- `screen-inventory-template.md`
- `frontend-prd-template.md`
- `frontend-roadmap-template.md`

**Process Templates (from ../templates/):**
- `user-story-template.md`
- `qa-test-plan-template.md`
- `uat-test-plan-template.md`

### For Community/Marketing Projects
**Essential Templates:**
- `community-hub-page-template.md`
- `developer-quickstart-template.md`
- `roi-calculator-page-template.md`
- `feedback-improvement-template.md`


## Customization Examples

### TradePass Example
```markdown
# Project Specification - TradePass Identity Verification System

## Document Information
- **Project**: TradePass v1.0
- **Version**: 1.0
- **Date**: 2024-01-15
- **Project Manager**: [PM Name]
- **Stakeholders**: Government Partners, Identity Verification Teams
- **Classification**: CONFIDENTIAL

## Executive Summary
TradePass is a government-grade identity verification and trading credentials platform that enables secure, compliant identity verification for global trade participants...
```

### Geotag Example
```markdown
# Project Specification - Geotag Location Trust System

## Document Information
- **Project**: Geotag v1.0
- **Version**: 1.0
- **Date**: 2024-01-15
- **Project Manager**: [PM Name]
- **Stakeholders**: Location Services Teams, Compliance Teams
- **Classification**: INTERNAL

## Executive Summary
Geotag provides location-based trust and compliance verification, enabling secure geographic verification for trade and compliance applications...
```

### GCI Example
```markdown
# Project Specification - Global Compliance Index

## Document Information
- **Project**: GCI v1.0
- **Version**: 1.0
- **Date**: 2024-01-15
- **Project Manager**: [PM Name]
- **Stakeholders**: Compliance Teams, Regulatory Bodies
- **Classification**: CONFIDENTIAL

## Executive Summary
GCI builds on TradePass and Geotag to provide comprehensive compliance indexing and monitoring for global trade participants...
```


## Document Workflow

### Phase 1: Foundation (Week 1)
1. **Copy template structure** to your project
2. **Fill out project specification** template
3. **Select relevant templates** for your project type
4. **Set up basic documentation** structure

### Phase 2: Planning (Week 2)
1. **Create user stories** using templates
2. **Set up compliance framework** if needed
3. **Define technical architecture** using templates
4. **Establish quality processes** using process templates

### Phase 3: Implementation (Ongoing)
1. **Use process templates** for sprints, standups, retros
2. **Update documentation** as project evolves
3. **Maintain quality standards** using QA templates
4. **Track progress** using established metrics


## Success Checklist

### Documentation Setup Complete When:
- All placeholder text replaced with project-specific content
- Project specification template fully completed
- Relevant templates selected and customized
- Process templates configured for team workflow
- Quality assurance processes established
- Compliance requirements documented
- Team trained on template usage
- Documentation review process established

### Ongoing Maintenance:
- Templates updated as project evolves
- New templates added as needed
- Process improvements documented
- Team feedback incorporated
- Documentation kept current with project status


## Common Issues & Solutions

### Issue: Too Many Templates
**Solution**: Start with essential templates only, add others as needed

### Issue: Team Resistance to Documentation
**Solution**: Show value through improved communication and reduced rework

### Issue: Templates Don't Fit Project
**Solution**: Customize templates heavily or create project-specific versions

### Issue: Documentation Gets Outdated
**Solution**: Build documentation updates into sprint processes


## Support & Resources

### Template Support
- **Template Issues**: Check TEMPLATE_CATALOG.md for guidance
- **Customization Help**: Review template "How to Use" sections
- **Process Questions**: Refer to ../templates/ process documentation

### Project-Specific Support
- **TradePass**: Contact TradePass team leads
- **Geotag**: Contact Geotag team leads  
- **GCI**: Contact GCI team leads
- **Platform Projects**: Contact Platform team leads


**Last Updated**: [DATE]  
**Version**: 1.0  
**Maintained By**: GTCX Documentation Team
