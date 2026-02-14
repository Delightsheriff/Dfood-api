# Food Delivery API

A comprehensive backend API for a food delivery platform built with Node.js, Express, TypeScript, and MongoDB. Features include user authentication, restaurant management, order processing, and Paystack payment integration.

## Features

### Authentication & Authorization

- Email/password authentication with JWT
- Google OAuth integration
- Role-based access control (Customer, Vendor, Admin)
- Forgot password with OTP verification
- Secure password hashing with bcrypt

### User Management

- Profile management with image uploads
- Multiple delivery addresses with geolocation
- Payment methods (Cash on Delivery + Card via Paystack)
- Order history and tracking

### Restaurant & Menu

- Restaurant profiles with multiple images
- Dynamic open/closed status based on hours
- Menu management with multi-category support
- Food item images and details

### Orders & Payments

- Server-side price validation
- Paystack card payment integration
- Cash on delivery option
- Order status tracking
- Order cancellation (pending orders only)

### Additional Features

- Food & restaurant search
- Category browsing
- Favorites/wishlist
- Redis caching for performance
- Cloudinary image storage

---

## Prerequisites

- Node.js >= 18.x
- MongoDB >= 6.x
- Redis (Upstash or local)
- Cloudinary account
- Paystack account (for payments)
- Google OAuth credentials (optional)

---

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd food-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/food-api

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars-long-change-this
JWT_EXPIRE=7d

# Redis (Upstash recommended)
REDIS_URL=rediss://default:your-password@your-host.upstash.io:6379

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
CLIENT_URL=http://localhost:3000

# Paystack
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key

# Email (Optional - for OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 4. Seed Data

```bash
# Create admin account
npm run seed:admin

# Create food categories
npm run seed:categories
```

---

## Running the Application

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

---

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication Endpoints

#### Sign Up (Customer)

```http
POST /auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Sign In

```http
POST /auth/signin
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Google OAuth

```http
GET /auth/google
```

#### Forgot Password

```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Verify OTP

```http
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "1234"
}
```

#### Reset Password

```http
POST /auth/reset-password
Authorization: Bearer {resetToken}
Content-Type: application/json

{
  "newPassword": "newPassword123"
}
```

#### Get Session

```http
GET /auth/session
Authorization: Bearer {token}
```

---

### Profile Endpoints

#### Get Profile

```http
GET /profile
Authorization: Bearer {token}
```

#### Update Profile

```http
PATCH /profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Updated",
  "phone": "+2348012345678"
}
```

#### Update Profile Image

```http
POST /profile/image
Authorization: Bearer {token}
Content-Type: multipart/form-data

image: <file>
```

#### Delete Profile Image

```http
DELETE /profile/image
Authorization: Bearer {token}
```

---

### Category Endpoints

#### Get All Categories

```http
GET /categories
```

#### Get Category by ID

```http
GET /categories/{id}
```

#### Create Category (Admin Only)

```http
POST /categories
Authorization: Bearer {adminToken}
Content-Type: multipart/form-data

name: Rice Dishes
image: <file>
```

#### Update Category (Admin Only)

```http
PATCH /categories/{id}
Authorization: Bearer {adminToken}
Content-Type: multipart/form-data

name: Rice Dishes Updated
image: <file>
```

#### Delete Category (Admin Only)

```http
DELETE /categories/{id}
Authorization: Bearer {adminToken}
```

---

### Restaurant Endpoints

#### Get All Restaurants

```http
GET /restaurants?isOpen=true
```

#### Get Restaurant by ID

```http
GET /restaurants/{id}
```

#### Create Restaurant (Becomes Vendor)

```http
POST /restaurants
Authorization: Bearer {token}
Content-Type: multipart/form-data

name: Mama's Kitchen
description: Authentic Nigerian cuisine
address: 45 Allen Avenue, Lagos
deliveryFee: 500
openingTime: 08:00
closingTime: 22:00
images: <file>
images: <file>
```

#### Get My Restaurant (Vendor Only)

```http
GET /restaurants/my/restaurant
Authorization: Bearer {vendorToken}
```

#### Update Restaurant (Vendor Only)

```http
PATCH /restaurants/{id}
Authorization: Bearer {vendorToken}
Content-Type: multipart/form-data

