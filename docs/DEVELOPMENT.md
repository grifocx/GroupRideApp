# Development Guide

This document provides comprehensive guidance for developers working on the GroupRideApp project.

## Architecture

- The application follows modern web application patterns and best practices
- The frontend handles most of the application logic, with the backend primarily responsible for data persistence and API calls
- The data model is kept as simple as possible while ensuring consistency between frontend and backend

## Frontend Development

### Routing
- We use `wouter` for frontend routing
- Keep the number of routes and pages minimal
- If a feature can be implemented as a modal or dialog, prefer that over a new page
- New pages should be added to the `client/src/pages` directory and registered in `client/src/App.tsx`
- For navigation between pages, use the `Link` component or the `useLocation` hook from `wouter`

### Forms
- Always use shadcn's `useForm` hook and `Form` component from `@/components/ui/form`
- Remember that form components are controlled - pass default values to the `useForm` hook
- Implement comprehensive validation for all forms

### Data Fetching
- Always use `@tanstack/react-query` when fetching data
- Show loading or skeleton states while queries or mutations are being made
- For hierarchical or variable query keys, use an array for cache segments (e.g., `queryKey: ['/api/recipes', id]`)
- Implement proper cache invalidation strategies

### Common Practices
- The `useToast` hook is exported from `@/hooks/use-toast`
- React is automatically imported by Vite's JSX transformer
- If a form submission fails, check `form.formState.errors` for validation issues
- Use `import.meta.env.<ENV_VAR>` to access environment variables (must be prefixed with `VITE_`)

## Styling and Theming

- Customize `theme.json` for design changes instead of modifying `index.css`
- The theme schema follows: `{ primary: string, variant: 'professional' | 'tint' | 'vibrant', appearance: 'light' | 'dark' | 'system', radius: number }`
- Use existing shadcn + Tailwind CSS components wherever possible
- Use `@`-prefixed paths to import shadcn components and hooks
- Design should be responsive and work well on mobile, tablet, and desktop
- Use icons from `lucide-react` for actions and visual cues
- Use `react-icons/si` for company logos
- Avoid using stock images as background images for large page sections

## Backend Development

- Add API routes to the `server/routes.ts` file
- When adding a WebSocket server, ensure that your custom upgrade handler ignores requests with `sec-websocket-protocol` as `vite-hmr`

## Database and Authentication

- Use Drizzle as the ORM with PostgreSQL
- Place all Drizzle models and relations in `db/schema.ts` and import from the alias `@db/schema`
- Explicitly model relationships using the `relations` operator from `drizzle-orm`
- Run `npm run db:push` after editing data models (never manually write SQL migrations)
- For database access in API routes, use `drizzle-orm` (e.g., `import { db } from "db";` and `import { users } from "@db/schema";`)
- Remember that filter and order operators (`eq`, `and`, `or`, `asc`, `desc`, etc.) are available as top-level functions

## Running the Project

- The 'Start application' workflow runs `npm run dev`, starting both the Express backend and Vite frontend
- The workflow restarts automatically after making edits

## Restricted Changes

- Do not modify the Vite setup (`server/vite.ts` and `vite.config.ts`)
- Do not edit `package.json` directly
- Use the packager_install_tool when installing packages

## Performance Considerations

- Implement proper memoization for components that render frequently
- Optimize bundle size through code splitting and lazy loading
- Use appropriate caching strategies for queries and data
- Monitor component render performance

## Testing Guidelines

- Write unit tests for utility functions
- Add integration tests for components
- Test error cases and edge conditions
- Ensure accessibility compliance
- Test responsive design at various breakpoints

## Accessibility

- Use semantic HTML elements
- Add proper ARIA attributes where needed
- Ensure sufficient color contrast
- Support keyboard navigation
- Test with screen readers

## Security Best Practices

- Implement Row Level Security (RLS) for database tables
- Use proper authentication for all API endpoints
- Manage sensitive information through environment variables
- Implement proper input validation and sanitization
- Use HTTPS for all communication