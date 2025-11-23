#!/bin/bash
# Security testing script - tests various security aspects
# Run this after starting your server

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

PORT=${PORT:-4000}
API_PREFIX=${API_PREFIX:-/api/v1}
BASE_URL="http://localhost:${PORT}${API_PREFIX}"

echo "🔒 Security Testing Suite"
echo "========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: CORS Headers
echo "Test 1: CORS Headers"
ORIGIN=${ALLOWED_ORIGINS:-http://localhost:4000}
ORIGIN=$(echo $ORIGIN | cut -d',' -f1) # Get first origin
response=$(curl -s -I -X OPTIONS "$BASE_URL/health" -H "Origin: $ORIGIN")
if echo "$response" | grep -q "access-control-allow-origin"; then
    echo -e "${GREEN}✓ CORS headers present${NC}"
else
    echo -e "${RED}✗ CORS headers missing${NC}"
fi
echo ""

# Test 2: Security Headers (Helmet)
echo "Test 2: Security Headers"
response=$(curl -s -I "$BASE_URL/health")
if echo "$response" | grep -qi "x-content-type-options"; then
    echo -e "${GREEN}✓ Security headers present${NC}"
else
    echo -e "${RED}✗ Security headers missing${NC}"
fi
echo ""

# Test 3: Request ID
echo "Test 3: Request ID Header"
response=$(curl -s -I "$BASE_URL/health")
if echo "$response" | grep -qi "x-request-id"; then
    echo -e "${GREEN}✓ Request ID header present${NC}"
else
    echo -e "${RED}✗ Request ID header missing${NC}"
fi
echo ""

# Test 4: NoSQL Injection Protection
echo "Test 4: NoSQL Injection Protection"
response=$(curl -s -X POST "$BASE_URL/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":{"$ne":null},"password":{"$ne":null}}')
if echo "$response" | grep -q "400\|401"; then
    echo -e "${GREEN}✓ NoSQL injection blocked${NC}"
else
    echo -e "${RED}✗ NoSQL injection not properly handled${NC}"
fi
echo ""

# Test 5: XSS Protection
echo "Test 5: XSS Protection"
response=$(curl -s -X POST "$BASE_URL/users/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"<script>alert(1)</script>","password":"Test1234"}')
if echo "$response" | grep -q "400\|201"; then
    echo -e "${GREEN}✓ XSS attempt handled${NC}"
else
    echo -e "${RED}✗ XSS not properly handled${NC}"
fi
echo ""

# Test 6: Rate Limiting (make 110 requests)
echo "Test 6: Rate Limiting (making 110 requests, this may take a moment...)"
rate_limited=false
for i in {1..110}; do
    response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/health")
    if [ "$response" = "429" ]; then
        rate_limited=true
        break
    fi
done
if [ "$rate_limited" = true ]; then
    echo -e "${GREEN}✓ Rate limiting active${NC}"
else
    echo -e "${YELLOW}⚠ Rate limiting not triggered (may need more requests)${NC}"
fi
echo ""

# Test 7: Large Payload Rejection
echo "Test 7: Large Payload Rejection"
large_payload=$(python3 -c "print('a' * 20000)")
response=$(curl -s -X POST "$BASE_URL/users/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"name\":\"$large_payload\",\"password\":\"Test1234\"}" \
  -w "%{http_code}" -o /dev/null)
if [ "$response" = "400" ] || [ "$response" = "413" ]; then
    echo -e "${GREEN}✓ Large payload rejected${NC}"
else
    echo -e "${RED}✗ Large payload not rejected (status: $response)${NC}"
fi
echo ""

# Test 8: Invalid JSON Handling
echo "Test 8: Invalid JSON Handling"
response=$(curl -s -X POST "$BASE_URL/users/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test","password":"Test1234"' \
  -w "%{http_code}" -o /dev/null)
if [ "$response" = "400" ]; then
    echo -e "${GREEN}✓ Invalid JSON handled${NC}"
else
    echo -e "${YELLOW}⚠ Invalid JSON handling unclear (status: $response)${NC}"
fi
echo ""

# Test 9: Missing Authentication
echo "Test 9: Missing Authentication"
response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/users/profile")
if [ "$response" = "401" ]; then
    echo -e "${GREEN}✓ Protected route requires authentication${NC}"
else
    echo -e "${RED}✗ Protected route accessible without auth (status: $response)${NC}"
fi
echo ""

# Test 10: Invalid Token
echo "Test 10: Invalid Token Handling"
response=$(curl -s -X GET "$BASE_URL/users/profile" \
  -H "Authorization: Bearer invalid-token-12345" \
  -w "%{http_code}" -o /dev/null)
if [ "$response" = "401" ]; then
    echo -e "${GREEN}✓ Invalid token rejected${NC}"
else
    echo -e "${RED}✗ Invalid token not rejected (status: $response)${NC}"
fi
echo ""

echo "========================="
echo "Security testing complete!"

