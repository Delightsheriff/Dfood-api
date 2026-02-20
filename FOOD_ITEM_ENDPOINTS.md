# Food Item Endpoints - Complete API Documentation

## Overview
The Food Item API provides endpoints for managing food items within restaurants. Vendors can create and manage food items for their restaurants, while all users can view available food items. Profile completion is required for vendor operations.

---

## 1. CREATE FOOD ITEM

### Endpoint
```
POST /api/food-items
```

### Authentication
- **Required:** Yes
- **Role Required:** VENDOR
- **Header:** `Authorization: Bearer <JWT_TOKEN>`
- **Additional Requirement:** Complete restaurant profile (images, address, description, hours)

### Request Format
```
Content-Type: multipart/form-data
```

### Request Body
```json
{
  "name": "string (min: 2, max: 100 characters)",
  "description": "string (min: 10, max: 500 characters)",
  "price": "number (min: 0, e.g., 2500 for ₦25.00)",
  "categoryIds": "array of strings (1-3 category IDs, required)",
  "calories": "number (optional, min: 0)"
}
```

### Request Files
```
images: File[] (required, at least 1 image, multipart)
```

### Response - Success (201 Created)
```json
{
  "success": true,
  "data": {
    "foodItem": {
      "_id": "507f1f77bcf86cd799439011",
      "restaurantId": "507f1f77bcf86cd799439012",
      "name": "Margherita Pizza",
      "description": "Classic pizza with tomato, mozzarella, and basil",
      "images": [
        "https://res.cloudinary.com/...",
        "https://res.cloudinary.com/..."
      ],
      "price": 4500,
      "categoryIds": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"],
      "calories": 250,
      "rating": 0,
      "totalReviews": 0,
      "createdAt": "2026-02-20T10:30:00.000Z",
      "updatedAt": "2026-02-20T10:30:00.000Z"
    }
  }
}
```

### Business Rules
- Vendor must have a complete restaurant profile
- At least 1 image required
- 1-3 categories must be assigned
- All categories must exist in database
- Restaurant tags automatically updated with new categories
- Maximum 5 images supported

### Error Responses
```json
// 400 - Missing images
{
  "error": "At least one food image is required"
}

// 400 - Validation error
{
  "error": "Validation failed: name must be between 2 and 100 characters"
}

// 400 - Invalid categories
{
  "error": "One or more invalid category IDs"
}

// 400 - Too many categories
{
  "error": "Maximum 3 categories allowed"
}

// 401 - Unauthorized
{
  "error": "No authorization token"
}

// 403 - Not a vendor
{
  "error": "Not authorized to perform this action"
}

// 403 - Incomplete profile
{
  "error": "Your restaurant profile is incomplete"
}

// 403 - No restaurant
{
  "error": "You must have a restaurant to create food items"
}
```

