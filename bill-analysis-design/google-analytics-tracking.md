# Google Analytics (GA4) Implementation Guide

## Overview
This document outlines the Google Analytics 4 (GA4) implementation in the LegiEquity Monitor application. The implementation uses Next.js's `@next/third-parties` package for the base setup and includes custom tracking capabilities through data attributes and a custom hook.

## Key Files
1. `app/layout.tsx` - Root layout with GA4 initialization
2. `app/utils/analytics.ts` - Core analytics utilities and initialization
3. `app/hooks/useAnalytics.ts` - Custom analytics hook implementation (Client Component)
4. `app/providers/AnalyticsProvider.tsx` - Analytics context provider (Client Component)

## Important Notes
- Both `useAnalytics.ts` and `AnalyticsProvider.tsx` are marked with `'use client'` as they use client-side features
- The analytics hook uses browser APIs and React hooks that are only available in Client Components
- The provider should wrap any components that need analytics tracking capabilities
- The `analytics.ts` utility provides safe initialization and event tracking

## Implementation Details

### Analytics Initialization
The analytics implementation follows these steps:
1. GA4 script is loaded via `@next/third-parties/google` in the root layout
2. `analytics.ts` initializes the gtag function and dataLayer
3. `useAnalytics` hook sets up event listeners and tracking functionality
4. `AnalyticsProvider` wraps the application to provide analytics context

## Tracking Methods

### 1. Automatic Page View Tracking
Page views are automatically tracked on route changes. The following data is captured:
- `page_path`: Current URL path
- `page_search`: URL search parameters
- `page_title`: Document title

### 2. Click Tracking
Elements can be tracked on click using data attributes:

```jsx
<button 
  data-track-click
  data-track-event-category="Navigation"
  data-track-event-action="button_click"
  data-track-event-label="Submit Form"
  data-track-event-value="1"
  data-track-custom-props='{"button_type": "submit"}'
>
  Click me
</button>
```

### 3. Impression (In-View) Tracking
Elements can be tracked when they come into view:

```jsx
<div 
  data-track-inview
  data-track-event-category="Content"
  data-track-event-action="section_view"
  data-track-event-label="Hero Section"
  data-track-custom-props='{"section_type": "hero"}'
>
  Content
</div>
```

### 4. Manual Event Tracking
Events can be tracked programmatically using the `trackEvent` function:

```typescript
const { trackEvent } = useAnalytics()
trackEvent('custom_event', {
  event_category: 'User Action',
  event_label: 'Custom Interaction',
  custom_prop: 'value'
})
```

## Data Attributes Reference

| Attribute | Description | Example Value |
|-----------|-------------|---------------|
| `data-track-click` | Enables click tracking | No value needed |
| `data-track-inview` | Enables impression tracking | No value needed |
| `data-track-event-category` | Event category | "Navigation", "Content", "User Action" |
| `data-track-event-action` | Event action | "button_click", "section_view" |
| `data-track-event-label` | Event label | "Submit Form", "Hero Section" |
| `data-track-event-value` | Numeric value | "1", "100" |
| `data-track-custom-props` | JSON string of custom properties | '{"button_type": "submit"}' |

## Tracked Properties
All events automatically include:
- `page_path`: Current URL path
- `page_title`: Document title
- `element_type`: HTML tag name (for click/impression events)
- `element_id`: Element ID if present
- `element_class`: Element classes if present
- `visibility_percent`: Visibility percentage (for impression events)

## Implementation Guidelines

1. **Categories**: Use consistent categories across similar elements:
   - Navigation
   - Content
   - User Action
   - Form
   - Bill
   - Search
   - Filter

2. **Actions**: Use descriptive verbs in snake_case:
   - `button_click`
   - `section_view`
   - `form_submit`
   - `bill_view`
   - `search_execute`
   - `filter_apply`

3. **Labels**: Use specific, descriptive labels that identify the element:
   - "Submit Form"
   - "Hero Section"
   - "Bill Details"
   - "Search Results"

4. **Custom Properties**: Include additional context when relevant:
   ```json
   {
     "button_type": "submit",
     "section_type": "hero",
     "bill_id": "HB123",
     "search_term": "education"
   }
   ```

## Best Practices
1. Always include event category, action, and label for better data organization
2. Use consistent naming conventions across similar elements
3. Add custom properties for additional context when needed
4. Test tracking implementation in GA4 debug mode before deployment
5. Document new tracking additions in the codebase 