# Accessibility Guidelines & Implementation

## 1. WCAG 2.1 AA Compliance Framework

### Core Principles (POUR)

**Perceivable**
- Information and UI components must be presentable in ways users can perceive
- Provide text alternatives for non-text content
- Provide captions and alternatives for multimedia
- Ensure sufficient color contrast
- Make sure content can be presented without loss of meaning

**Operable**
- UI components and navigation must be operable by all users
- Make all functionality available via keyboard
- Give users enough time to read and use content
- Don't use content that causes seizures or physical reactions
- Help users navigate and find content

**Understandable**
- Information and operation of UI must be understandable
- Make text readable and understandable
- Make content appear and operate predictably
- Help users avoid and correct mistakes

**Robust**
- Content must be robust enough for interpretation by assistive technologies
- Maximize compatibility with assistive technologies

### Compliance Checklist

#### Level A Requirements ✓
- [ ] Images have alt text
- [ ] Videos have captions
- [ ] Audio has transcripts
- [ ] Content is keyboard accessible
- [ ] No seizure-inducing content
- [ ] Page has proper heading structure
- [ ] Links have descriptive text

#### Level AA Requirements ✓
- [ ] Color contrast ratio ≥ 4.5:1 for normal text
- [ ] Color contrast ratio ≥ 3:1 for large text
- [ ] Text can resize to 200% without horizontal scrolling
- [ ] Content reflows to single column at 320px width
- [ ] Focus indicators are visible
- [ ] Status messages are announced to screen readers
- [ ] Error messages are clear and helpful

## 2. Color & Contrast Standards

### Color Contrast Ratios

```css
/* WCAG AA Compliant Color Combinations */

/* Normal text (14-18px) - Minimum 4.5:1 ratio */
.text-normal-primary {
  color: var(--gray-900);    /* #111827 */
  background: white;         /* Ratio: 16.6:1 ✓ */
}

.text-normal-secondary {
  color: var(--gray-700);    /* #374151 */
  background: white;         /* Ratio: 9.0:1 ✓ */
}

.text-normal-muted {
  color: var(--gray-600);    /* #4b5563 */
  background: white;         /* Ratio: 7.0:1 ✓ */
}

/* Large text (18px+ or 14px+ bold) - Minimum 3:1 ratio */
.text-large-primary {
  color: var(--gray-800);    /* #1f2937 */
  background: white;         /* Ratio: 12.6:1 ✓ */
}

.text-large-accent {
  color: var(--primary-600); /* #2563eb */
  background: white;         /* Ratio: 4.9:1 ✓ */
}

/* Interactive elements */
.button-primary {
  color: white;
  background: var(--primary-500); /* #3b82f6 - Ratio: 4.8:1 ✓ */
}

.button-primary:hover {
  background: var(--primary-600); /* #2563eb - Ratio: 4.9:1 ✓ */
}

.button-secondary {
  color: var(--primary-600);      /* #2563eb */
  background: white;              /* Ratio: 4.9:1 ✓ */
  border: 1px solid var(--primary-500);
}

.link-default {
  color: var(--primary-600);      /* #2563eb */
  /* Ratio: 4.9:1 ✓ */
}

.link-visited {
  color: var(--purple-600);       /* #9333ea */
  /* Ratio: 4.7:1 ✓ */
}

/* Status colors */
.text-success {
  color: var(--success-700);      /* #15803d */
  background: white;              /* Ratio: 4.9:1 ✓ */
}

.text-warning {
  color: var(--orange-700);       /* #c2410c */
  background: white;              /* Ratio: 4.6:1 ✓ */
}

.text-error {
  color: var(--error-700);        /* #b91c1c */
  background: white;              /* Ratio: 5.4:1 ✓ */
}

/* Background combinations */
.card-elevated {
  color: var(--gray-900);
  background: white;
  border: 1px solid var(--gray-200);
}

.section-muted {
  color: var(--gray-900);
  background: var(--gray-50);     /* Ratio: 15.8:1 ✓ */
}

.alert-success {
  color: var(--success-800);      /* #166534 */
  background: var(--success-50);  /* #f0fdf4 - Ratio: 8.9:1 ✓ */
}

.alert-warning {
  color: var(--orange-800);       /* #9a3412 */
  background: var(--orange-50);   /* #fff7ed - Ratio: 7.2:1 ✓ */
}

.alert-error {
  color: var(--error-800);        /* #991b1b */
  background: var(--error-50);    /* #fef2f2 - Ratio: 8.1:1 ✓ */
}
```

