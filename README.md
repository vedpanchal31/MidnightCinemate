# MidnightCinemate - Movie Booking System

A modern, full-stack movie booking application built with Next.js, PostgreSQL, and Stripe for seamless cinema ticket purchasing experience.

## 🎬 Overview

MidnightCinemate is a comprehensive movie booking platform that allows users to:

- Browse movies from TMDB API
- Select show times and seats
- Book tickets with secure Stripe payments
- Manage user accounts and bookings
- Receive email confirmations

## 🚀 Features

### User Features

- **Authentication**: Email/password login, Google OAuth integration
- **Movie Browsing**: Real-time movie data from TMDB API
- **Seat Selection**: Interactive cinema seat map
- **Booking Management**: View, cancel, and manage bookings
- **Payment Processing**: Secure Stripe integration
- **Email Notifications**: Booking confirmations and OTP verification

### Admin Features

- **Movie Management**: Sync movies from TMDB
- **Show Time Management**: Create and manage time slots
- **Booking Analytics**: Track sales and occupancy
- **User Management**: Monitor user accounts

### Technical Features

- **Responsive Design**: Mobile-first approach
- **Real-time Updates**: Live seat availability
- **Type Safety**: Full TypeScript implementation
- **Database Migrations**: Version-controlled schema changes
- **API Documentation**: RESTful API with proper error handling

## 🛠 Tech Stack

### Frontend

- **Next.js 14+**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Lucide Icons**: Modern icon library
- **React Hook Form**: Form management
- **Zustand**: State management

### Backend

- **Next.js API Routes**: Server-side API
- **PostgreSQL**: Primary database
- **Stripe**: Payment processing
- **Nodemailer**: Email services
- **bcryptjs**: Password hashing

### External APIs

- **TMDB API**: Movie data and information
- **Google OAuth**: Authentication
- **Stripe API**: Payment processing

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)
- Stripe account
- TMDB API key
- Google OAuth credentials
- Email service (SMTP)

## 🗄 Database Schema

### Core Tables

- **User**: User accounts and authentication
- **OTP**: One-time password verification
- **Timeslot**: Movie show times and schedules
- **MovieBooking**: Booking records and payments
- **BookingSeat**: Individual seat reservations
- **TimeSlotApiLog**: API response logging

### Key Features

- Automatic timestamp management with triggers
- Consistent snake_case column naming
- Foreign key constraints and indexes
- JSONB storage for API responses

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd MidnightCinemate
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb midnight_cinemate

# Run complete setup migration
psql -d midnight_cinemate -f database/migrations/complete_setup_migration.sql
```

### 3. Environment Variables

Create `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/midnight_cinemate"

# TMDB API
TMDB_API_KEY="your_tmdb_api_key"
TMDB_BASE_URL="https://api.themoviedb.org/3"

# Stripe
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Email Service
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"

# JWT
JWT_SECRET="your_jwt_secret_key"
JWT_REFRESH_SECRET="your_jwt_refresh_secret"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret"
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── movies/         # Movie pages
│   │   └── booking/        # Booking pages
│   ├── components/         # Reusable components
│   │   ├── ui/            # UI components
│   │   ├── forms/         # Form components
│   │   └── layout/        # Layout components
│   ├── lib/               # Utility libraries
│   │   ├── database/      # Database services
│   │   ├── email/         # Email services
│   │   ├── auth/          # Authentication utilities
│   │   └── utils/         # General utilities
│   ├── hooks/             # Custom React hooks
│   ├── store/             # State management
│   └── types/             # TypeScript types
├── database/
│   ├── migrations/        # Database migrations
│   └── seeds/            # Seed data
├── public/               # Static assets
└── docs/                # Documentation
```

## 🔧 Development

### Database Migrations

```bash
# Create new migration
npm run migration:create <migration_name>

# Run migrations
npm run migration:run

# Rollback migration
npm run migration:rollback
```

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Run tests
npm run test
```

### API Development

- All API routes are in `src/app/api/`
- Follow RESTful conventions
- Include proper error handling
- Use TypeScript for type safety

## 🎨 UI Components

### Design System

- **Colors**: Tailwind CSS color palette
- **Typography**: Geist font family
- **Spacing**: Consistent spacing scale
- **Components**: Reusable UI components

### Key Components

- **MovieCard**: Movie display component
- **SeatMap**: Interactive seat selection
- **BookingForm**: Booking details form
- **PaymentForm**: Stripe payment integration
- **UserAuth**: Login/signup forms

## 🔐 Authentication

### Email/Password

- bcryptjs for password hashing
- JWT tokens for session management
- OTP verification for email confirmation

### Google OAuth

- NextAuth.js integration
- Secure token handling
- Profile synchronization

### Security Features

- Rate limiting on API endpoints
- Input validation and sanitization
- CSRF protection
- Secure cookie handling

## 💳 Payment Integration

### Stripe Setup

1. Create Stripe account
2. Get API keys
3. Set up webhooks
4. Configure payment methods

### Payment Flow

1. User selects seats
2. Creates booking session
3. Redirects to Stripe Checkout
4. Webhook confirms payment
5. Booking status updated

## 📧 Email Services

### Email Types

- **Welcome emails**: New user registration
- **Booking confirmations**: Successful bookings
- **OTP verification**: Email verification codes
- **Password reset**: Account recovery

### SMTP Configuration

- Gmail SMTP (recommended for development)
- SendGrid (production)
- AWS SES (enterprise)

## 🚀 Deployment

### Environment Setup

```bash
# Production build
npm run build

# Start production server
npm start
```

### Deployment Options

- **Vercel**: Recommended for Next.js
- **AWS**: Full cloud infrastructure
- **DigitalOcean**: Affordable hosting
- **Railway**: Simple deployment

### Environment Variables

Ensure all environment variables are set in production:

- Database connection
- API keys
- OAuth credentials
- Payment keys

## 🧪 Testing

### Test Types

- **Unit tests**: Component and utility testing
- **Integration tests**: API endpoint testing
- **E2E tests**: Full user flows

### Testing Commands

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 📊 Monitoring & Analytics

### Application Monitoring

- **Error tracking**: Sentry integration
- **Performance monitoring**: Web Vitals
- **User analytics**: Google Analytics

### Business Metrics

- **Booking conversion**: Track ticket sales
- **User engagement**: Monitor user activity
- **Revenue tracking**: Financial analytics

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Code review and merge

### Code Standards

- Follow TypeScript best practices
- Use ESLint and Prettier
- Write meaningful commit messages
- Include tests for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

- **Database connection**: Check DATABASE_URL
- **API errors**: Verify API keys
- **Payment failures**: Check Stripe configuration
- **Email issues**: Verify SMTP settings

### Getting Help

- Check existing issues on GitHub
- Review documentation
- Join community Discord
- Contact support team

## 🔄 Version History

### v1.0.0 (Current)

- Basic movie booking functionality
- User authentication
- Stripe payment integration
- Email notifications

### Upcoming Features

- Mobile app development
- Advanced analytics dashboard
- Multi-cinema support
- Loyalty program integration

---

**Built with ❤️ for movie lovers everywhere**