name: Updated Name
deliveryFee: 600
images: <file>
```

#### Delete Restaurant Image (Vendor Only)

```http
DELETE /restaurants/{id}/images
Authorization: Bearer {vendorToken}
Content-Type: application/json

{
  "imageUrl": "https://res.cloudinary.com/..."
}
```

#### Delete Restaurant (Vendor Only)

```http
DELETE /restaurants/{id}
Authorization: Bearer {vendorToken}
```

---

### Food Item Endpoints

#### Get Food Item by ID

```http
GET /food-items/{id}
```

#### Get Food Items by Restaurant

```http
GET /food-items/restaurant/{restaurantId}
```

#### Get Food Items by Category

```http
GET /food-items/category/{categoryId}
```

#### Create Food Item (Vendor Only)

```http
POST /food-items
Authorization: Bearer {vendorToken}
Content-Type: multipart/form-data

name: Jollof Rice with Chicken
description: Authentic Nigerian jollof rice
price: 2500
categoryIds: [categoryId1, categoryId2]
calories: 650
images: <file>
images: <file>
```

#### Get My Food Items (Vendor Only)

```http
GET /food-items/my/items
Authorization: Bearer {vendorToken}
```

#### Update Food Item (Vendor Only)

```http
PATCH /food-items/{id}
Authorization: Bearer {vendorToken}
Content-Type: multipart/form-data

price: 3000
images: <file>
```

#### Delete Food Item Image (Vendor Only)

```http
DELETE /food-items/{id}/images
Authorization: Bearer {vendorToken}
Content-Type: application/json

{
  "imageUrl": "https://res.cloudinary.com/..."
}
```

#### Delete Food Item (Vendor Only)

```http
DELETE /food-items/{id}
Authorization: Bearer {vendorToken}
```

---

### Search Endpoint

```http
GET /search?q=jollof
```

**Response:**

```json
{
  "success": true,
  "data": {
    "foods": [...],
    "restaurants": [...]
  }
}
```

---

### Favorites Endpoints

#### Get All Favorites

```http
GET /favorites
Authorization: Bearer {token}
```

#### Add to Favorites

```http
POST /favorites/{foodItemId}
Authorization: Bearer {token}
```

#### Remove from Favorites

```http
DELETE /favorites/{foodItemId}
Authorization: Bearer {token}
```

#### Check if Favorited

```http
GET /favorites/{foodItemId}/check
Authorization: Bearer {token}
```

---

### Address Endpoints

#### Get All Addresses

```http
GET /addresses
Authorization: Bearer {token}
```

#### Get Default Address

```http
GET /addresses/default
Authorization: Bearer {token}
```

#### Create Address

```http
POST /addresses
Authorization: Bearer {token}
Content-Type: application/json

{
  "label": "Home",
  "street": "15 Admiralty Way, Lekki Phase 1",
  "city": "Lagos",
  "state": "Lagos",
  "coordinates": {
    "lat": 6.4474,
    "lng": 3.4700
  }
}
```

#### Update Address

```http
PATCH /addresses/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "label": "Office",
  "street": "23 Marina Street"
}
```

#### Set Default Address

```http
PATCH /addresses/{id}/default
Authorization: Bearer {token}
```

#### Delete Address

```http
DELETE /addresses/{id}
Authorization: Bearer {token}
```

---

### Payment Method Endpoints

#### Get All Payment Methods

```http
GET /payment-methods
Authorization: Bearer {token}
```

**Response includes cash + saved cards:**

```json
{
  "success": true,
  "data": {
    "paymentMethods": [
      { "_id": "cash", "type": "cash", "isDefault": false },
      { "_id": "card123", "type": "card", "cardLast4": "4081", ... }
    ]
  }
}
```

#### Add Card

```http
POST /payment-methods/card
Authorization: Bearer {token}
Content-Type: application/json

