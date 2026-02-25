# DFood API

Backend for the DFood food delivery platform. Built with Node.js, Express, TypeScript, and MongoDB.

**Connected apps:**

- 📱 Mobile App — [Dfood-app](https://github.com/Delightsheriff/Dfood-app)
- 🖥️ Admin Dashboard — [Dfood-admin](https://github.com/Delightsheriff/Dfood-admin)

---

## Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express v5
- **Database:** MongoDB (Mongoose)
- **Cache:** Redis (Upstash or local)
- **Auth:** JWT + Google OAuth (Passport.js)
- **Payments:** Paystack
- **Storage:** Cloudinary
- **Push Notifications:** Firebase Admin + Expo Push API
- **Email:** Resend

---

## Features

### Auth

- Email/password + JWT
- Google OAuth (customers only)
- Role-based access: Customer · Vendor · Admin
- Forgot password via OTP (4-digit, 15min expiry, delivered by email)
- Transactional emails via Resend (welcome, OTP, reset confirmation)

### Customers

- Profile management + image uploads
- Multiple delivery addresses with coordinates
- Saved payment methods (cash + Paystack cards)
- Orders: create, track, cancel, view history
- Favorites (food items)
- Search (food + restaurants)

### Vendors

- Dedicated signup flow (creates user + restaurant atomically)
- Restaurant management: details, hours, images
- Menu management: food items with multi-category support
- Order management: view incoming orders, update status with validation
- Order stats dashboard
- Analytics: revenue, order volume, top items

### Admins

- Create admin accounts
- User management
- Category management
- Order oversight
- Platform-wide analytics

### Notifications

- **Push notifications** to mobile (Expo tokens, Firebase-backed)
  - Sent on order status changes
  - Invalid token pruning (DeviceNotRegistered handling)
- **In-app notifications** stored in DB (90-day TTL)
  - New orders (vendor)
  - Order status updates (customer)
  - New vendor signups (admin)

### Performance

- Redis caching: categories (24h), restaurants (1h), food items (30m), search (10m), favorites (30m)
- MongoDB compound indexes on high-traffic queries
- Cloudinary auto-format (WebP) + auto-quality

### Security

- Helmet.js
- CORS
- Rate limiting on auth endpoints
- Bcrypt (12 rounds)
- Zod input validation
- Server-side price validation on orders
- Paystack authorization code encryption (no raw card storage)

---

## Getting Started

### Prerequisites

- Node.js >= 18.x
- MongoDB >= 6.x
- Redis (Upstash or local)
- Cloudinary account
- Paystack account
- Firebase project with service account
- Resend account + verified sending domain

### Install

```bash
git clone https://github.com/Delightsheriff/Dfood-api
cd food-api
npm install
```

### Environment

Copy `.env.example` to `.env` and fill in values:

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/food-api

# JWT
JWT_SECRET=your-secret-min-32-chars
JWT_EXPIRE=7d

# Redis
REDIS_URL=rediss://default:password@host.upstash.io:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
CLIENT_URL=http://localhost:3000

# Paystack
PAYSTACK_SECRET_KEY=sk_test_
PAYSTACK_PUBLIC_KEY=pk_test_

# Firebase (stringified service account JSON)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Resend
RESEND_API_KEY=re_
EMAIL_FROM=DFood <noreply@yourdomain.com>
```

### Run

```bash
# Development
npm run dev

# Production
npm run build && npm start

# Seed admin account
npm run seed:admin
```

---

## API Reference

**Base URL:** `http://localhost:4000/api`

All protected routes require:

```
Authorization: Bearer <token>
```

---

### Auth — `/api/auth`

| Method | Endpoint           | Auth        | Description                  |
| ------ | ------------------ | ----------- | ---------------------------- |
| POST   | `/signup`          | —           | Customer signup              |
| POST   | `/signin`          | —           | Sign in (any role)           |
| GET    | `/google`          | —           | Google OAuth redirect        |
| GET    | `/google/callback` | —           | OAuth callback               |
| GET    | `/session`         | ✅          | Get current user             |
| POST   | `/forgot-password` | —           | Send OTP to email            |
| POST   | `/verify-otp`      | —           | Verify OTP → get reset token |
| POST   | `/reset-password`  | Reset token | Set new password             |
| POST   | `/admin/create`    | Admin       | Create admin account         |

**Signup body:**

```json
{ "name": "John Doe", "email": "john@example.com", "password": "password123" }
```

**Forgot password:** sends a 4-digit OTP to the user's email via Resend.
**Verify OTP:** returns a short-lived `resetToken` (5min) used for the reset call.

---

### Vendor Auth — `/api/vendor/auth`

| Method | Endpoint  | Auth | Description                                   |
| ------ | --------- | ---- | --------------------------------------------- |
| POST   | `/signup` | —    | Create vendor account + restaurant atomically |

```json
{
  "firstName": "Amaka",
  "lastName": "Obi",
  "email": "amaka@restaurant.com",
  "phone": "+2348012345678",
  "password": "password123",
  "restaurantName": "Mama's Kitchen",
  "restaurantAddress": "45 Allen Ave, Lagos",
  "deliveryFee": 500,
  "openingTime": "08:00",
  "closingTime": "22:00"
}
```

---

### Profile — `/api/profile`

| Method | Endpoint | Auth | Description                                  |
| ------ | -------- | ---- | -------------------------------------------- |
| GET    | `/`      | ✅   | Get profile                                  |
| PATCH  | `/`      | ✅   | Update name/phone                            |
| POST   | `/image` | ✅   | Upload profile image (`multipart/form-data`) |
| DELETE | `/image` | ✅   | Remove profile image                         |

---

### Restaurants — `/api/restaurants`

| Method | Endpoint         | Auth   | Description                                 |
| ------ | ---------------- | ------ | ------------------------------------------- |
| GET    | `/`              | —      | List all restaurants (`?isOpen=true`)       |
| GET    | `/:id`           | —      | Get restaurant by ID                        |
| GET    | `/my/restaurant` | Vendor | Get own restaurant                          |
| POST   | `/`              | ✅     | Create restaurant (upgrades user to vendor) |
| PATCH  | `/:id`           | Vendor | Update restaurant                           |
| DELETE | `/:id/images`    | Vendor | Delete a restaurant image                   |
| DELETE | `/:id`           | Vendor | Delete restaurant                           |

---

### Food Items — `/api/food-items`

| Method | Endpoint                    | Auth   | Description                              |
| ------ | --------------------------- | ------ | ---------------------------------------- |
| GET    | `/:id`                      | —      | Get food item                            |
| GET    | `/restaurant/:restaurantId` | —      | Items by restaurant                      |
| GET    | `/category/:categoryId`     | —      | Items by category                        |
| GET    | `/my/items`                 | Vendor | Get vendor's items                       |
| POST   | `/`                         | Vendor | Create food item (`multipart/form-data`) |
| PATCH  | `/:id`                      | Vendor | Update food item                         |
| DELETE | `/:id/images`               | Vendor | Delete food item image                   |
| DELETE | `/:id`                      | Vendor | Delete food item                         |

---

### Categories — `/api/categories`

| Method | Endpoint | Auth  | Description                  |
| ------ | -------- | ----- | ---------------------------- |
| GET    | `/`      | —     | List all categories          |
| GET    | `/:id`   | —     | Get category                 |
| POST   | `/`      | Admin | Create category (with image) |
| PATCH  | `/:id`   | Admin | Update category              |
| DELETE | `/:id`   | Admin | Delete category              |

---

### Orders — `/api/orders`

| Method | Endpoint               | Auth     | Description                          |
| ------ | ---------------------- | -------- | ------------------------------------ |
| POST   | `/`                    | Customer | Place order                          |
| GET    | `/`                    | Customer | Order history                        |
| GET    | `/:id`                 | Customer | Get order (by `_id` or order number) |
| GET    | `/number/:orderNumber` | Customer | Get order by number                  |
| PATCH  | `/:id/cancel`          | Customer | Cancel order (pending only)          |

```json
// POST /orders
{
  "restaurantId": "...",
  "items": [{ "foodItemId": "...", "quantity": 2 }],
  "addressId": "...",
  "paymentMethodId": "card_id or 'cash'",
  "customerNotes": "Ring doorbell twice"
}
```

---

### Vendor Orders — `/api/vendor/orders`

| Method | Endpoint      | Auth   | Description                                  |
| ------ | ------------- | ------ | -------------------------------------------- |
| GET    | `/`           | Vendor | List restaurant's orders (`?status=pending`) |
| GET    | `/stats`      | Vendor | Order statistics                             |
| GET    | `/:id`        | Vendor | Get single order                             |
| PATCH  | `/:id/status` | Vendor | Update order status                          |

**Valid status transitions:**

```
pending → confirmed | cancelled
confirmed → preparing | cancelled
preparing → out_for_delivery
out_for_delivery → delivered
```

Updating status triggers: push notification + in-app notification to customer.

---

### Addresses — `/api/addresses`

| Method | Endpoint       | Auth | Description         |
| ------ | -------------- | ---- | ------------------- |
| GET    | `/`            | ✅   | List addresses      |
| GET    | `/default`     | ✅   | Get default address |
| POST   | `/`            | ✅   | Create address      |
| PATCH  | `/:id`         | ✅   | Update address      |
| PATCH  | `/:id/default` | ✅   | Set as default      |
| DELETE | `/:id`         | ✅   | Delete address      |

---

### Payment Methods — `/api/payment-methods`

| Method | Endpoint       | Auth | Description                       |
| ------ | -------------- | ---- | --------------------------------- |
| GET    | `/`            | ✅   | List methods (cash + saved cards) |
| POST   | `/card`        | ✅   | Add card via Paystack reference   |
| PATCH  | `/:id/default` | ✅   | Set default                       |
| DELETE | `/:id`         | ✅   | Remove method                     |

---

### Notifications — `/api/notifications`

| Method | Endpoint         | Auth | Description                                     |
| ------ | ---------------- | ---- | ----------------------------------------------- |
| GET    | `/`              | ✅   | Get notifications (`?unreadOnly=true&limit=50`) |
| GET    | `/unread-count`  | ✅   | Unread badge count                              |
| PATCH  | `/:id/read`      | ✅   | Mark one as read                                |
| PATCH  | `/mark-all-read` | ✅   | Mark all as read                                |
| DELETE | `/:id`           | ✅   | Delete notification                             |

---

### Device Tokens — `/api/device-tokens`

| Method | Endpoint      | Auth | Description              |
| ------ | ------------- | ---- | ------------------------ |
| POST   | `/register`   | ✅   | Register Expo push token |
| DELETE | `/unregister` | ✅   | Remove push token        |

```json
// POST /device-tokens/register
{ "token": "ExponentPushToken[xxxxxx]" }
```

---

### Search — `/api/search`

```http
GET /api/search?q=jollof
```

Returns matched food items and restaurants.

---

### Favorites — `/api/favorites`

| Method | Endpoint             | Auth | Description           |
| ------ | -------------------- | ---- | --------------------- |
| GET    | `/`                  | ✅   | Get all favorites     |
| POST   | `/:foodItemId`       | ✅   | Add to favorites      |
| DELETE | `/:foodItemId`       | ✅   | Remove from favorites |
| GET    | `/:foodItemId/check` | ✅   | Check if favorited    |

---

### Analytics

| Method | Endpoint                | Auth   | Description                   |
| ------ | ----------------------- | ------ | ----------------------------- |
| GET    | `/api/vendor/analytics` | Vendor | Revenue, orders, top items    |
| GET    | `/api/admin/analytics`  | Admin  | Platform-wide stats           |
| GET    | `/api/admin/search`     | Admin  | Dashboard cross-entity search |

---

### Admin

| Method | Endpoint                       | Auth  | Description         |
| ------ | ------------------------------ | ----- | ------------------- |
| GET    | `/api/admin/users`             | Admin | List all users      |
| PATCH  | `/api/admin/users/:id`         | Admin | Update user         |
| GET    | `/api/admin/orders`            | Admin | All orders          |
| GET    | `/api/admin/orders/:id`        | Admin | Get order           |
| PATCH  | `/api/admin/orders/:id/status` | Admin | Update order status |

---

## Error Responses

All errors follow this shape:

```json
{
  "success": false,
  "message": "Error description"
}
```

| Status | Type                   |
| ------ | ---------------------- |
| 400    | Validation error       |
| 401    | Unauthorized           |
| 403    | Forbidden (wrong role) |
| 404    | Not found              |
| 409    | Conflict (duplicate)   |
| 500    | Server error           |

---

## Testing

**Paystack test cards:**

```
Success:            4084 0840 8408 4081
Insufficient funds: 5061 0200 0000 0000 094
```

**Seeded admin:**

```
Email:    admin@foodapp.com
Password: Admin123!@#
```

---

## Scripts

```bash
npm run dev              # Start dev server with hot reload
npm run build            # Compile TypeScript
npm start                # Run compiled output
npm run seed:admin       # Create default admin account
```