### Example Request (cURL)
```bash
curl -X POST http://localhost:3000/api/food-items \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "name=Margherita Pizza" \
  -F "description=Classic pizza with tomato, mozzarella, and basil" \
  -F "price=4500" \
  -F "categoryIds=507f1f77bcf86cd799439013" \
  -F "categoryIds=507f1f77bcf86cd799439014" \
  -F "calories=250" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

---

## 2. GET FOOD ITEM BY ID

### Endpoint
```
GET /api/food-items/:id
```

### Authentication
- **Required:** No
- **Access:** Public

### Path Parameters
```
id: string (MongoDB ObjectId, e.g., "507f1f77bcf86cd799439011")
```

### Response - Success (200 OK)
```json
{
  "success": true,
  "data": {
    "foodItem": {
      "_id": "507f1f77bcf86cd799439011",
      "restaurantId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Luigi's Pizza",
        "images": ["https://res.cloudinary.com/..."],
        "address": "123 Main Street",
        "deliveryFee": 500,
        "openingTime": "09:00",
        "closingTime": "22:00",
        "rating": 4.5,
        "totalReviews": 120,
        "status": "Open"
      },
      "name": "Margherita Pizza",
      "description": "Classic pizza with tomato, mozzarella, and basil",
      "images": [
        "https://res.cloudinary.com/..."
      ],
      "price": 4500,
      "categoryIds": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"],
      "calories": 250,
      "rating": 4.2,
      "totalReviews": 45,
      "createdAt": "2026-02-20T10:30:00.000Z",
      "updatedAt": "2026-02-20T10:30:00.000Z"
    }
  }
}
```

### Notes
- Results are cached for optimal performance
- Includes populated restaurant details
- Restaurant status calculated in real-time

### Error Responses
```json
// 404 - Not found
{
  "error": "Food item not found"
}
```

### Example Request (cURL)
```bash
curl -X GET http://localhost:3000/api/food-items/507f1f77bcf86cd799439011
```

---

## 3. GET MY FOOD ITEMS

### Endpoint
```
GET /api/food-items/my/items
```

### Authentication
- **Required:** Yes
- **Role Required:** VENDOR
- **Header:** `Authorization: Bearer <JWT_TOKEN>`
- **Additional Requirement:** Complete restaurant profile

### Response - Success (200 OK)
```json
{
  "success": true,
  "data": {
    "foodItems": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "restaurantId": "507f1f77bcf86cd799439012",
        "name": "Margherita Pizza",
        "description": "Classic pizza with tomato, mozzarella, and basil",
        "images": ["https://res.cloudinary.com/..."],
        "price": 4500,
        "categoryIds": ["507f1f77bcf86cd799439013"],
        "calories": 250,
        "rating": 4.2,
        "totalReviews": 45,
        "createdAt": "2026-02-20T10:30:00.000Z",
        "updatedAt": "2026-02-20T10:30:00.000Z"
      }
    ]
  }
}
```

### Notes
- Returns vendor's food items only
- Results sorted by creation date (newest first)
- Returns empty array if vendor has no food items

### Error Responses
```json
// 401 - Unauthorized
{
  "error": "No authorization token"
}

// 403 - Not a vendor
{
  "error": "Not authorized to perform this action"
}

// 403 - Incomplete profile
{
  "error": "Your restaurant profile is incomplete"
}
```

### Example Request (cURL)
```bash
curl -X GET http://localhost:3000/api/food-items/my/items \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 4. GET FOOD ITEMS BY RESTAURANT

### Endpoint
```
GET /api/food-items/restaurant/:restaurantId
```

### Authentication
- **Required:** No
- **Access:** Public

### Path Parameters
```
restaurantId: string (MongoDB ObjectId, e.g., "507f1f77bcf86cd799439012")
```

### Response - Success (200 OK)
```json
{
  "success": true,
  "data": {
    "foodItems": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "restaurantId": "507f1f77bcf86cd799439012",
        "name": "Margherita Pizza",
        "description": "Classic pizza with tomato, mozzarella, and basil",
        "images": ["https://res.cloudinary.com/..."],
        "price": 4500,
        "categoryIds": ["507f1f77bcf86cd799439013"],
        "calories": 250,
        "rating": 4.2,
        "totalReviews": 45,
        "createdAt": "2026-02-20T10:30:00.000Z",
        "updatedAt": "2026-02-20T10:30:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439015",
        "restaurantId": "507f1f77bcf86cd799439012",
        "name": "Carbonara Pizza",
        "description": "Traditional carbonara with egg, bacon, and parmesan",
        "images": ["https://res.cloudinary.com/..."],
        "price": 5000,
        "categoryIds": ["507f1f77bcf86cd799439013"],
        "calories": 300,
        "rating": 4.5,
        "totalReviews": 60,
        "createdAt": "2026-02-20T10:45:00.000Z",
        "updatedAt": "2026-02-20T10:45:00.000Z"
      }
    ]
  }
}
```

### Notes
- Results are cached
- Items sorted by creation date (newest first)
- Returns empty array if restaurant has no food items

### Example Request (cURL)
```bash
curl -X GET http://localhost:3000/api/food-items/restaurant/507f1f77bcf86cd799439012
```

---

