# Design System Template - [PROJECT_NAME]

## Document Information
- **Project**: [PROJECT_NAME]
- **Version**: [VERSION]
- **Date**: [DATE]
- **Design Lead**: [DESIGN_LEAD_NAME]
- **Frontend Lead**: [FRONTEND_LEAD_NAME]
- **Reviewers**: [REVIEWER_LIST]
- **Classification**: [INTERNAL/CONFIDENTIAL/PUBLIC]


## How to Use This Template

### Customization Instructions:
1. **Replace all `[PLACEHOLDER]` text** with your project-specific information
2. **Remove sections** that don't apply to your project
3. **Add sections** specific to your project needs
4. **Maintain the structure** for consistency across GTCX projects

### Required Elements:
- **Design Principles** - Always include
- **Component Library** - Always include
- **Typography System** - Always include
- **Color Palette** - Always include


## Design System Overview

### Purpose & Vision
[Describe the purpose of this design system and how it supports the project's goals in 2-3 paragraphs]

### Design Principles
- **Consistency**: [How consistency is maintained across the system]
- **Accessibility**: [Accessibility standards and requirements]
- **Scalability**: [How the system scales with project growth]
- **Performance**: [Performance considerations in design decisions]
- **User-Centered**: [How user needs drive design decisions]

### Brand Alignment
- **Brand Values**: [List core brand values]
- **Visual Identity**: [How the design system reflects brand identity]
- **Tone of Voice**: [Communication style and messaging approach]


## Visual Foundation

### Color Palette

#### Primary Colors
```css
/* Primary Brand Colors */
--primary-100: [HEX_CODE]; /* Lightest */
--primary-200: [HEX_CODE]; /* Light */
--primary-300: [HEX_CODE]; /* Base */
--primary-400: [HEX_CODE]; /* Dark */
--primary-500: [HEX_CODE]; /* Darkest */
```

#### Secondary Colors
```css
/* Secondary Brand Colors */
--secondary-100: [HEX_CODE]; /* Lightest */
--secondary-200: [HEX_CODE]; /* Light */
--secondary-300: [HEX_CODE]; /* Base */
--secondary-400: [HEX_CODE]; /* Dark */
--secondary-500: [HEX_CODE]; /* Darkest */
```

#### Semantic Colors
```css
/* Success, Warning, Error Colors */
--success-100: [HEX_CODE]; /* Light */
--success-500: [HEX_CODE]; /* Base */
--warning-100: [HEX_CODE]; /* Light */
--warning-500: [HEX_CODE]; /* Base */
--error-100: [HEX_CODE]; /* Light */
--error-500: [HEX_CODE]; /* Base */
```

#### Neutral Colors
```css
/* Grays and Neutrals */
--neutral-50: [HEX_CODE]; /* Lightest */
--neutral-100: [HEX_CODE]; /* Light */
--neutral-200: [HEX_CODE]; /* Lighter */
--neutral-300: [HEX_CODE]; /* Light */
--neutral-400: [HEX_CODE]; /* Medium */
--neutral-500: [HEX_CODE]; /* Base */
--neutral-600: [HEX_CODE]; /* Dark */
--neutral-700: [HEX_CODE]; /* Darker */
--neutral-800: [HEX_CODE]; /* Dark */
--neutral-900: [HEX_CODE]; /* Darkest */
```

### Typography System

#### Font Families
```css
/* Primary Font Stack */
--font-family-primary: [FONT_NAME], [FALLBACK_FONT], sans-serif;
--font-family-secondary: [FONT_NAME], [FALLBACK_FONT], serif;
--font-family-mono: [MONO_FONT], monospace;
```

#### Font Sizes
```css
/* Typography Scale */
--text-xs: [SIZE]rem;   /* [DESCRIPTION] */
--text-sm: [SIZE]rem;   /* [DESCRIPTION] */
--text-base: [SIZE]rem; /* [DESCRIPTION] */
--text-lg: [SIZE]rem;   /* [DESCRIPTION] */
--text-xl: [SIZE]rem;   /* [DESCRIPTION] */
--text-2xl: [SIZE]rem;  /* [DESCRIPTION] */
--text-3xl: [SIZE]rem;  /* [DESCRIPTION] */
--text-4xl: [SIZE]rem;  /* [DESCRIPTION] */
--text-5xl: [SIZE]rem;  /* [DESCRIPTION] */
```

#### Font Weights
```css
/* Font Weight Scale */
--font-weight-light: [WEIGHT];     /* [DESCRIPTION] */
--font-weight-normal: [WEIGHT];    /* [DESCRIPTION] */
--font-weight-medium: [WEIGHT];    /* [DESCRIPTION] */
--font-weight-semibold: [WEIGHT];  /* [DESCRIPTION] */
--font-weight-bold: [WEIGHT];      /* [DESCRIPTION] */
--font-weight-extrabold: [WEIGHT]; /* [DESCRIPTION] */
```

#### Line Heights
```css
/* Line Height Scale */
--leading-none: [VALUE];    /* [DESCRIPTION] */
--leading-tight: [VALUE];   /* [DESCRIPTION] */
--leading-snug: [VALUE];    /* [DESCRIPTION] */
--leading-normal: [VALUE];  /* [DESCRIPTION] */
--leading-relaxed: [VALUE]; /* [DESCRIPTION] */
--leading-loose: [VALUE];   /* [DESCRIPTION] */
```

### Spacing System

#### Spacing Scale
```css
/* Spacing Scale */
--space-0: [SIZE]rem;   /* [DESCRIPTION] */
--space-1: [SIZE]rem;   /* [DESCRIPTION] */
--space-2: [SIZE]rem;   /* [DESCRIPTION] */
--space-3: [SIZE]rem;   /* [DESCRIPTION] */
--space-4: [SIZE]rem;   /* [DESCRIPTION] */
--space-5: [SIZE]rem;   /* [DESCRIPTION] */
--space-6: [SIZE]rem;   /* [DESCRIPTION] */
--space-8: [SIZE]rem;   /* [DESCRIPTION] */
--space-10: [SIZE]rem;  /* [DESCRIPTION] */
--space-12: [SIZE]rem;  /* [DESCRIPTION] */
--space-16: [SIZE]rem;  /* [DESCRIPTION] */
--space-20: [SIZE]rem;  /* [DESCRIPTION] */
--space-24: [SIZE]rem;  /* [DESCRIPTION] */
--space-32: [SIZE]rem;  /* [DESCRIPTION] */
```

#### Layout Spacing
```css
/* Layout Spacing */
--container-padding: [SIZE]rem;
--section-spacing: [SIZE]rem;
--component-spacing: [SIZE]rem;
--element-spacing: [SIZE]rem;
```

### Border Radius System
```css
/* Border Radius Scale */
--radius-none: [SIZE]rem;   /* [DESCRIPTION] */
--radius-sm: [SIZE]rem;     /* [DESCRIPTION] */
--radius-base: [SIZE]rem;   /* [DESCRIPTION] */
--radius-md: [SIZE]rem;     /* [DESCRIPTION] */
--radius-lg: [SIZE]rem;     /* [DESCRIPTION] */
--radius-xl: [SIZE]rem;     /* [DESCRIPTION] */
--radius-2xl: [SIZE]rem;    /* [DESCRIPTION] */
--radius-full: [SIZE]rem;   /* [DESCRIPTION] */
```

### Shadow System
```css
/* Shadow Scale */
--shadow-sm: [SHADOW_VALUE];   /* [DESCRIPTION] */
--shadow-base: [SHADOW_VALUE]; /* [DESCRIPTION] */
--shadow-md: [SHADOW_VALUE];   /* [DESCRIPTION] */
--shadow-lg: [SHADOW_VALUE];   /* [DESCRIPTION] */
--shadow-xl: [SHADOW_VALUE];   /* [DESCRIPTION] */
--shadow-2xl: [SHADOW_VALUE];  /* [DESCRIPTION] */
```


## Component Library

### Atoms (Basic Components)

#### Button Component
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}
```

**Usage Examples:**
```tsx
// Primary button
<Button variant="primary" size="md" onClick={handleClick}>
  Submit
