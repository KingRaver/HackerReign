# Project Structure

```
hackerreign/
├── .vscode/                      # VSCode workspace settings
│   ├── css-custom-data.json      # Custom CSS definitions for Tailwind v4
│   └── settings.json             # Editor configuration
│
├── app/                          # Next.js App Router directory
│   ├── api/                      # API routes
│   │   └── llm/                  # LLM endpoint
│   │       └── route.ts          # LLM API handler
│   ├── favicon.ico               # Site favicon
│   ├── globals.css               # Global styles with Tailwind v4
│   ├── layout.tsx                # Root layout component
│   └── page.tsx                  # Home page
│
├── components/                   # React components
│   └── Chat.tsx                  # Chat interface component
│
├── public/                       # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── .env.local                    # Environment variables (not in git)
├── .gitignore                    # Git ignore rules
├── OUTLINE.md                    # Project outline/planning
├── README.md                     # Project documentation
├── eslint.config.mjs             # ESLint configuration
├── global.d.ts                   # Global TypeScript declarations
├── next-env.d.ts                 # Next.js TypeScript declarations
├── next.config.ts                # Next.js configuration
├── package.json                  # Project dependencies and scripts
├── package-lock.json             # Locked dependency versions
├── postcss.config.mjs            # PostCSS configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## Key Directories

### `/app`
Next.js 14+ App Router structure. Contains all pages, layouts, and API routes.

### `/app/api`
Server-side API endpoints. Currently hosts the LLM integration.

### `/components`
Reusable React components used across the application.

### `/public`
Static files served directly by Next.js without processing.

### `/.vscode`
VSCode-specific settings for consistent development experience.

## Configuration Files

- **next.config.ts** - Next.js framework configuration
- **tsconfig.json** - TypeScript compiler options
- **tailwind.config.ts** - Tailwind CSS v4 customization
- **postcss.config.mjs** - PostCSS plugins (including Tailwind)
- **eslint.config.mjs** - Code linting rules
- **global.d.ts** - Custom TypeScript type declarations

## Scripts

See `package.json` for available npm scripts:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types
