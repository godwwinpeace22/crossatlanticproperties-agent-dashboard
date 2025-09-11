# MLM Dashboard - Local Setup Guide

## Prerequisites
- Node.js 18+ installed
- A Supabase account and project
- Git (for cloning the repository)

## Environment Variables Setup

1. **Copy the environment template:**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. **Get your Supabase credentials:**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the Project URL and anon/public key

3. **Update `.env.local` with your values:**
   \`\`\`env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard
   \`\`\`

## Database Setup

Run these SQL scripts **in order** in your Supabase SQL Editor:

### 1. Create Profiles Table
\`\`\`sql
-- Run: scripts/001_create_profiles.sql
-- Creates user profiles with admin/agent roles and auto-profile creation
\`\`\`

### 2. Create Properties Table
\`\`\`sql
-- Run: scripts/002_create_properties.sql
-- Creates property listings for agents to market
\`\`\`

### 3. Create Agent Hierarchy Table
\`\`\`sql
-- Run: scripts/003_create_agent_hierarchy.sql
-- Creates upline/downline relationships for MLM structure
\`\`\`

### 4. Create Payment Submissions Table
\`\`\`sql
-- Run: scripts/004_create_payment_submissions.sql
-- Creates payment submission workflow for admin approval
\`\`\`

### 5. Create Purchases Table
\`\`\`sql
-- Run: scripts/005_create_purchases.sql
-- Creates approved purchase records
\`\`\`

### 6. Create Commissions Table
\`\`\`sql
-- Run: scripts/006_create_commissions.sql
-- Creates commission tracking for all levels
\`\`\`

### 7. Create Commission Settings Table
\`\`\`sql
-- Run: scripts/007_create_commission_settings.sql
-- Creates configurable commission rates (default: 10%, 5%, 2.5%, 1%, 0.5%)
\`\`\`

## Installation & Running

1. **Install dependencies:**
   \`\`\`bash
   npm install
   # or
   pnpm install
   \`\`\`

2. **Run the development server:**
   \`\`\`bash
   npm run dev
   # or
   pnpm dev
   \`\`\`

3. **Access the application:**
   - Open [http://localhost:3000](http://localhost:3000)
   - Sign up for a new account (automatically creates agent profile)
   - First user can be promoted to admin via Supabase dashboard

## Key Features

- **Authentication:** Email/password with automatic profile creation
- **Role Management:** Admin and Agent roles with different permissions
- **MLM Structure:** Multi-level commission tracking and agent hierarchy visualization
- **Property Management:** CRUD operations for property listings (admin only)
- **Payment Processing:** Submission and approval workflow
- **Commission System:** Configurable multi-level commission rates
- **Network Visualization:** Interactive pyramid view using vis-network

## Default Admin Setup

To create your first admin user:
1. Sign up normally through the app
2. Go to Supabase Dashboard > Table Editor > profiles
3. Find your user record and change `role` from 'agent' to 'admin'
4. Refresh the app - you now have admin access

## Troubleshooting

- **Can't sign in after signup:** Email verification is disabled by default
- **Missing tables:** Ensure all SQL scripts are run in order
- **Permission errors:** Check RLS policies are enabled
- **Environment variables:** Verify all required vars are set in `.env.local`
