# TeeDesigner - Custom T-Shirt Design & Ordering Platform

A full-stack web application for designing and ordering custom t-shirts with an Instagram-style canvas editor, AI design generation (mocked), and complete e-commerce functionality.

## Features

- **Design Editor**: Fabric.js-powered canvas with drag & drop image upload, text tools, shapes, filters, and layer management
- **AI Design Generation**: Mock AI image generation (ready to connect to real APIs)
- **T-Shirt Customization**: Size, color, style, material, and print area selection with real-time pricing
- **Shopping Cart**: Full cart management with discount codes
- **Checkout**: Address management, shipping selection, and Stripe payment integration
- **User Accounts**: Registration, login, profile management, order history, and saved designs

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Fabric.js (canvas editor)
- Tailwind CSS
- Zustand (state management)
- React Router v6
- Stripe Elements

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- SQLite (easily migrated to PostgreSQL)
- JWT Authentication
- Stripe API

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
cd tshirt-designer
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Server (`server/.env`):
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
PORT=3001
```

Client (`client/.env`):
```env
VITE_API_URL=http://localhost:3001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

4. Initialize the database:
```bash
npm run db:migrate
```

5. (Optional) Seed discount codes:
```bash
cd server && npx tsx prisma/seed.ts
```

6. Start the development servers:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Testing Payments

Use Stripe test card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

## Discount Codes

Pre-seeded discount codes:
- `WELCOME10` - 10% off (min. $20)
- `SAVE5` - $5 off (min. $30)
- `FIRST20` - 20% off (min. $50)

## Project Structure

```
tshirt-designer/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   │   ├── editor/        # Canvas editor
│   │   │   ├── cart/          # Shopping cart
│   │   │   ├── checkout/      # Checkout flow
│   │   │   ├── auth/          # Authentication
│   │   │   └── ui/            # Reusable components
│   │   ├── stores/            # Zustand stores
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   └── types/             # TypeScript types
├── server/                    # Express backend
│   ├── src/
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth middleware
│   │   └── utils/             # Utilities
│   └── prisma/                # Database schema
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Designs
- `GET /api/designs` - Get user's designs
- `POST /api/designs` - Create design
- `PUT /api/designs/:id` - Update design
- `DELETE /api/designs/:id` - Delete design

### Cart
- `GET /api/cart` - Get cart
- `POST /api/cart/items` - Add to cart
- `PUT /api/cart/items/:id` - Update quantity
- `DELETE /api/cart/items/:id` - Remove item

### Orders
- `GET /api/orders` - Get order history
- `POST /api/orders` - Create order

### Payments
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/calculate` - Calculate totals

## Deployment

### Frontend
Deploy to Vercel or Netlify:
```bash
cd client && npm run build
```

### Backend
Deploy to Railway, Render, or Fly.io:
- Set environment variables
- For production, migrate to PostgreSQL

## Connecting Real AI

To connect real AI image generation:

1. Get API key from OpenAI (DALL-E), Replicate (Stable Diffusion), or Hugging Face
2. Update `server/src/routes/ai.ts` to call the real API
3. Add appropriate error handling and rate limiting

## License

MIT