### Color Independence

```css
/* Never rely on color alone to convey information */

/* Bad - relies only on color */
.status-bad {
  color: red;
}

/* Good - uses color + icon + text */
.status-good {
  color: var(--error-600);
}

.status-good::before {
  content: "⚠️";
  margin-right: 0.5rem;
}

/* Form validation examples */
.input-error {
  border-color: var(--error-500);
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>');
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
  padding-right: 2.5rem;
}

.input-success {
  border-color: var(--success-500);
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>');
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
  padding-right: 2.5rem;
}

/* Status indicators with multiple cues */
.booking-status {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.booking-status.confirmed {
  color: var(--success-700);
  background: var(--success-100);
  border: 1px solid var(--success-200);
}

.booking-status.confirmed::before {
  content: "✓";
  color: var(--success-600);
}

.booking-status.pending {
  color: var(--warning-700);
  background: var(--warning-100);
  border: 1px solid var(--warning-200);
}

.booking-status.pending::before {
  content: "⏳";
  color: var(--warning-600);
}

.booking-status.cancelled {
  color: var(--error-700);
  background: var(--error-100);
  border: 1px solid var(--error-200);
}

.booking-status.cancelled::before {
  content: "✕";
  color: var(--error-600);
}
```

## 3. Keyboard Navigation & Focus Management

### Focus Indicators

```css
/* Visible focus indicators for all interactive elements */
.focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
  border-radius: 0.25rem;
}

/* Hide focus for mouse users, show for keyboard users */
.interactive-element:focus {
  outline: none;
}

.interactive-element:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .interactive-element:focus-visible {
    outline: 3px solid;
    outline-color: Highlight;
  }
}

/* Focus within containers */
.card:focus-within {
  box-shadow: 0 0 0 2px var(--primary-500);
}

/* Skip to content links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary-600);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 0 0 4px 4px;
  z-index: 1000;
  font-weight: 600;
}

.skip-link:focus {
  top: 0;
}

/* Focus trap for modals */
.modal[aria-hidden="false"] {
  position: fixed;
  inset: 0;
  z-index: 100;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  margin: auto;
  max-width: 500px;
  background: white;
  border-radius: 0.5rem;
  box-shadow: var(--shadow-2xl);
}

/* Focus management within modal */
.modal[aria-hidden="false"] .modal-content *:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

### Keyboard Navigation Patterns

```javascript
// React component example for keyboard navigation
const KeyboardNavigationExample = () => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef([]);

  const handleKeyDown = (event, index) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = Math.min(focusedIndex + 1, itemRefs.current.length - 1);
        setFocusedIndex(nextIndex);
        itemRefs.current[nextIndex]?.focus();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = Math.max(focusedIndex - 1, 0);
        setFocusedIndex(prevIndex);
        itemRefs.current[prevIndex]?.focus();
        break;
        
      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        itemRefs.current[0]?.focus();
        break;
        
      case 'End':
        event.preventDefault();
        const lastIndex = itemRefs.current.length - 1;
        setFocusedIndex(lastIndex);
        itemRefs.current[lastIndex]?.focus();
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        // Activate the focused item
        handleItemSelect(index);
        break;
        
      case 'Escape':
        // Close dropdown/modal
        handleEscape();
        break;
    }
  };

  return (
    <ul role="listbox" aria-label="Specialist selection">
      {specialists.map((specialist, index) => (
        <li
          key={specialist.id}
          ref={el => itemRefs.current[index] = el}
          role="option"
          aria-selected={focusedIndex === index}
          tabIndex={focusedIndex === index ? 0 : -1}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onFocus={() => setFocusedIndex(index)}
          className="specialist-option"
        >
          {specialist.name}
        </li>
      ))}
    </ul>
  );
};
```

### Tab Order Management

```css
/* Logical tab order */
.container {
  /* Use natural DOM order when possible */
}

