<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Shopie Backend

A NestJS backend application for the Shopie e-commerce platform.

## Features

- User authentication and authorization with JWT
- Product management with image uploads via Cloudinary
- Shopping cart functionality
- Role-based access control (Admin/Customer)
- RESTful API with Swagger documentation
- PostgreSQL database with Prisma ORM

## API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication (`/auth`)

#### Register User
- **POST** `/auth/register`
- **Description**: Register a new user account
- **Authentication**: Not required
- **Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "CUSTOMER" // Optional, defaults to CUSTOMER
}
```
- **Response**:
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CUSTOMER",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt-token"
}
```

#### Login
- **POST** `/auth/login`
- **Description**: Authenticate user and get JWT token
- **Authentication**: Not required
- **Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CUSTOMER"
  },
  "token": "jwt-token"
}
```

### Password Management

#### Reset Password (Self-Service)
- **POST** `/auth/reset-password`
- **Description**: Reset user's own password (available to all authenticated users)
- **Authentication**: Required (user must be logged in)
- **Security**: Users can only reset their own password, not others'
- **Request Body**:
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**How it works:**
1. User must be authenticated with valid JWT token
2. User provides their current password for verification
3. User sets a new password
4. System validates and updates the password

**Example Usage:**
```bash
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldpassword",
    "newPassword": "newpassword123"
  }'
```

**Security Features:**
- ✅ Only authenticated users can reset passwords
- ✅ Users can only reset their own password
- ✅ Current password verification required
- ✅ JWT token validation ensures user identity

### Users (`/users`)

#### Create User (Admin)
- **POST** `/users`
- **Description**: Create a new user (Admin only)
- **Authentication**: Required (Admin)
- **Request Body**: Same as register
- **Response**: Same as register

#### Get All Users (Admin)
- **GET** `/users`
- **Description**: Get all users in the system
- **Authentication**: Required (Admin)
- **Response**:
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "CUSTOMER",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get User Profile
- **GET** `/users/profile`
- **Description**: Get current user's profile
- **Authentication**: Required
- **Response**: Same as single user response

#### Update Profile
- **PUT** `/users/profile`
- **Description**: Update current user's profile
- **Authentication**: Required
- **Request Body**:
```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```
- **Response**: Updated user object

#### Delete Profile
- **DELETE** `/users/profile`
- **Description**: Delete current user's account
- **Authentication**: Required
- **Response**:
```json
{
  "success": true,
  "message": "Profile deleted successfully"
}
```

#### Get User by ID (Admin)
- **GET** `/users/:id`
- **Description**: Get specific user by ID
- **Authentication**: Required (Admin)
- **Response**: Single user object

#### Delete User (Admin)
- **DELETE** `/users/:id`
- **Description**: Delete specific user
- **Authentication**: Required (Admin)
- **Response**:
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Products (`/products`)

#### Create Product (Admin)
- **POST** `/products`
- **Description**: Create a new product
- **Authentication**: Required (Admin)
- **Request Body**:
```json
{
  "name": "iPhone 13 Pro",
  "description": "Latest iPhone with advanced features",
  "price": 999.99,
  "imageUrl": "https://res.cloudinary.com/...",
  "stockQuantity": 50
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "uuid",
    "name": "iPhone 13 Pro",
    "description": "Latest iPhone with advanced features",
    "price": "999.99",
    "imageUrl": "https://res.cloudinary.com/...",
    "stockQuantity": 50,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get All Products
- **GET** `/products`
- **Description**: Get all products (public)
- **Authentication**: Not required
- **Response**: Array of products

#### Get Product by ID
- **GET** `/products/:id`
- **Description**: Get specific product by ID
- **Authentication**: Not required
- **Response**: Single product object

#### Update Product (Admin)
- **PUT** `/products/:id`
- **Description**: Update existing product
- **Authentication**: Required (Admin)
- **Request Body**: Same as create product
- **Response**: Updated product object

#### Delete Product (Admin)
- **DELETE** `/products/:id`
- **Description**: Delete specific product
- **Authentication**: Required (Admin)
- **Response**:
```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": {
    // deleted product object
  }
}
```

#### Search Products
- **GET** `/products/search/:query`
- **Description**: Search products by name
- **Authentication**: Not required
- **Response**: Array of matching products

### Image Upload (`/products`)

#### Upload Single Image
- **POST** `/products/upload-image`
- **Description**: Upload a single product image
- **Authentication**: Required (Admin)
- **Content-Type**: `multipart/form-data`
- **Field Name**: `image`
- **Max File Size**: 5MB
- **Allowed Formats**: jpg, jpeg, png, webp
- **Response**:
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "publicId": "shopie/products/images/file_abc123",
    "secureUrl": "https://res.cloudinary.com/...",
    "url": "http://res.cloudinary.com/...",
    "originalFilename": "product-image.jpg",
    "bytes": 1024000,
    "format": "jpg"
  }
}
```

#### Upload Multiple Images
- **POST** `/products/upload-gallery`
- **Description**: Upload multiple product images
- **Authentication**: Required (Admin)
- **Content-Type**: `multipart/form-data`
- **Field Name**: `images`
- **Max Files**: 10 images
- **Max File Size**: 8MB per image
- **Allowed Formats**: jpg, jpeg, png, webp
- **Response**: Array of upload responses

#### Delete Image
- **DELETE** `/products/image/:publicId`
- **Description**: Delete image from Cloudinary
- **Authentication**: Required (Admin)
- **Response**:
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### Cart (`/cart`)

#### Add Item to Cart
- **POST** `/cart/add`
- **Description**: Add product to user's cart
- **Authentication**: Required
- **Request Body**:
```json
{
  "productId": "product-uuid",
  "quantity": 2
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "data": {
    "id": "cart-uuid",
    "quantity": 2,
    "productName": "iPhone 13 Pro",
    "total": "1999.98",
    "userId": "user-uuid",
    "productId": "product-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get User Cart
- **GET** `/cart`
- **Description**: Get all items in user's cart
- **Authentication**: Required
- **Response**: Array of cart items

#### Get Cart Total
- **GET** `/cart/total`
- **Description**: Get cart total and item count
- **Authentication**: Required
- **Response**:
```json
{
  "success": true,
  "message": "Cart total calculated successfully",
  "data": {
    "total": 2999.97,
    "itemCount": 3
  }
}
```

#### Remove Item from Cart
- **DELETE** `/cart/:id`
- **Description**: Remove specific item from cart
- **Authentication**: Required
- **Response**:
```json
{
  "success": true,
  "message": "Item removed from cart successfully"
}
```

## Database Schema

### User Model
```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(CUSTOMER)
  carts     Cart[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Product Model
```prisma
model Product {
  id             String   @id @default(uuid())
  name           String
  description    String
  price          Decimal  @default(10.2)
  imageUrl       String
  stockQuantity  Int      @default(0)
  carts          Cart[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### Cart Model
```prisma
model Cart {
  id          String   @id @default(uuid())
  quantity    Int
  productName String
  total       Decimal  @default(0)
  user        User     @relation(fields: [userId], references: [id])
  userId      String
  Product     Product  @relation(fields: [productId], references: [id])
  productId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/shopie_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

## API Testing

The project includes REST client files for testing:

- `restClient/user.http` - User management endpoints
- `restClient/products.http` - Product management endpoints
- `restClient/cart.http` - Cart management endpoints

Use these files with VS Code REST Client extension or import into Postman.

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Test

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Swagger Documentation

Once the application is running, you can access the interactive API documentation at:
```
http://localhost:3000/api
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation with class-validator
- CORS protection
- Rate limiting (can be configured)

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