## 5. GET FOOD ITEMS BY CATEGORY

### Endpoint
```
GET /api/food-items/category/:categoryId
```

### Authentication
- **Required:** No
- **Access:** Public

### Path Parameters
```
categoryId: string (MongoDB ObjectId, e.g., "507f1f77bcf86cd799439013")
```

### Response - Success (200 OK)
```json
{
  "success": true,
  "data": {
    "foodItems": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "restaurantId": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Luigi's Pizza",
          "images": ["https://res.cloudinary.com/..."],
          "address": "123 Main Street",
          "deliveryFee": 500,
          "openingTime": "09:00",
          "closingTime": "22:00",
          "rating": 4.5,
          "totalReviews": 120,
          "status": "Open"
        },
        "name": "Margherita Pizza",
        "description": "Classic pizza with tomato, mozzarella, and basil",
        "images": ["https://res.cloudinary.com/..."],
        "price": 4500,
        "categoryIds": ["507f1f77bcf86cd799439013"],
        "calories": 250,
        "rating": 4.2,
        "totalReviews": 45,
        "createdAt": "2026-02-20T10:30:00.000Z",
        "updatedAt": "2026-02-20T10:30:00.000Z"
      }
    ]
  }
}
```

### Notes
- Results are cached
- Includes populated restaurant details
- Filters out deleted restaurants (null restaurantId)
- All restaurants include real-time status calculation

### Example Request (cURL)
```bash
curl -X GET http://localhost:3000/api/food-items/category/507f1f77bcf86cd799439013
```

---

## 6. UPDATE FOOD ITEM

### Endpoint
```
PATCH /api/food-items/:id
```

### Authentication
- **Required:** Yes
- **Role Required:** VENDOR (must be owner)
- **Header:** `Authorization: Bearer <JWT_TOKEN>`
- **Additional Requirement:** Complete restaurant profile

### Request Format
```
Content-Type: multipart/form-data
```

### Path Parameters
```
id: string (MongoDB ObjectId, e.g., "507f1f77bcf86cd799439011")
```

### Request Body (All Optional)
```json
{
  "name": "string (min: 2, max: 100 characters, optional)",
  "description": "string (min: 10, max: 500 characters, optional)",
  "price": "number (min: 0, optional)",
  "categoryIds": "array of strings (1-3 category IDs, optional)",
  "calories": "number (optional, min: 0)"
}
```

### Request Files (Optional)
```
images: File[] (optional, multipart)
```

### Response - Success (200 OK)
```json
{
  "success": true,
  "data": {
    "foodItem": {
      "_id": "507f1f77bcf86cd799439011",
      "restaurantId": "507f1f77bcf86cd799439012",
      "name": "Margherita Pizza Premium",
      "description": "Classic pizza with tomato, mozzarella, fresh basil, and olive oil",
      "images": [
        "https://res.cloudinary.com/...",
        "https://res.cloudinary.com/..."
      ],
      "price": 5500,
      "categoryIds": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439016"],
      "calories": 280,
      "rating": 4.2,
      "totalReviews": 45,
      "createdAt": "2026-02-20T10:30:00.000Z",
      "updatedAt": "2026-02-20T12:15:00.000Z"
    }
  }
}
```

### Image Update Behavior
- New images **appended** to existing images
- Maximum 5 images maintained
- When limit exceeded, oldest images auto-deleted from Cloudinary
- Existing images preserved unless limit reached

### Validation Rules
- All fields optional - update only what's provided
- Categories must exist in database
- Ownership validated - vendors can only update their own food items
- Restaurant tags auto-updated if categories changed

### Error Responses
```json
// 404 - Food item not found
{
  "error": "Food item not found"
}

// 403 - Not the owner
{
  "error": "You can only update food items from your own restaurant"
}

// 400 - Invalid categories
{
  "error": "One or more invalid category IDs"
}

// 400 - Validation error
{
  "error": "Validation failed"
}

// 401 - Unauthorized
{
  "error": "No authorization token"
}

// 403 - Incomplete profile
{
  "error": "Your restaurant profile is incomplete"
}
```