/* Skip problematic elements from tab order */
.decorative-element {
  tabindex: -1;
}

/* Include non-interactive elements that should be focusable */
.status-message[role="status"] {
  tabindex: 0;
}

/* Modal focus management */
.modal[aria-hidden="true"] * {
  tabindex: -1;
}

.modal[aria-hidden="false"] .modal-content {
  /* Restore tab order for modal content */
}

/* Dynamic content tab order */
.dynamic-content[aria-expanded="false"] .expandable-content * {
  tabindex: -1;
}

.dynamic-content[aria-expanded="true"] .expandable-content * {
  /* Restore natural tab order */
}
```

## 4. Screen Reader Optimization

### Semantic HTML Structure

```html
<!-- Proper heading hierarchy -->
<main>
  <h1>Find Your Perfect Service Professional</h1>
  
  <section aria-labelledby="categories-heading">
    <h2 id="categories-heading">Popular Service Categories</h2>
    
    <div role="grid" aria-label="Service categories">
      <div role="row">
        <div role="gridcell">
          <article>
            <h3>Hair & Beauty</h3>
            <p>Professional hair styling and beauty services</p>
            <a href="/categories/hair-beauty" aria-describedby="hair-beauty-desc">
              Explore Hair & Beauty Services
            </a>
            <p id="hair-beauty-desc">120+ verified professionals available</p>
          </article>
        </div>
      </div>
    </div>
  </section>
  
  <section aria-labelledby="featured-heading">
    <h2 id="featured-heading">Featured Specialists</h2>
    
    <div role="list" aria-label="Featured specialists">
      <article role="listitem" class="specialist-card">
        <img src="sarah-avatar.jpg" 
             alt="Sarah Martinez, professional hair stylist" 
             role="img">
        <h3>Sarah Martinez</h3>
        <p>Professional Hair Stylist</p>
        <div aria-label="Rating and reviews">
          <span aria-label="Rating: 4.9 out of 5 stars">
            <span aria-hidden="true">⭐⭐⭐⭐⭐</span>
            4.9
          </span>
          <span aria-label="127 customer reviews">(127 reviews)</span>
        </div>
        <p>Starting at <span class="price">$65</span></p>
        <a href="/specialists/sarah-martinez" 
           aria-describedby="sarah-cta-desc">
          View Sarah's Profile
        </a>
        <p id="sarah-cta-desc" class="sr-only">
          Professional hair stylist with 4.9 star rating and 127 reviews
        </p>
      </article>
    </div>
  </section>
</main>
```

### ARIA Labels and Descriptions

```html
<!-- Search interface -->
<form role="search" aria-label="Find service professionals">
  <div class="search-group">
    <label for="service-search">What service do you need?</label>
    <input 
      id="service-search" 
      type="text" 
      placeholder="e.g., haircut, massage, personal training"
      aria-describedby="search-help"
      aria-expanded="false"
      aria-autocomplete="list"
      aria-controls="search-suggestions"
    >
    <div id="search-help" class="help-text">
      Start typing to see service suggestions
    </div>
    
    <!-- Search suggestions dropdown -->
    <ul id="search-suggestions" 
        role="listbox" 
        aria-label="Service suggestions"
        class="hidden">
      <li role="option" aria-selected="false">Haircut & Styling</li>
      <li role="option" aria-selected="false">Hair Coloring</li>
      <li role="option" aria-selected="true">Hair Treatment</li>
    </ul>
  </div>
  
  <div class="location-group">
    <label for="location-search">Location</label>
    <input 
      id="location-search" 
      type="text" 
      placeholder="City, state, or zip code"
      aria-describedby="location-help"
    >
    <div id="location-help" class="help-text">
      Enter your location to find nearby professionals
    </div>
  </div>
  
  <button type="submit" aria-describedby="search-action-desc">
    Search Professionals
  </button>
  <div id="search-action-desc" class="sr-only">
    Search for service professionals in your area
  </div>
