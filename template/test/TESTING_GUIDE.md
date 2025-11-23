# Testing Guide

Complete guide for testing your backend - APIs, security, validation, error handling, and more.

## Quick Start

1. Start your server: `npm run dev`
2. Run tests: `npm test`

That's it! The test script checks everything automatically.

## Testing Methods

### Method 1: Automated Test Script (Recommended)

The test script (`test/test-server.js`) automatically tests everything:

```bash
npm test
```

**What it tests:**
- ✅ Health check endpoint
- ✅ User registration (valid and invalid data)
- ✅ User login (valid and invalid credentials)
- ✅ Protected routes (with/without tokens)
- ✅ Security (CORS, XSS, NoSQL injection)
- ✅ Rate limiting
- ✅ Error handling
- ✅ Validation

**Output:**
- Green ✓ for passed tests
- Red ✗ for failed tests
- Summary with pass/fail counts

### Method 2: Security Testing Script

For detailed security testing:

```bash
# Make script executable (Linux/Mac)
chmod +x test/security-tests.sh

# Run it
./test/security-tests.sh
```

**What it tests:**
- CORS headers
- Security headers (Helmet)
- Request ID tracking
- NoSQL injection protection
- XSS protection
- Rate limiting
- Large payload rejection
- Authentication requirements

### Method 3: REST Client (VS Code)

1. Install "REST Client" extension in VS Code
2. Open `test/api-tests.http`
3. Click "Send Request" above each request
4. Replace `{{token}}` with actual token from login

**Benefits:**
- Visual interface
- Easy to modify requests
- See responses immediately
- Save tokens for reuse

### Method 4: Postman/Insomnia

Import the Postman collection (see below) or manually test:

**Basic Flow:**
1. Register a user
2. Login to get token
3. Use token for protected routes
4. Test error cases

## Manual Testing Checklist

### ✅ API Endpoints

**Health Check**
```bash
curl http://localhost:4000/api/v1/health
```
Expected: 200, includes status, database, uptime

**Register User**
```bash
curl -X POST http://localhost:4000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"Test1234"}'
```
Expected: 201, returns user and tokens

**Login**
```bash
curl -X POST http://localhost:4000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```
Expected: 200, returns user and tokens

**Get Profile (Protected)**
```bash
curl http://localhost:4000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Expected: 200, returns user data

**Without Token**
```bash
curl http://localhost:4000/api/v1/users/profile
```
Expected: 401 Unauthorized

### ✅ Validation Testing

**Test Invalid Email**
```bash
curl -X POST http://localhost:4000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","name":"Test","password":"Test1234"}'
```
Expected: 400 Bad Request

**Test Weak Password**
```bash
curl -X POST http://localhost:4000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test","password":"weak"}'
```
Expected: 400 Bad Request

**Test Missing Required Fields**
```bash
curl -X POST http://localhost:4000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```
Expected: 400 Bad Request

**Test Name Too Short**
```bash
curl -X POST http://localhost:4000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"A","password":"Test1234"}'
```
Expected: 400 Bad Request

### ✅ Security Testing

**Test CORS**
```bash
curl -X OPTIONS http://localhost:4000/api/v1/health \
  -H "Origin: http://localhost:4000" \
  -H "Access-Control-Request-Method: GET" \
  -v
```
Expected: CORS headers in response

**Test NoSQL Injection**
```bash
curl -X POST http://localhost:4000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":{"$ne":null},"password":{"$ne":null}}'
```
Expected: 400 or 401 (injection blocked)

**Test XSS Protection**
```bash
curl -X POST http://localhost:4000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"<script>alert(1)</script>","password":"Test1234"}'
```
Expected: 400 or sanitized input

**Test Rate Limiting**
```bash
# Run this 110 times quickly
for i in {1..110}; do
  curl http://localhost:4000/api/v1/health
done
```
Expected: Eventually get 429 Too Many Requests

**Test Large Payload**
```bash
# Create large string
LARGE=$(python3 -c "print('a' * 20000)")
curl -X POST http://localhost:4000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"name\":\"$LARGE\",\"password\":\"Test1234\"}"
```
Expected: 400 or 413 (payload too large)

### ✅ Error Handling

**Test 404**
```bash
curl http://localhost:4000/api/v1/nonexistent
```
Expected: 404 Not Found

**Test Invalid JSON**
```bash
curl -X POST http://localhost:4000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"'
```
Expected: 400 Bad Request

**Test Invalid Token**
```bash
curl http://localhost:4000/api/v1/users/profile \
  -H "Authorization: Bearer invalid-token"
```
Expected: 401 Unauthorized

## Postman Collection

Create a Postman collection with these requests:

1. **Health Check** - GET `/api/v1/health`
2. **Register** - POST `/api/v1/users/register`
3. **Login** - POST `/api/v1/users/login` (save token)
4. **Get Profile** - GET `/api/v1/users/profile` (use token)
5. **Update Profile** - PUT `/api/v1/users/profile` (use token)
6. **Logout** - POST `/api/v1/users/logout` (use token)

**Environment Variables:**
- `baseUrl`: `http://localhost:4000/api/v1`
- `token`: (set from login response)

## What to Look For

### ✅ Success Indicators

1. **Health Check**
   - Returns 200
   - Shows database status
   - Includes uptime

2. **Registration**
   - Returns 201
   - Includes user data
   - Includes accessToken and refreshToken
   - Password not in response

3. **Login**
   - Returns 200
   - Includes user data
   - Includes new tokens

4. **Protected Routes**
   - Without token: 401
   - With invalid token: 401
   - With valid token: 200

5. **Security**
   - CORS headers present
   - Security headers (X-Content-Type-Options, etc.)
   - Request ID in headers
   - NoSQL injection blocked
   - XSS attempts blocked
   - Rate limiting active

6. **Validation**
   - Invalid data returns 400
   - Clear error messages
   - Required fields enforced

7. **Error Handling**
   - 404 for unknown routes
   - Proper status codes
   - Consistent error format

### ❌ Failure Indicators

- Missing security headers
- NoSQL injection succeeds
- XSS in responses
- No rate limiting
- Weak validation
- Inconsistent error format
- Tokens in error messages

## Troubleshooting

**Tests fail to connect:**
- Make sure server is running
- Check port (default 4000)
- Check firewall

**Rate limiting not working:**
- May need more requests
- Check rate limit config
- Wait for window to reset

**CORS errors:**
- Check ALLOWED_ORIGINS in .env
- Verify CORS middleware is active

**Validation not working:**
- Check validation middleware is applied
- Verify validation rules in routes
- Check error messages

## Continuous Testing

For ongoing testing:

1. **Before commits:** Run `npm test`
2. **Before deployment:** Run security tests
3. **After changes:** Test affected endpoints
4. **Regular checks:** Test all endpoints weekly

## Next Steps

1. Run `npm test` to see current status
2. Fix any failures
3. Test manually for edge cases
4. Set up CI/CD to run tests automatically
5. Monitor in production

Your backend is production-ready when all tests pass! 🚀

---

**Note:** For basic testing info, see the main `README.md`. This guide provides detailed procedures for comprehensive testing.

