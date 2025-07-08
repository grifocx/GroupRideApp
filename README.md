# GroupRideApp Next.js Migration

## Setup Instructions

### 1. Create New GitHub Repo
```bash
# Create repo on GitHub: grouprideapp-nextjs
git clone https://github.com/yourusername/grouprideapp-nextjs.git
cd grouprideapp-nextjs
```

### 2. Initialize Next.js Project
```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"
```

### 3. Install Additional Dependencies
```bash
npm install @supabase/supabase-js @tanstack/react-query
npm install @radix-ui/react-avatar @radix-ui/react-card @radix-ui/react-button
npm install lucide-react date-fns clsx tailwind-merge
npm install class-variance-authority
```

### 4. Environment Setup
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Migration Progress

- [ ] Project setup
- [ ] RideCard component migration
- [ ] Supabase client setup
- [ ] Authentication setup
- [ ] Database schema migration