</form>

<!-- Booking form with proper labeling -->
<form aria-labelledby="booking-form-title">
  <h2 id="booking-form-title">Book Your Appointment</h2>
  
  <fieldset>
    <legend>Service Selection</legend>
    
    <div role="radiogroup" aria-labelledby="service-options-legend">
      <div id="service-options-legend" class="legend">Choose your service:</div>
      
      <label class="radio-option">
        <input type="radio" 
               name="service" 
               value="haircut" 
               aria-describedby="haircut-desc">
        <span class="radio-label">Haircut & Style</span>
        <span id="haircut-desc" class="service-desc">
          60 minutes - $65 - Perfect for a fresh new look
        </span>
      </label>
      
      <label class="radio-option">
        <input type="radio" 
               name="service" 
               value="coloring" 
               aria-describedby="coloring-desc">
        <span class="radio-label">Hair Coloring</span>
        <span id="coloring-desc" class="service-desc">
          120 minutes - $95 - Professional color treatment
        </span>
      </label>
    </div>
  </fieldset>
  
  <fieldset>
    <legend>Appointment Date & Time</legend>
    
    <div class="date-time-selector">
      <label for="appointment-date">Select Date</label>
      <input 
        id="appointment-date" 
        type="date" 
        min="2024-03-14"
        aria-describedby="date-help"
      >
      <div id="date-help" class="help-text">
        Choose a date at least 24 hours in advance
      </div>
      
      <div role="radiogroup" aria-labelledby="time-legend">
        <div id="time-legend">Available time slots:</div>
        
        <label class="time-option">
          <input type="radio" name="time" value="09:00" aria-describedby="time-09-desc">
          <span class="time-label">9:00 AM</span>
          <span id="time-09-desc" class="sr-only">Available appointment slot</span>
        </label>
        
        <label class="time-option disabled">
          <input type="radio" name="time" value="10:00" disabled aria-describedby="time-10-desc">
          <span class="time-label">10:00 AM</span>
          <span id="time-10-desc" class="sr-only">Unavailable - already booked</span>
        </label>
      </div>
    </div>
  </fieldset>
  
  <button type="submit" aria-describedby="submit-desc">
    Continue to Payment
  </button>
  <div id="submit-desc" class="sr-only">
    Proceed to payment step to complete your booking
  </div>
</form>
```

### Live Regions for Dynamic Content

```html
<!-- Status announcements -->
<div aria-live="polite" aria-atomic="true" class="sr-only" id="status-announcements">
  <!-- Dynamic status messages appear here -->
</div>

<div aria-live="assertive" aria-atomic="true" class="sr-only" id="urgent-announcements">
  <!-- Critical announcements appear here -->
</div>

<!-- Loading states -->
<div class="search-results" aria-busy="false" aria-live="polite">
  <div id="results-status" aria-live="polite" aria-atomic="true">
    <!-- "Loading results..." or "Found 127 specialists" -->
  </div>
  
  <div class="results-list">
    <!-- Search results content -->
  </div>
</div>

<!-- Form validation messages -->
<div class="form-group">
  <label for="email">Email Address</label>
  <input 
    id="email" 
    type="email" 
    aria-describedby="email-error"
    aria-invalid="false"
  >
  <div id="email-error" 
       role="alert" 
       aria-live="assertive" 
       class="error-message hidden">
    <!-- Error message appears here when validation fails -->
  </div>
</div>
```

### Screen Reader Only Content

```css
/* Screen reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Show on focus for keyboard users */
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}

/* Hide decorative content from screen readers */
.decorative {
  aria-hidden: true;
}

/* Ensure important content is announced */
.announcement {
  aria-live: polite;
  aria-atomic: true;
}

