# FoodyFlow

## Overview

FoodyFlow is a comprehensive restaurant management system designed to help restaurant owners and kitchen staff track inventory, calculate food costs, manage recipes and dishes, and monitor waste and sales performance. The application provides real-time food cost calculations, inventory management, and detailed sales reporting to optimize restaurant profitability.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript in strict mode
- **Styling**: Tailwind CSS with custom restaurant-focused design system
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state management
- **Forms**: React Hook Form with Zod validation
- **Theme**: Next-themes for dark/light mode support with custom color palette optimized for restaurant environments

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with consistent error handling
- **Request Processing**: JSON and URL-encoded body parsing
- **Development**: Hot module replacement via Vite integration

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon serverless PostgreSQL via `@neondatabase/serverless`
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Validation**: Drizzle-Zod integration for runtime type safety

### Database Schema Design
The system manages six core entities:
- **Products**: Raw ingredients and supplies with waste tracking, supplier information, and unit pricing
- **Recipes**: Ingredient combinations with cost calculations for preparation items
- **Dishes**: Complete menu items with ingredient lists, selling prices, and food cost percentages
- **Waste**: Tracking of product waste with cost implications
- **Personal Meals**: Staff meal tracking for accurate cost accounting
- **Budget Entries**: Monthly budget planning with coperto medio calculations, consuntivo tracking, and year-over-year analysis

### Authentication and Authorization
Currently implements a simplified session-based system with:
- Basic request logging and error handling middleware
- Credential-based fetch requests for API security
- No complex user authentication (suitable for single-restaurant use)

## External Dependencies

### Database Services
- **Neon**: Serverless PostgreSQL hosting platform
- **Drizzle ORM**: Type-safe database queries and migrations
- **Connect-pg-simple**: PostgreSQL session storage (configured but not actively used)

### UI and Styling
- **Radix UI**: Accessible component primitives for complex interactions
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Lucide React**: Icon library for consistent iconography
- **Inter & JetBrains Mono**: Typography fonts for readability and data display

### Development and Build Tools
- **Vite**: Frontend build tool with hot module replacement
- **esbuild**: Backend bundling for production builds
- **TypeScript**: Static type checking across the entire stack
- **Replit**: Development platform integration with cartographer and error overlay plugins

### Form and Data Handling
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema definition
- **@hookform/resolvers**: Integration between React Hook Form and Zod
- **Date-fns**: Date manipulation utilities

### Additional Libraries
- **Class Variance Authority**: Component variant management
- **clsx & tailwind-merge**: Conditional CSS class composition
- **cmdk**: Command palette functionality
- **Embla Carousel**: Carousel/slider components for UI enhancement

## Recent Changes

### Mobile App Development Strategy (September 20, 2025)

**Technology Decision**: Implemented Capacitor-based native app strategy for unified codebase maintenance.

#### Strategic Benefits:
- **Single Codebase**: Web app React code directly becomes mobile app
- **Cost Optimization**: Zero additional development/maintenance costs
- **Instant Synchronization**: Changes to web app automatically reflect in mobile app
- **Native Access**: Full access to device APIs when needed (camera, notifications, etc.)
- **Store Deployment**: Direct deployment to Play Store and Apple App Store

#### Technical Approach:
- **Capacitor Integration**: Wraps existing React web app for native deployment
- **Unified Development**: Single `npm run dev` workflow for all platforms
- **Shared Assets**: Icons, images, and resources unified across platforms
- **Progressive Enhancement**: Web-first approach with mobile-specific optimizations

### Budget Module Restructuring (September 19, 2025)

**Major Enhancement**: Completely restructured the Budget module for advanced restaurant financial planning and year-over-year analysis.

#### Database Changes:
- **New Column**: Added `coperto_medio` (REAL) to `budget_entries` table for average cover price tracking
- **Schema Update**: Enhanced budget_entries with proper Zod validation for new field

#### Business Logic Transformation:
- **Coperto Medio Integration**: New first column for inputting average cover price
- **Automatic Budget Calculation**: Budget Revenue now automatically calculated as `Coperti × Coperto Medio`
- **Split Consuntivo Tracking**: Separated into Consuntivo 2026 and Consuntivo 2025 for comparative analysis
- **New Delta Calculation**: Changed from budget vs actual to year-over-year comparison (2026 vs 2025)
- **Removed Obsolete Columns**: Eliminated "A Bdg" and "A A Reale" columns per user requirements

#### Technical Implementation:
- **Real-time Calculations**: Frontend automatically updates Budget Revenue, Consuntivo values, and Delta % on input changes
- **Enhanced API**: Updated storage layer and routes to handle coperto_medio field with full CRUD operations
- **Italian Formatting**: Maintained € currency symbols and comma decimal separators throughout
- **Improved UX**: Color-coded Delta % with green for growth, red for decline (year-over-year semantics)
- **Test Coverage**: End-to-end testing confirms editing, calculations, and data persistence functionality

#### User Interface:
- **New Column Structure**: Data | Coperto Medio € | Coperti | Sala Budget € | Delivery Budget € | Sala Incasso 2025 € | Delivery 2025 € | Consuntivo 2026 € | Consuntivo 2025 € | Delta %
- **Summary Cards**: Updated to show "Consuntivo 2026", "Consuntivo 2025", and "Performance" with year-over-year comparison context
- **Responsive Design**: Maintains horizontal scrolling and mobile-friendly layout with new column structure

### Complete Architectural Separation (September 19, 2025)

**Major Architectural Transformation**: Successfully completed full separation between Budget planning and P&L economic analysis sections.

#### Architectural Changes:
- **New P&L Page**: Created dedicated `client/src/pages/PL.tsx` as sole owner of economic performance analysis
- **Budget Simplification**: Completely removed all economic logic from `client/src/components/Budget.tsx`
- **Clean Separation**: Budget = planning only, P&L = economic analysis only
- **Month/Year Synchronization**: Implemented localStorage-based synchronization between Budget and P&L sections

#### Technical Implementation:
- **Complete Code Removal**: Eliminated all EconomicParameters queries, mutations, states, and handlers from Budget.tsx
- **P&L Autonomy**: P&L page now manages its own economic parameters with full CRUD operations
- **Bidirectional Editing**: Maintained full bidirectional editing capabilities in P&L section
- **Synchronized Navigation**: Both sections share month/year selection via localStorage keys (foodyflow-selected-year, foodyflow-selected-month)
- **Route Integration**: Added `/pl` route to App.tsx with proper navigation

#### Business Benefits:
- **Clear Responsibility**: Budget focuses purely on revenue planning, P&L handles all economic analysis
- **Improved UX**: Users can switch between sections while maintaining selected time period
- **Better Performance**: Reduced component complexity and improved rendering efficiency
- **Maintainability**: Cleaner codebase with distinct separation of concerns