</Button>

// Secondary button
<Button variant="secondary" size="sm" disabled>
  Cancel
</Button>
```

#### Input Component
```typescript
interface InputProps {
  type: 'text' | 'email' | 'password' | 'number' | 'tel';
  size: 'sm' | 'md' | 'lg';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}
```

**Usage Examples:**
```tsx
// Text input
<Input
  type="text"
  size="md"
  placeholder="Enter your name"
  value={name}
  onChange={setName}
  required
/>

// Error state
<Input
  type="email"
  size="md"
  placeholder="Enter your email"
  value={email}
  onChange={setEmail}
  error="Please enter a valid email"
/>
```

### Molecules (Composite Components)

#### Form Field Component
```typescript
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
}
```

**Usage Examples:**
```tsx
<FormField
  label="Email Address"
  required
  error={emailError}
  helpText="We'll never share your email"
>
  <Input
    type="email"
    value={email}
    onChange={setEmail}
    placeholder="Enter your email"
  />
</FormField>
```

#### Card Component
```typescript
interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
}
```

**Usage Examples:**
```tsx
<Card
  title="User Profile"
  subtitle="Personal information"
  variant="elevated"
  padding="lg"
>
  <p>Card content goes here...</p>
</Card>
```

### Organisms (Complex Components)

#### Navigation Component
```typescript
interface NavigationProps {
  items: NavigationItem[];
  activeItem?: string;
  onItemClick: (item: NavigationItem) => void;
  variant?: 'horizontal' | 'vertical' | 'mobile';
}
```

**Usage Examples:**
```tsx
<Navigation
  items={navItems}
  activeItem={currentRoute}
  onItemClick={handleNavClick}
  variant="horizontal"
/>
```

#### Data Table Component
```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  sortable?: boolean;
  pagination?: boolean;
  searchable?: boolean;
  onRowClick?: (row: T) => void;
}
```

**Usage Examples:**
```tsx
<DataTable
  data={users}
  columns={userColumns}
  sortable
  pagination
  searchable
  onRowClick={handleUserClick}