### Example Request (cURL)
```bash
# Update basic fields
curl -X PATCH http://localhost:3000/api/food-items/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "name=Margherita Pizza Premium" \
  -F "price=5500"

# Add new images
curl -X PATCH http://localhost:3000/api/food-items/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "images=@/path/to/new-image.jpg"
```

---

## 7. DELETE FOOD ITEM IMAGE

### Endpoint
```
DELETE /api/food-items/:id/images
```

### Authentication
- **Required:** Yes
- **Role Required:** VENDOR (must be owner)
- **Header:** `Authorization: Bearer <JWT_TOKEN>`
- **Additional Requirement:** Complete restaurant profile

### Path Parameters
```
id: string (MongoDB ObjectId, e.g., "507f1f77bcf86cd799439011")
```

### Request Body
```json
{
  "imageUrl": "string (Cloudinary URL to delete)"
}
```

### Response - Success (200 OK)
```json
{
  "success": true,
  "data": {
    "foodItem": {
      "_id": "507f1f77bcf86cd799439011",
      "restaurantId": "507f1f77bcf86cd799439012",
      "name": "Margherita Pizza",
      "description": "Classic pizza with tomato, mozzarella, and basil",
      "images": [
        "https://res.cloudinary.com/remaining-image.jpg"
      ],
      "price": 4500,
      "categoryIds": ["507f1f77bcf86cd799439013"],
      "calories": 250,
      "rating": 4.2,
      "totalReviews": 45,
      "createdAt": "2026-02-20T10:30:00.000Z",
      "updatedAt": "2026-02-20T13:30:00.000Z"
    }
  }
}
```

### Business Rules
- Food item must have at least 1 image (cannot delete last image)
- Image URL must exist in food item's images array
- Only food item owner (vendor) can delete images
- Image deleted from Cloudinary after removal from database

### Error Responses
```json
// 400 - Missing imageUrl
{
  "error": "Image URL is required"
}

// 400 - Cannot delete last image
{
  "error": "Food item must have at least one image"
}

// 404 - Food item not found
{
  "error": "Food item not found"
}

// 404 - Image not found
{
  "error": "Image not found in food item"
}

// 403 - Not the owner
{
  "error": "You can only update food items from your own restaurant"
}

// 401 - Unauthorized
{
  "error": "No authorization token"
}

// 403 - Incomplete profile
{
  "error": "Your restaurant profile is incomplete"
}
```

### Example Request (cURL)
```bash
curl -X DELETE http://localhost:3000/api/food-items/507f1f77bcf86cd799439011/images \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://res.cloudinary.com/image-to-delete.jpg"}'
```

---

## 8. DELETE FOOD ITEM

### Endpoint
```
DELETE /api/food-items/:id
```

### Authentication
- **Required:** Yes
- **Role Required:** VENDOR (must be owner)
- **Header:** `Authorization: Bearer <JWT_TOKEN>`
- **Additional Requirement:** Complete restaurant profile

### Path Parameters
```
id: string (MongoDB ObjectId, e.g., "507f1f77bcf86cd799439011")
```

### Response - Success (200 OK)
```json
{
  "success": true,
  "message": "Food item deleted successfully"
}
```

### Deletion Process
1. Validates food item ownership
2. Deletes all images from Cloudinary
3. Deletes food item from database
4. Updates restaurant tags (removes category if no other items use it)
5. Invalidates all related cache entries

### Error Responses
```json
// 404 - Food item not found
{
  "error": "Food item not found"
}

// 403 - Not the owner
{
  "error": "You can only delete food items from your own restaurant"
}

// 401 - Unauthorized
{
  "error": "No authorization token"
}

// 403 - Incomplete profile
{
  "error": "Your restaurant profile is incomplete"
}
```

