# Design System — {project-name}

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

## Design Principles

- **Consistency**: {how consistency is maintained across the system}
- **Accessibility**: WCAG 2.1 AA minimum
- **Scalability**: {how the system scales with project growth}
- **Performance**: {performance considerations in design decisions}
- **User-centered**: {how user needs drive design decisions}

## Brand Alignment

- **Brand values**: {list core brand values}
- **Visual identity**: {how the design system reflects the brand}
- **Tone of voice**: {communication style and messaging approach}

---

## Visual Foundation

### Color Palette

#### Primary

```css
--primary-100: {hex}; /* lightest */
--primary-300: {hex}; /* base */
--primary-500: {hex}; /* darkest */
```

#### Secondary

```css
--secondary-100: {hex}; /* lightest */
--secondary-300: {hex}; /* base */
--secondary-500: {hex}; /* darkest */
```

#### Semantic

```css
--success-100: {hex};
--success-500: {hex};
--warning-100: {hex};
--warning-500: {hex};
--error-100: {hex};
--error-500: {hex};
```

#### Neutrals

```css
--neutral-50:  {hex};
--neutral-100: {hex};
--neutral-200: {hex};
--neutral-300: {hex};
--neutral-400: {hex};
--neutral-500: {hex};
--neutral-600: {hex};
--neutral-700: {hex};
--neutral-800: {hex};
--neutral-900: {hex};
```

---

### Typography

```css
--font-family-primary:   {font}, sans-serif;
--font-family-secondary: {font}, serif;
--font-family-mono:      {font}, monospace;

--text-xs:   {size}rem;
--text-sm:   {size}rem;
--text-base: {size}rem;
--text-lg:   {size}rem;
--text-xl:   {size}rem;
--text-2xl:  {size}rem;
--text-3xl:  {size}rem;

--font-weight-light:    {weight};
--font-weight-normal:   {weight};
--font-weight-medium:   {weight};
--font-weight-semibold: {weight};
--font-weight-bold:     {weight};

--leading-tight:   {value};
--leading-normal:  {value};
--leading-relaxed: {value};
```

---

### Spacing

```css
--space-1:  {size}rem;
--space-2:  {size}rem;
--space-3:  {size}rem;
--space-4:  {size}rem;
--space-6:  {size}rem;
--space-8:  {size}rem;
--space-12: {size}rem;
--space-16: {size}rem;
--space-24: {size}rem;

--container-padding:  {size}rem;
--section-spacing:    {size}rem;
--component-spacing:  {size}rem;
```

---

### Border Radius

```css
--radius-sm:   {size}rem;
--radius-base: {size}rem;
--radius-md:   {size}rem;
--radius-lg:   {size}rem;
--radius-full: 9999px;
```

### Shadows

```css
--shadow-sm:   {value};
--shadow-base: {value};
--shadow-md:   {value};
--shadow-lg:   {value};
```

---

## Component Library

### Atoms

#### Button

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}
```

#### Input

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

### Molecules

#### Form Field

```typescript
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
}
```

#### Card

```typescript
interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
}
```

### Organisms

#### Navigation

```typescript
interface NavigationProps {
  items: NavigationItem[];
  activeItem?: string;
  onItemClick: (item: NavigationItem) => void;
  variant?: 'horizontal' | 'vertical' | 'mobile';
}
```

#### Data Table

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

---

## Responsive Design

### Breakpoints

```css
--breakpoint-sm:  {size}px;
--breakpoint-md:  {size}px;
--breakpoint-lg:  {size}px;
--breakpoint-xl:  {size}px;
--breakpoint-2xl: {size}px;
```

---

## Accessibility

- **Standard**: WCAG 2.1 AA
- **Color contrast**: minimum 4.5:1 for normal text, 3:1 for large text
- **Focus indicators**: visible on all interactive elements
- **Keyboard navigation**: full keyboard support across all components
- **Screen reader**: semantic HTML, ARIA labels where needed
- **Motion**: respect `prefers-reduced-motion`

---

## Animation

```css
--transition-fast:   {duration}ms;
--transition-base:   {duration}ms;
--transition-slow:   {duration}ms;

--ease-linear:  {function};
--ease-in:      {function};
--ease-out:     {function};
--ease-in-out:  {function};
```

---

## Implementation

- **Methodology**: {BEM / SMACSS / utility-first / etc.}
- **Framework**: {React / Vue / etc.}
- **Styling**: {CSS Modules / Tailwind / Styled Components / etc.}
- **Design tokens**: {describe how tokens are built and distributed}
- **Storybook**: {link to Storybook instance}
- **Figma**: {link to design files}

---

## Completion Checklist

- [ ] Color palette defined
- [ ] Typography system defined
- [ ] Spacing scale defined
- [ ] Core components documented with props
- [ ] Breakpoints defined
- [ ] Accessibility guidelines documented
- [ ] Animation system defined
- [ ] Implementation approach specified
- [ ] Storybook / design tool linked