/>
```


## Responsive Design

### Breakpoint System
```css
/* Breakpoint Scale */
--breakpoint-sm: [SIZE]px;   /* Small devices */
--breakpoint-md: [SIZE]px;   /* Medium devices */
--breakpoint-lg: [SIZE]px;   /* Large devices */
--breakpoint-xl: [SIZE]px;   /* Extra large devices */
--breakpoint-2xl: [SIZE]px;  /* 2X large devices */
```

### Responsive Utilities
```css
/* Responsive visibility */
.hidden-sm { /* Hide on small devices */ }
.hidden-md { /* Hide on medium devices */ }
.hidden-lg { /* Hide on large devices */ }

/* Responsive spacing */
.p-sm-4 { /* Padding on small devices */ }
.p-md-6 { /* Padding on medium devices */ }
.p-lg-8 { /* Padding on large devices */ }
```


## Accessibility

### WCAG Compliance
- **Level**: WCAG 2.1 AA
- **Focus Management**: [Describe focus management strategy]
- **Keyboard Navigation**: [Describe keyboard navigation support]
- **Screen Reader Support**: [Describe screen reader compatibility]

### Accessibility Guidelines
- **Color Contrast**: Minimum 4.5:1 ratio for normal text
- **Focus Indicators**: Clear, visible focus indicators
- **Alternative Text**: Descriptive alt text for images
- **Semantic HTML**: Proper use of semantic HTML elements

### Accessibility Testing
- **Automated Testing**: [List automated testing tools]
- **Manual Testing**: [List manual testing procedures]
- **User Testing**: [Describe accessibility user testing]


## Animation & Transitions

### Animation Principles
- **Purpose**: Animations should serve a functional purpose
- **Performance**: 60fps animations for smooth experience
- **Accessibility**: Respect user's motion preferences
- **Consistency**: Use consistent timing and easing

### Transition System
```css
/* Transition Scale */
--transition-fast: [DURATION]ms;   /* [DESCRIPTION] */
--transition-base: [DURATION]ms;   /* [DESCRIPTION] */
--transition-slow: [DURATION]ms;   /* [DESCRIPTION] */

/* Easing Functions */
--ease-linear: [EASING_FUNCTION];
--ease-in: [EASING_FUNCTION];
--ease-out: [EASING_FUNCTION];
--ease-in-out: [EASING_FUNCTION];
```

### Common Animations
- **Fade In/Out**: [Duration and easing]
- **Slide In/Out**: [Duration and easing]
- **Scale In/Out**: [Duration and easing]
- **Hover Effects**: [Duration and easing]


## Implementation Guidelines

### CSS Architecture
- **Methodology**: [BEM/SMACSS/ITCSS/etc.]
- **File Structure**: [Describe CSS file organization]
- **Naming Conventions**: [Describe naming conventions]
- **CSS Variables**: [Describe CSS custom properties usage]

### Component Development
- **Framework**: [React/Vue/Angular/etc.]
- **Styling Solution**: [CSS Modules/Styled Components/Tailwind/etc.]
- **State Management**: [Describe state management approach]
- **Testing Strategy**: [Describe component testing approach]

### Design Tokens
- **Token System**: [Describe design token implementation]
- **Build Process**: [Describe how tokens are built and distributed]
- **Version Control**: [Describe token versioning strategy]


## Documentation & Resources

### Component Documentation
- **Storybook**: [Link to Storybook instance]
- **Component API**: [Link to API documentation]
- **Usage Examples**: [Link to usage examples]
- **Design Guidelines**: [Link to design guidelines]

### Design Resources
- **Figma/Sketch**: [Link to design files]
- **Icon Library**: [Link to icon resources]
- **Illustration Library**: [Link to illustration resources]
- **Photography Guidelines**: [Link to photography guidelines]


## Template Completion Checklist

- **Project Name**: Replaced all `[PROJECT_NAME]` placeholders
- **Color Palette**: Defined complete color system
- **Typography**: Established font and text system
- **Spacing**: Defined spacing scale and layout system
- **Components**: Created component library with examples
- **Responsive Design**: Defined breakpoint and responsive system
- **Accessibility**: Established accessibility guidelines
- **Animation**: Defined animation and transition system
- **Implementation**: Specified technical implementation approach
- **Documentation**: Created comprehensive documentation structure


## Design System Best Practices

### Design Principles
1. **Start with principles** - Define your design philosophy
2. **Build systematically** - Create a logical component hierarchy
3. **Document everything** - Clear documentation is essential
4. **Test with users** - Validate design decisions with real users
5. **Iterate continuously** - Design systems evolve over time

### Common Mistakes to Avoid
- [Missing] **Inconsistent naming** - Use consistent naming conventions
- [Missing] **Missing accessibility** - Always consider accessibility first
- [Missing] **Over-complexity** - Keep components simple and focused
- [Missing] **Poor documentation** - Document everything clearly
- [Missing] **Ignoring performance** - Consider performance implications


*This template ensures consistent, professional design system documentation across all GTCX projects. Customize it for your specific needs while maintaining the established structure and quality standards.*
