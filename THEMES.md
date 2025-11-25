# Open Pages Theme System

A consistent theming system for Open Pages using CSS custom properties (variables).

## Theme Structure

All themes follow the same CSS variable structure to ensure consistency and maintainability.

### Required CSS Variables

Every theme MUST define these variables:

```css
:root {
    /* Colors */
    --color-primary: #hexcode;           /* Main accent color */
    --color-primary-light: rgba(...);   /* Lighter version for backgrounds */
    --color-secondary: #hexcode;         /* Secondary accent color */
    --color-bg: #hexcode;               /* Main background color */
    --color-bg-card: rgba(...);        /* Card background with transparency */
    --color-text-light: #hexcode;      /* Primary text color */
    --color-text-muted: #hexcode;      /* Secondary/muted text color */
    --color-border: rgba(...);         /* Border color with transparency */
    --color-shadow: rgba(...);         /* Shadow color */

    /* Status Colors */
    --color-status-working-bg: rgba(...);   /* Working status background */
    --color-status-working-text: #hexcode;  /* Working status text */
    --color-status-idea-bg: rgba(...);      /* Idea status background */
    --color-status-idea-text: #hexcode;     /* Idea status text */
    --color-status-completed-bg: rgba(...); /* Completed status background */
    --color-status-completed-text: #hexcode; /* Completed status text */

    /* Gradients */
    --gradient-primary: linear-gradient(...); /* Main gradient */
    --gradient-bg: radial-gradient(...);      /* Background gradient */
}
```

## Available Themes

### Default Theme
- **Colors**: Blue/cyan with dark background
- **Feel**: Modern, professional
- **File**: `src/css/theme-default.css`

### Maple Theme  
- **Colors**: Warm oranges and browns
- **Feel**: Autumn, cozy
- **File**: `src/css/theme-maple.css`

### Moka Theme
- **Colors**: Coffee-inspired browns and golds
- **Feel**: Rich, warm, sophisticated
- **File**: `src/css/theme-moka.css`

## Theme Development Guidelines

### 1. Naming Convention
- File: `theme-{name}.css`
- Variables: Use the exact names listed above
- Comment: Include theme name and description

### 2. Color Palette
- Choose a primary and secondary color
- Ensure sufficient contrast for accessibility
- Use alpha transparency for overlays and subtle effects

### 3. Status Colors
- Working: Usually yellow/orange (in progress)
- Idea: Usually green (new/brainstorming) 
- Completed: Usually blue/cyan (finished)

### 4. Testing
- Test with multiple papers
- Verify all status badges work
- Check both light and dark content
- Test theme switching functionality

## Creating a New Theme

1. **Copy template**:
   ```bash
   cp src/css/theme-default.css src/css/theme-newname.css
   ```

2. **Update header comment**:
   ```css
   /**
    * NewName Theme for Open Pages
    * A description of the theme's aesthetic
    */
   ```

3. **Define color palette**:
   - Choose primary/secondary colors
   - Set background colors (usually dark)
   - Define text colors with good contrast
   - Create status color variants

4. **Add to theme selector**:
   Update `build-wasm.sh` to include the new theme:
   ```html
   <option value="newname">NewName</option>
   ```
   
   And add the case in JavaScript:
   ```javascript
   case "newname":
       newHref = "dist/css/theme-newname.css";
       break;
   ```

5. **Test thoroughly**:
   ```bash
   ./build-wasm.sh
   ./test-wasm.sh
   ```

## Theme Enhancements

Themes can include additional CSS beyond the required variables for unique effects:

### Moka Theme Examples
- Background texture with `::before` pseudo-elements
- Enhanced shadows and blur effects  
- Animated hover effects on buttons
- Custom close button styling

### Best Practices
- Keep enhancements subtle and purposeful
- Ensure they don't break on different screen sizes
- Test performance impact of animations/effects
- Maintain accessibility standards

## Accessibility Guidelines

- **Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Color**: Don't rely solely on color to convey information
- **Focus**: Ensure focus indicators are visible in all themes
- **Motion**: Respect `prefers-reduced-motion` for animations

## Browser Support

All themes should work in:
- Chrome/Edge 60+
- Firefox 60+
- Safari 12+
- Mobile browsers

CSS custom properties are widely supported. Avoid newer CSS features that might not work in older browsers.

## Maintenance

### Regular Tasks
- Test themes with new papers/content
- Update colors if design system changes
- Verify accessibility compliance
- Check for broken selectors after CSS updates

### When Adding UI Elements
1. Update base CSS with new selectors
2. Test all existing themes
3. Add theme-specific enhancements if needed
4. Update this documentation

## File Structure

```
src/css/
├── style.css              # Base styles (layout, typography, etc.)
├── theme-default.css      # Default blue theme
├── theme-maple.css        # Warm autumn theme  
└── theme-moka.css         # Coffee-inspired theme
```

The base `style.css` handles all layout and uses the CSS variables defined in theme files. Theme files should ONLY define variables and optional enhancements.