{
  "reference": "paystack_transaction_reference"
}
```

#### Set Default Payment Method

```http
PATCH /payment-methods/{id}/default
Authorization: Bearer {token}
```

#### Delete Payment Method

```http
DELETE /payment-methods/{id}
Authorization: Bearer {token}
```

---

### Order Endpoints

#### Create Order

```http
POST /orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "restaurantId": "restaurant_id",
  "items": [
    { "foodItemId": "food_id1", "quantity": 2 },
    { "foodItemId": "food_id2", "quantity": 1 }
  ],
  "addressId": "address_id",
  "paymentMethodId": "card_id or 'cash'",
  "customerNotes": "Please ring doorbell twice"
}
```

#### Get My Orders

```http
GET /orders
Authorization: Bearer {token}
```

#### Get Order by ID

```http
GET /orders/{id}
Authorization: Bearer {token}
```

#### Get Order by Number

```http
GET /orders/number/{orderNumber}
Authorization: Bearer {token}
```

#### Cancel Order (Pending Only)

```http
PATCH /orders/{id}/cancel
Authorization: Bearer {token}
```

---

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer {token}
```

### Roles

- **Customer**: Can browse, order, manage profile
- **Vendor**: Can manage restaurant and menu
- **Admin**: Can manage categories, create admins

---

## Database Schema

### User

- Basic info (name, email, password)
- Role (customer, vendor, admin)
- Profile image
- Google OAuth support

### Restaurant

- Owner (vendor)
- Business details
- Multiple images
- Operating hours
- Auto-computed open/closed status
- Tags (derived from menu)

### Food Item

- Restaurant reference
- Multi-category support (1-3 categories)
- Multiple images
- Pricing
- Ratings

### Order

- Customer & restaurant references
- Item snapshots (prevent price changes)
- Delivery address
- Payment method & status
- Order status tracking
- Unique order number

### Address

- User reference
- Full address with coordinates
- Default flag

### Payment Method

- User reference
- Type (cash/card)
- Encrypted Paystack authorization code
- Card metadata (last4, brand, etc.)

### Favorite

- User & food item reference
- Timestamp

---

## ⚡ Performance Optimizations

- **Redis caching** for:
  - Categories (24h TTL)
  - Restaurant details (1h TTL)
  - Food items (30min TTL)
  - Search results (10min TTL)
  - Favorites (30min TTL)

- **MongoDB indexes** on:
  - User email & role
  - Restaurant owner & tags
  - Food item categories
  - Order customer, restaurant, status
  - Compound indexes for common queries

- **Image optimization** via Cloudinary:
  - Auto format (WebP when supported)
  - Auto quality
  - Max dimensions (1200x1200)

---

## Security Features

- Helmet.js for HTTP headers
- CORS enabled
- Rate limiting on auth endpoints
- Password hashing with bcrypt (12 rounds)
- JWT with expiration
- Input validation with Zod
- Server-side price validation
- Paystack tokenization (no raw card storage)
- Authorization code encryption

---

## Testing

### Paystack Test Cards

```
Success: 4084084084084081
Insufficient Funds: 5061020000000000094
```

### Admin Credentials (After Seeding)

```
Email: admin@foodapp.com
Password: Admin123!@#
```

---

## Project Structure

```
food-api/
├── src/
│   ├── config/          # Environment, database, Redis, Passport
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, error handling, uploads, rate limiting
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types & Zod schemas
│   ├── utils/           # Helper functions
│   ├── scripts/         # Seed scripts
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## Known Limitations (V1)

- No real-time order tracking (WebSockets)
- No delivery driver management
- No vendor order management UI (coming in V2)
- No push notifications
- OTP emails via console.log (needs SMTP setup)
- No Paystack refund implementation (marked for V2)
- Single restaurant per vendor

---

## Roadmap (V2)

- [ ] Vendor dashboard with order management
- [ ] Delivery driver role & assignment
- [ ] Real-time order tracking (Socket.io)
- [ ] Push notifications (FCM)
- [ ] Email service integration
- [ ] Review & rating system
- [ ] Paystack refund automation
- [ ] Multi-restaurant support per vendor
- [ ] Analytics & reporting
- [ ] Promo codes & discounts

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## License

This project is licensed under the MIT License.

---

## Author

Built with ❤️ for Nigerian food delivery

---

## Acknowledgments

- Paystack for payment processing
- Cloudinary for image management
- Upstash for Redis hosting
- MongoDB Atlas for database hosting

---

## Support

For issues or questions, please open an issue on GitHub.
