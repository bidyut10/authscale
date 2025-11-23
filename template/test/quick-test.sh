#!/bin/bash
# Quick test script - tests basic functionality
# Make sure your server is running first!

echo "🚀 Quick Server Test"
echo "==================="
echo ""

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

PORT=${PORT:-4000}
API_PREFIX=${API_PREFIX:-/api/v1}
BASE_URL="http://localhost:${PORT}${API_PREFIX}"

# Test 1: Health Check
echo "1. Testing health endpoint..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "200" ]; then
    echo "   ✓ Health check passed"
else
    echo "   ✗ Health check failed (got $http_code)"
    exit 1
fi

# Test 2: Register User
echo "2. Testing user registration..."
email="test$(date +%s)@example.com"
register_response=$(curl -s -X POST "$BASE_URL/users/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$email\",\"name\":\"Test User\",\"password\":\"Test1234\"}")
if echo "$register_response" | grep -q "accessToken"; then
    echo "   ✓ Registration passed"
    # Extract token
    token=$(echo "$register_response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
else
    echo "   ✗ Registration failed"
    echo "   Response: $register_response"
    exit 1
fi

# Test 3: Login
echo "3. Testing login..."
login_response=$(curl -s -X POST "$BASE_URL/users/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$email\",\"password\":\"Test1234\"}")
if echo "$login_response" | grep -q "accessToken"; then
    echo "   ✓ Login passed"
    # Update token
    token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
else
    echo "   ✗ Login failed"
    exit 1
fi

# Test 4: Protected Route
echo "4. Testing protected route..."
profile_response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/users/profile" \
  -H "Authorization: Bearer $token")
http_code=$(echo "$profile_response" | tail -n1)
if [ "$http_code" = "200" ]; then
    echo "   ✓ Protected route passed"
else
    echo "   ✗ Protected route failed (got $http_code)"
    exit 1
fi

# Test 5: Invalid Token
echo "5. Testing invalid token..."
invalid_response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/users/profile" \
  -H "Authorization: Bearer invalid-token")
http_code=$(echo "$invalid_response" | tail -n1)
if [ "$http_code" = "401" ]; then
    echo "   ✓ Invalid token rejected"
else
    echo "   ✗ Invalid token not rejected (got $http_code)"
fi

# Test 6: Validation
echo "6. Testing validation..."
validation_response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/users/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"not-an-email\",\"name\":\"Test\",\"password\":\"Test1234\"}")
http_code=$(echo "$validation_response" | tail -n1)
if [ "$http_code" = "400" ]; then
    echo "   ✓ Validation working"
else
    echo "   ✗ Validation failed (got $http_code)"
fi

echo ""
echo "==================="
echo "✅ All basic tests passed!"
echo ""
echo "For comprehensive testing, run: npm test"