### Example Request (cURL)
```bash
curl -X DELETE http://localhost:3000/api/food-items/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Database Schema

### MongoDB Collection: `fooditems`

```typescript
interface IFoodItem extends Document {
  _id: ObjectId;                          // Auto-generated by MongoDB
  restaurantId: ObjectId;                 // Reference to Restaurant, Indexed
  name: string;                           // Required, Trimmed, Indexed (text search)
  description: string;                    // Required, Trimmed, Indexed (text search)
  images: string[];                       // Array of Cloudinary URLs, Default: []
  price: number;                          // Required, Min: 0
  categoryIds: string[];                  // Array of category IDs, 1-3 required, Indexed
  rating: number;                         // Default: 0, Min: 0, Max: 5
  totalReviews: number;                   // Default: 0, Min: 0
  calories?: number;                      // Optional, Min: 0
  createdAt: Date;                        // Auto-generated timestamp
  updatedAt: Date;                        // Auto-updated on changes
}
```

### Indexes
```javascript
{ restaurantId: 1, name: 1 }              // Compound index
{ categoryIds: 1 }                        // Array field index
{ price: 1 }                              // Price sorting
{ name: "text", description: "text" }     // Text search index
```

### Schema Validation
```
name:
  - Type: String
  - Required: true
  - Trim: true
  - Error message: "Food name is required"

description:
  - Type: String
  - Required: true
  - Trim: true
  - Error message: "Description is required"

restaurantId:
  - Type: ObjectId
  - Reference: "Restaurant"
  - Required: true
  - Indexed: true

price:
  - Type: Number
  - Required: true
  - Min: 0
  - Error message: "Price is required"

categoryIds:
  - Type: Array of Strings
  - Required: true
  - Length: 1-3
  - Indexed: true
  - error message: "Food item must have 1-3 categories"

rating:
  - Type: Number
  - Default: 0
  - Min: 0
  - Max: 5

totalReviews:
  - Type: Number
  - Default: 0
  - Min: 0

calories:
  - Type: Number
  - Optional
  - Min: 0
```

---

## Implementation Details

### Services Used
- **Cloudinary Service:** Image upload/delete operations
- **Cache Service:** Redis caching for read operations
- **Food Item Model:** MongoDB data persistence
- **Restaurant Model:** For ownership validation and tag updates
- **Category Model:** For category validation

### Middleware Applied
- **protect:** JWT authentication middleware
- **restrictTo:** Role-based authorization (VENDOR only)
- **requireCompleteProfile:** Validates restaurant profile completion for vendor operations
- **uploadMultiple:** Multipart file upload handling (for create/update)

### Error Handling
- Custom error classes: `ValidationError`, `NotFoundError`, `ForbiddenError`
- Async error wrapper: `asyncHandler` for consistent error handling
- All errors follow consistent response format with HTTP status codes

### Caching Strategy
- **Caching for:** All read operations
- **Cache keys:**
  - `food:id:{id}` - individual food item
  - `food:restaurant:{restaurantId}` - food items by restaurant
  - `food:category:{categoryId}` - food items by category
- **Cache invalidation:** On create, update, or delete operations
- **Cache patterns invalidated:** `food:*`, `restaurants:*` (when categories change)
- **TTL:** `CACHE_TTL.FOOD_ITEMS` for all food operations

### Response Format
All responses follow a consistent format:
```json
{
  "success": true/false,
  "data": { /* endpoint-specific data */ },
  "message": "string (optional)"
}
```

---

## Validation Rules Summary

### Create Food Item
- ✅ Name: 2-100 characters
- ✅ Description: 10-500 characters
- ✅ Price: >= 0
- ✅ CategoryIds: 1-3 valid category IDs
- ✅ Images: At least 1 image
- ✅ Calories: Optional, >= 0
- ✅ Vendor must have complete restaurant profile

### Update Food Item
- ✅ All fields optional
- ✅ Same validation rules as create (where applicable)
- ✅ Maximum 5 images enforced
- ✅ Categories auto-update restaurant tags

---

## Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Successful GET/PATCH/DELETE |
| 201 | Created - Successful POST |
| 400 | Bad Request - Validation/Missing data error |
| 401 | Unauthorized - Missing/Invalid JWT token |
| 403 | Forbidden - Not owner or incomplete profile |
| 404 | Not Found - Food item/Category doesn't exist |

---

## Request/Response Examples

### Complete Example: Create Food Item
```bash
# Request
POST /api/food-items HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="name"