.urgent-announcement {
  aria-live: assertive;
  aria-atomic: true;
}
```

## 5. Form Accessibility

### Error Handling & Validation

```html
<!-- Accessible form with comprehensive error handling -->
<form novalidate aria-labelledby="registration-title">
  <h2 id="registration-title">Create Your Account</h2>
  
  <!-- Error summary -->
  <div id="error-summary" 
       role="alert" 
       aria-labelledby="error-summary-title"
       class="error-summary hidden">
    <h3 id="error-summary-title">Please correct the following errors:</h3>
    <ul id="error-list">
      <!-- Error items populated dynamically -->
    </ul>
  </div>
  
  <div class="form-group">
    <label for="first-name" class="required">
      First Name
      <span aria-label="required">*</span>
    </label>
    <input 
      id="first-name" 
      type="text" 
      required
      aria-describedby="first-name-help first-name-error"
      aria-invalid="false"
    >
    <div id="first-name-help" class="help-text">
      Enter your first name as it appears on your ID
    </div>
    <div id="first-name-error" 
         role="alert" 
         aria-live="polite" 
         class="error-message hidden">
      <!-- Error message populated when validation fails -->
    </div>
  </div>
  
  <div class="form-group">
    <label for="email" class="required">
      Email Address
      <span aria-label="required">*</span>
    </label>
    <input 
      id="email" 
      type="email" 
      required
      autocomplete="email"
      aria-describedby="email-help email-error"
      aria-invalid="false"
    >
    <div id="email-help" class="help-text">
      We'll use this to send booking confirmations
    </div>
    <div id="email-error" 
         role="alert" 
         aria-live="polite" 
         class="error-message hidden">
    </div>
  </div>
  
  <div class="form-group">
    <label for="password" class="required">
      Password
      <span aria-label="required">*</span>
    </label>
    <input 
      id="password" 
      type="password" 
      required
      autocomplete="new-password"
      aria-describedby="password-help password-error"
      aria-invalid="false"
    >
    <div id="password-help" class="help-text">
      Must be at least 8 characters with at least one number
    </div>
    <div id="password-error" 
         role="alert" 
         aria-live="polite" 
         class="error-message hidden">
    </div>
  </div>
  
  <fieldset>
    <legend>Account Type</legend>
    <div role="radiogroup" aria-describedby="account-type-help">
      <label class="radio-option">
        <input type="radio" name="userType" value="customer" required>
        <span>Customer</span>
        <span class="option-description">I want to book services</span>
      </label>
      <label class="radio-option">
        <input type="radio" name="userType" value="specialist" required>
        <span>Service Provider</span>
        <span class="option-description">I want to offer services</span>
      </label>
    </div>
    <div id="account-type-help" class="help-text">
      Choose the account type that best describes you
    </div>
  </fieldset>
  
  <div class="form-group">
    <label class="checkbox-option">
      <input type="checkbox" 
             required
             aria-describedby="terms-desc">
      <span>I agree to the Terms of Service and Privacy Policy</span>
    </label>
    <div id="terms-desc" class="help-text">
      <a href="/terms" target="_blank" aria-describedby="terms-link-desc">
        Read Terms of Service
      </a>
      <span id="terms-link-desc" class="sr-only">(opens in new window)</span>
      and 
      <a href="/privacy" target="_blank" aria-describedby="privacy-link-desc">
        Privacy Policy
      </a>
      <span id="privacy-link-desc" class="sr-only">(opens in new window)</span>
    </div>
  </div>
  
  <button type="submit" aria-describedby="submit-help">
    Create Account
  </button>
  <div id="submit-help" class="help-text">
    Your account will be created and you'll receive a confirmation email
  </div>
