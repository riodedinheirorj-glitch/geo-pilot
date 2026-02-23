# AI Rules & Tech Stack

## Tech Stack
- **Framework**: React 18 with TypeScript and Vite for fast development and type safety.
- **Styling**: Tailwind CSS for utility-first styling, following the custom design system defined in `src/index.css`.
- **UI Components**: shadcn/ui (built on Radix UI) for accessible, high-quality accessible components.
- **Icons**: Lucide React for a consistent and lightweight icon set.
- **Routing**: React Router DOM for client-side navigation.
- **State Management**: TanStack Query (React Query) for server state and caching; React hooks for local state.
- **Backend/Auth**: Supabase for database, authentication, and real-time features.
- **Maps**: Mapbox GL JS for interactive map visualizations and routing.
- **Data Processing**: XLSX for parsing and handling Excel/CSV files.
- **Testing**: Vitest and React Testing Library for unit and component testing.

## Library Usage Rules

### UI & Styling
- **shadcn/ui**: Always check `src/components/ui` before creating a new UI component. Use these as the foundation for all interface elements.
- **Tailwind CSS**: Use Tailwind classes for all layout and styling. Avoid writing custom CSS unless it's for complex animations or global theme variables in `index.css`.
- **Lucide React**: Use only Lucide icons to maintain visual consistency.

### Data & Logic
- **TanStack Query**: Use for all asynchronous data fetching, mutations, and synchronization with Supabase. Do not use `useEffect` for data fetching.
- **Supabase**: Use the generated client in `src/integrations/supabase/client.ts` for all database interactions.
- **Zod**: Use Zod for schema validation, especially for form data and API responses.
- **React Hook Form**: Use for managing form state and validation in conjunction with Zod.

### Navigation & Feedback
- **React Router**: Keep all route definitions in `src/App.tsx`. Use the `NavLink` component for navigation links.
- **Sonner**: Use `sonner` for toast notifications and user feedback.
- **Vaul**: Use for drawer/bottom sheet components on mobile views.

### Project Structure
- **Pages**: Place top-level route components in `src/pages/`.
- **Components**: Place reusable UI logic in `src/components/`.
- **Hooks**: Place custom reusable logic in `src/hooks/`.
- **Integrations**: Keep third-party service configurations (like Supabase) in `src/integrations/`.