Margherita Pizza
------WebKitFormBoundary
Content-Disposition: form-data; name="description"

Classic pizza with fresh tomato, mozzarella cheese, and basil
------WebKitFormBoundary
Content-Disposition: form-data; name="price"

4500
------WebKitFormBoundary
Content-Disposition: form-data; name="categoryIds"

507f1f77bcf86cd799439013
------WebKitFormBoundary
Content-Disposition: form-data; name="categoryIds"

507f1f77bcf86cd799439014
------WebKitFormBoundary
Content-Disposition: form-data; name="calories"

250
------WebKitFormBoundary
Content-Disposition: form-data; name="images"; filename="pizza.jpg"
Content-Type: image/jpeg

[binary image data]
------WebKitFormBoundary--

# Response
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "foodItem": {
      "_id": "507f1f77bcf86cd799439011",
      "restaurantId": "507f1f77bcf86cd799439012",
      "name": "Margherita Pizza",
      "description": "Classic pizza with fresh tomato, mozzarella cheese, and basil",
      "images": ["https://res.cloudinary.com/dklt3xxxx/image/upload/v1645344600/food-items/abc123.jpg"],
      "price": 4500,
      "categoryIds": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"],
      "calories": 250,
      "rating": 0,
      "totalReviews": 0,
      "createdAt": "2026-02-20T10:30:00.000Z",
      "updatedAt": "2026-02-20T10:30:00.000Z"
    }
  }
}
```

### Complete Example: Get Food Items by Category
```bash
# Request
GET /api/food-items/category/507f1f77bcf86cd799439013 HTTP/1.1
Host: localhost:3000

# Response
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "foodItems": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "restaurantId": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Luigi's Pizza",
          "images": ["https://res.cloudinary.com/..."],
          "address": "123 Main Street, Downtown",
          "deliveryFee": 500,
          "openingTime": "09:00",
          "closingTime": "22:00",
          "rating": 4.5,
          "totalReviews": 120,
          "status": "Open"
        },
        "name": "Margherita Pizza",
        "description": "Classic pizza with fresh tomato, mozzarella cheese, and basil",
        "images": ["https://res.cloudinary.com/..."],
        "price": 4500,
        "categoryIds": ["507f1f77bcf86cd799439013"],
        "calories": 250,
        "rating": 4.2,
        "totalReviews": 45,
        "createdAt": "2026-02-20T10:30:00.000Z",
        "updatedAt": "2026-02-20T10:30:00.000Z"
      }
    ]
  }
}
```

---

## Notes & Best Practices

1. **Always include Authorization header** for vendor (POST, PATCH, DELETE) operations
2. **At least 1 image required** for POST requests
3. **Categories required:** 1-3 categories must be assigned
4. **Categories must exist:** All category IDs must exist in database
5. **Price in smallest units:** e.g., 2500 = ₦25.00 or $25.00
6. **Profile completion required:** Vendors need complete restaurant profiles
7. **Image limit: 5 maximum** - oldest auto-deleted when exceeded
8. **Cannot delete last image** - minimum 1 image required per food item
9. **Ownership validation** - vendors can only manage their own food items
10. **Restaurant tags auto-updated** - based on food item categories
11. **Category validation** - all categoryIds are validated against database
12. **Results cached** for optimal performance
13. **Images stored on Cloudinary** - direct URLs returned
14. **Timestamps in UTC ISO 8601 format**
15. **MongoDB ObjectIds** are 24-character hexadecimal strings
16. **Real-time restaurant status** - calculated when retrieving food items by category
17. **Deleted images** - async cleanup from Cloudinary (doesn't block response)
18. **Calories optional** - useful for health tracking but not required
19. **Rating system:** 0-5 scale with total review count tracking
20. **Text search supported:** Name and description fields indexed for search
