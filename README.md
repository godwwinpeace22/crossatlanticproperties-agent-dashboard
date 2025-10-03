# Multi-level marketing dashboard

## Overview

This is a comprehensive Multi-Level Marketing (MLM) dashboard for CrossAtlanticProperties, built with Next.js, Supabase, and Resend email service.

### Features

- 🏘️ **Property Management** - Browse, filter, and manage property listings
- 👥 **Agent Hierarchy** - Multi-level network visualization and management
- 💰 **Commission Tracking** - Automated commission calculation and history
- 📊 **Analytics Dashboard** - Market analysis and performance metrics
- 💳 **Payment Processing** - Installment tracking and payment submissions
- 🔔 **Notification System** - Real-time notifications with email delivery
- 🔐 **KYC Verification** - Identity verification workflow
- 📧 **Email Notifications** - Automated email delivery via Resend
- 🎯 **Referral System** - Unique referral codes and tracking
- 📱 **Responsive Design** - Mobile-friendly interface

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account and project
- Resend account for email notifications

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd v0-multi-level-marketing-dashboard

# Install dependencies
pnpm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Run development server
pnpm dev
```

Visit `http://localhost:3000` to see your application.

## Email Notifications Setup

This project includes a complete email notification system powered by Resend.

### Quick Setup (5 minutes)

1. **Get Resend API Key**
   - Sign up at [resend.com](https://resend.com)
   - Create an API key
2. **Configure Environment**

   ```bash
   # Add to .env.local
   RESEND_API_KEY=re_your_api_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Test Configuration**

   ```bash
   pnpm test:email
   ```

4. **Run Database Migration**

   - Open Supabase SQL Editor
   - Run `scripts/021_email_notifications.sql`

5. **Set Up Cron Job**
   - For Vercel: Add `vercel.json` (see docs)
   - For others: Use cron-job.org

📚 **Full Documentation**: See [RESEND_INTEGRATION_COMPLETE.md](./RESEND_INTEGRATION_COMPLETE.md)

## Project Structure

```
├── app/                      # Next.js app directory
│   ├── (main)/              # Public pages
│   ├── auth/                # Authentication pages
│   ├── dashboard/           # Dashboard pages
│   └── api/                 # API routes
├── components/              # React components
│   └── ui/                  # UI components
├── lib/                     # Utilities and helpers
│   ├── supabase/           # Supabase client
│   ├── email-notifications.ts  # Email service
│   └── types.ts            # TypeScript types
├── scripts/                 # Database migrations
└── public/                  # Static assets
```

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test:email   # Test email configuration
```

## Database Setup

All database migrations are in the `scripts/` directory. Run them in order:

1. `001_create_profiles.sql` - User profiles
2. `002_create_properties.sql` - Property listings
3. `003_create_agent_hierarchy.sql` - MLM structure
4. ... (continue in numerical order)
5. `021_email_notifications.sql` - Email queue system

## Environment Variables

Required variables in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Service (Resend)
RESEND_API_KEY=re_your_api_key

# Optional: Cron Job Security
CRON_SECRET=your-secret-key
```

## Deployment

Your project is live at:

**[https://vercel.com/godwwinpeace22s-projects/v0-multi-level-marketing-dashboard](https://vercel.com/godwwinpeace22s-projects/v0-multi-level-marketing-dashboard)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/VvOQyOIK2Vk](https://v0.app/chat/projects/VvOQyOIK2Vk)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