</form>
```

### Form Validation JavaScript

```javascript
// Accessible form validation
class AccessibleFormValidator {
  constructor(form) {
    this.form = form;
    this.errorSummary = form.querySelector('#error-summary');
    this.errorList = form.querySelector('#error-list');
    this.errors = new Map();
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.validateForm();
    });
    
    // Real-time validation
    this.form.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('blur', () => this.validateField(field));
      field.addEventListener('input', () => this.clearFieldError(field));
    });
  }
  
  validateField(field) {
    const errors = [];
    
    // Required field validation
    if (field.hasAttribute('required') && !field.value.trim()) {
      errors.push(`${this.getFieldLabel(field)} is required`);
    }
    
    // Email validation
    if (field.type === 'email' && field.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value)) {
        errors.push('Please enter a valid email address');
      }
    }
    
    // Password validation
    if (field.type === 'password' && field.value) {
      if (field.value.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      if (!/\d/.test(field.value)) {
        errors.push('Password must contain at least one number');
      }
    }
    
    this.setFieldError(field, errors);
    return errors.length === 0;
  }
  
  setFieldError(field, errors) {
    const errorElement = document.getElementById(`${field.id}-error`);
    
    if (errors.length > 0) {
      field.setAttribute('aria-invalid', 'true');
      field.classList.add('error');
      errorElement.textContent = errors.join('. ');
      errorElement.classList.remove('hidden');
      
      this.errors.set(field.id, errors);
    } else {
      this.clearFieldError(field);
    }
  }
  
  clearFieldError(field) {
    const errorElement = document.getElementById(`${field.id}-error`);
    
    field.setAttribute('aria-invalid', 'false');
    field.classList.remove('error');
    errorElement.textContent = '';
    errorElement.classList.add('hidden');
    
    this.errors.delete(field.id);
  }
  
  validateForm() {
    this.errors.clear();
    
    // Validate all fields
    const fields = this.form.querySelectorAll('input, select, textarea');
    let allValid = true;
    
    fields.forEach(field => {
      if (!this.validateField(field)) {
        allValid = false;
      }
    });
    
    if (allValid) {
      this.submitForm();
    } else {
      this.showErrorSummary();
      this.focusFirstError();
    }
  }
  
  showErrorSummary() {
    this.errorList.innerHTML = '';
    
    this.errors.forEach((errors, fieldId) => {
      const field = document.getElementById(fieldId);
      const label = this.getFieldLabel(field);
      
      errors.forEach(error => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${fieldId}`;
        link.textContent = `${label}: ${error}`;
        link.addEventListener('click', (e) => {
          e.preventDefault();
          field.focus();
        });
        li.appendChild(link);
        this.errorList.appendChild(li);
      });
    });
    
    this.errorSummary.classList.remove('hidden');
    this.errorSummary.focus();
  }
  
  focusFirstError() {
    const firstErrorField = this.form.querySelector('[aria-invalid="true"]');
    if (firstErrorField) {
      firstErrorField.focus();
    }
  }
  
  getFieldLabel(field) {
    const label = this.form.querySelector(`label[for="${field.id}"]`);
    return label ? label.textContent.replace('*', '').trim() : field.id;
  }
  
  submitForm() {
    // Announce successful submission
    const announcement = document.getElementById('status-announcements');
    announcement.textContent = 'Form submitted successfully. Redirecting...';
    
    // Proceed with form submission
    this.form.submit();
  }
}

// Initialize form validation
document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('form[novalidate]');
  forms.forEach(form => new AccessibleFormValidator(form));
});
```

## 6. Image & Media Accessibility

### Alternative Text Guidelines

```html
<!-- Informative images -->
<img src="sarah-martinez.jpg" 
     alt="Sarah Martinez, a professional hair stylist with blonde hair wearing a black salon apron">

<!-- Functional images (buttons, links) -->
<a href="/profile/edit">
  <img src="edit-icon.svg" alt="Edit profile">
</a>

<!-- Decorative images -->
<img src="decorative-pattern.svg" alt="" aria-hidden="true">

<!-- Complex images with long descriptions -->
<figure>
  <img src="booking-flow-chart.png" 
       alt="Booking process flowchart" 
       aria-describedby="chart-desc">
  <figcaption id="chart-desc">
    A flowchart showing the 4-step booking process: 
    1. Search for services, 
    2. Select specialist and service, 
    3. Choose date and time, 
    4. Complete payment. Each step is connected with arrows showing the progression.
  </figcaption>
</figure>

<!-- Portfolio images with context -->
<div class="portfolio-grid">
  <figure>
    <img src="haircut-before-after.jpg" 
         alt="Before and after photos showing a dramatic hair transformation from long brown hair to a modern blonde bob cut">
    <figcaption>Modern bob transformation by Sarah Martinez</figcaption>
  </figure>
  
  <figure>
    <img src="color-treatment.jpg" 
         alt="Hair coloring process showing highlights being applied with foil technique">
    <figcaption>Professional highlight application technique</figcaption>
  </figure>
</div>

<!-- Rating stars with accessible markup -->
<div class="rating" aria-label="Customer rating: 4.8 out of 5 stars">
  <span aria-hidden="true">★★★★☆</span>
  <span class="sr-only">4.8 out of 5 stars</span>
  <span class="rating-text">4.8 (127 reviews)</span>
</div>

<!-- Avatar images -->
<div class="user-avatar">
  <img src="customer-avatar.jpg" 
       alt="Jennifer Smith" 
       role="img">
  <span class="status-indicator" 
        aria-label="Online now" 
        title="Online now"></span>
</div>
```

### Video & Audio Accessibility

```html
<!-- Video with captions and transcript -->
<figure>
  <video controls 
         aria-labelledby="video-title" 
         aria-describedby="video-desc">
    <source src="salon-tour.mp4" type="video/mp4">
    <track kind="captions" 
           src="salon-tour-captions.vtt" 
           srclang="en" 
           label="English captions">
    <track kind="descriptions" 
           src="salon-tour-descriptions.vtt" 
           srclang="en" 
           label="English descriptions">
    <p>Your browser doesn't support HTML5 video. 
       <a href="salon-tour.mp4">Download the video</a> instead.</p>
  </video>
  
  <figcaption>
    <h3 id="video-title">Virtual Tour of Sarah's Hair Studio</h3>
    <p id="video-desc">
      Take a virtual tour of our modern, fully-equipped hair salon featuring 
      premium styling stations and a relaxing atmosphere.
    </p>
    <details>
      <summary>View full transcript</summary>
      <div class="transcript">
        <p><strong>0:00</strong> Welcome to Sarah's Hair Studio...</p>
        <p><strong>0:15</strong> Here you can see our modern styling stations...</p>
        <!-- Full transcript content -->
      </div>
    </details>
  </figcaption>
</figure>

<!-- Audio testimonial with transcript -->
<figure>
  <audio controls aria-labelledby="testimonial-title">
    <source src="customer-testimonial.mp3" type="audio/mpeg">
    <source src="customer-testimonial.ogg" type="audio/ogg">
    <p>Your browser doesn't support HTML5 audio. 
       <a href="customer-testimonial.mp3">Download the audio</a> instead.</p>
  </audio>
  
  <figcaption>
    <h4 id="testimonial-title">Customer Testimonial - Jennifer K.</h4>
    <blockquote>
      "I've been going to Sarah for over a year now, and she never fails to 
      give me exactly what I want. Her attention to detail is incredible, 
      and the salon has such a welcoming atmosphere. I always leave feeling 
      like a new person!"
    </blockquote>
    <cite>— Jennifer K., Regular Customer</cite>
  </figcaption>
</figure>
```

## 7. Testing & Validation Tools

### Automated Testing Tools

```javascript
// Accessibility testing with Jest and axe-core
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  test('Homepage should not have accessibility violations', async () => {
    const { container } = render(<HomePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  test('Booking form should be accessible', async () => {
    const { container } = render(<BookingForm />);
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true }
      }
    });
    expect(results).toHaveNoViolations();
  });
  
  test('Search results should have proper ARIA labels', async () => {
    const { container } = render(<SearchResults />);
    
    // Check for proper heading structure
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    expect(headings.length).toBeGreaterThan(0);
    
    // Check for proper list structure
    const lists = container.querySelectorAll('[role="list"], [role="listbox"]');
    expect(lists.length).toBeGreaterThan(0);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// Keyboard navigation testing
import { fireEvent } from '@testing-library/react';

describe('Keyboard Navigation', () => {
  test('Should navigate specialist cards with arrow keys', () => {
    const { container } = render(<SpecialistGrid />);
    
    const firstCard = container.querySelector('[role="listitem"]');
    firstCard.focus();
    
    // Test arrow key navigation
    fireEvent.keyDown(firstCard, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(
      container.querySelector('[role="listitem"]:nth-child(2)')
    );
    
    fireEvent.keyDown(document.activeElement, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(firstCard);
  });
  
  test('Should trap focus in modal dialog', () => {
    const { container } = render(<BookingModal />);
    
    const modal = container.querySelector('[role="dialog"]');
    const firstFocusable = modal.querySelector('button');
    const lastFocusable = modal.querySelector('button:last-of-type');
    
    firstFocusable.focus();
    
    // Tab forward to last element
    fireEvent.keyDown(lastFocusable, { key: 'Tab' });
    expect(document.activeElement).toBe(firstFocusable);
    
    // Shift+Tab backward from first element
    fireEvent.keyDown(firstFocusable, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastFocusable);
  });
});
```

### Manual Testing Checklist

```markdown
## Manual Accessibility Testing Checklist

### Keyboard Navigation
- [ ] All interactive elements are reachable via keyboard
- [ ] Tab order is logical and intuitive
- [ ] Focus indicators are visible and clear
- [ ] No keyboard traps (except intentional modal focus traps)
- [ ] Skip links work properly
- [ ] Arrow keys work in lists/grids where expected
- [ ] Enter/Space activate buttons and links
- [ ] Escape closes modals and dropdowns

### Screen Reader Testing
- [ ] All content is announced properly
- [ ] Headings create logical document outline
- [ ] Lists and tables are identified correctly
- [ ] Form fields have proper labels
- [ ] Error messages are announced
- [ ] Status changes are announced
- [ ] Images have appropriate alt text
- [ ] Links are descriptive

### Visual Testing
- [ ] Color contrast meets WCAG AA standards
- [ ] Information isn't conveyed by color alone
- [ ] Text can resize to 200% without horizontal scrolling
- [ ] Content reflows properly at 320px width
- [ ] Focus indicators are visible
- [ ] UI elements maintain contrast in high contrast mode

### Motor Accessibility
- [ ] Target sizes are at least 44x44px on mobile
- [ ] Interactive elements have adequate spacing
- [ ] Drag and drop has keyboard alternatives
- [ ] Hover functionality has focus equivalents
- [ ] Timeouts can be extended or disabled

### Cognitive Accessibility
- [ ] Error messages are clear and helpful
- [ ] Instructions are provided for complex tasks
- [ ] Important actions require confirmation
- [ ] Consistent navigation and layout patterns
- [ ] Clear headings and page structure
```

### Browser Testing Matrix

```markdown
## Browser & Assistive Technology Testing

### Desktop Testing
- [ ] Chrome + NVDA (Windows)
- [ ] Firefox + JAWS (Windows)
- [ ] Safari + VoiceOver (macOS)
- [ ] Edge + Narrator (Windows)

### Mobile Testing
- [ ] Safari + VoiceOver (iOS)
- [ ] Chrome + TalkBack (Android)
- [ ] Firefox + TalkBack (Android)

### Additional Tools
- [ ] Dragon NaturallySpeaking (speech recognition)
- [ ] Switch Control (iOS/Android)
- [ ] Voice Control (macOS/iOS)
- [ ] High contrast mode testing
- [ ] Zoom software testing

### Automated Tools
- [ ] axe DevTools browser extension
- [ ] WAVE Web Accessibility Evaluator
- [ ] Lighthouse accessibility audit
- [ ] Color Contrast Analyzers
- [ ] Keyboard navigation testing tools
```

This comprehensive accessibility framework ensures the booking platform meets WCAG 2.1 AA standards and provides an inclusive experience for all users, regardless of their abilities or assistive technologies used.