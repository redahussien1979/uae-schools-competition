#!/bin/bash

# SEO Validation Script for www.uaeschoolcup.com
# Run this script to verify your site is ready for Google Search Console

echo "=================================="
echo "SEO Validation Script"
echo "www.uaeschoolcup.com"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

DOMAIN="https://www.uaeschoolcup.com"
ERRORS=0
WARNINGS=0

# Function to check if a URL returns 200 OK
check_url() {
    local url=$1
    local description=$2

    echo -n "Checking $description... "

    if command -v curl &> /dev/null; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)

        if [ "$response" = "200" ]; then
            echo -e "${GREEN}✓ OK${NC} (HTTP $response)"
        elif [ "$response" = "000" ]; then
            echo -e "${RED}✗ FAILED${NC} (Cannot connect - site may not be deployed)"
            ((ERRORS++))
        else
            echo -e "${RED}✗ FAILED${NC} (HTTP $response)"
            ((ERRORS++))
        fi
    else
        echo -e "${YELLOW}⚠ SKIPPED${NC} (curl not installed)"
        ((WARNINGS++))
    fi
}

# Function to check local file exists
check_local_file() {
    local file=$1
    local description=$2

    echo -n "Checking local $description... "

    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ EXISTS${NC}"
    else
        echo -e "${RED}✗ MISSING${NC}"
        ((ERRORS++))
    fi
}

# Function to validate XML
validate_xml() {
    local file=$1
    local description=$2

    echo -n "Validating $description XML syntax... "

    if command -v xmllint &> /dev/null; then
        if xmllint --noout "$file" 2>/dev/null; then
            echo -e "${GREEN}✓ VALID${NC}"
        else
            echo -e "${RED}✗ INVALID XML${NC}"
            ((ERRORS++))
        fi
    else
        echo -e "${YELLOW}⚠ SKIPPED${NC} (xmllint not installed)"
        ((WARNINGS++))
    fi
}

# Function to count URLs in sitemap
count_sitemap_urls() {
    local file=$1

    if [ -f "$file" ]; then
        count=$(grep -c "<loc>" "$file")
        echo "   → Found $count URLs in sitemap"
    fi
}

echo "=== Part 1: Local File Validation ==="
echo ""

# Check local files exist
check_local_file "frontend/sitemap.xml" "sitemap.xml"
check_local_file "frontend/robots.txt" "robots.txt"
check_local_file "frontend/index.html" "index.html"
check_local_file "frontend/privacy-policy.html" "privacy-policy.html"
check_local_file "frontend/terms-of-service.html" "terms-of-service.html"
check_local_file "frontend/cookie-policy.html" "cookie-policy.html"
check_local_file "frontend/contact.html" "contact.html"

echo ""

# Validate XML files
if [ -f "frontend/sitemap.xml" ]; then
    validate_xml "frontend/sitemap.xml" "sitemap.xml"
    count_sitemap_urls "frontend/sitemap.xml"
fi

echo ""
echo "=== Part 2: Content Validation ==="
echo ""

# Check robots.txt has sitemap reference
if [ -f "frontend/robots.txt" ]; then
    echo -n "Checking robots.txt has sitemap reference... "
    if grep -q "Sitemap:" "frontend/robots.txt"; then
        echo -e "${GREEN}✓ FOUND${NC}"
        grep "Sitemap:" "frontend/robots.txt" | sed 's/^/   → /'
    else
        echo -e "${RED}✗ MISSING${NC}"
        ((ERRORS++))
    fi
fi

echo ""

# Check sitemap uses correct domain
if [ -f "frontend/sitemap.xml" ]; then
    echo -n "Checking sitemap uses www.uaeschoolcup.com... "
    if grep -q "www.uaeschoolcup.com" "frontend/sitemap.xml"; then
        echo -e "${GREEN}✓ CORRECT${NC}"
    else
        echo -e "${YELLOW}⚠ WARNING${NC} (May be using different domain)"
        ((WARNINGS++))
    fi
fi

echo ""

# Check index.html has meta description
if [ -f "frontend/index.html" ]; then
    echo -n "Checking index.html has meta description... "
    if grep -q 'name="description"' "frontend/index.html"; then
        echo -e "${GREEN}✓ FOUND${NC}"
    else
        echo -e "${RED}✗ MISSING${NC}"
        ((ERRORS++))
    fi
fi

echo ""

# Check index.html has Open Graph tags
if [ -f "frontend/index.html" ]; then
    echo -n "Checking index.html has Open Graph tags... "
    if grep -q 'property="og:' "frontend/index.html"; then
        echo -e "${GREEN}✓ FOUND${NC}"
    else
        echo -e "${YELLOW}⚠ MISSING${NC}"
        ((WARNINGS++))
    fi
fi

echo ""

# Check for hreflang tags (bilingual support)
if [ -f "frontend/index.html" ]; then
    echo -n "Checking index.html has hreflang tags (EN/AR)... "
    if grep -q 'hreflang="en"' "frontend/index.html" && grep -q 'hreflang="ar"' "frontend/index.html"; then
        echo -e "${GREEN}✓ FOUND${NC}"
    else
        echo -e "${YELLOW}⚠ MISSING${NC}"
        ((WARNINGS++))
    fi
fi

echo ""
echo "=== Part 3: Remote URL Validation ==="
echo "(Only works if site is deployed)"
echo ""

# Check if site is deployed and accessible
check_url "$DOMAIN/" "Homepage"
check_url "$DOMAIN/sitemap.xml" "Sitemap"
check_url "$DOMAIN/robots.txt" "Robots.txt"
check_url "$DOMAIN/register.html" "Register page"
check_url "$DOMAIN/leaderboard.html" "Leaderboard page"
check_url "$DOMAIN/privacy-policy.html" "Privacy Policy"
check_url "$DOMAIN/terms-of-service.html" "Terms of Service"
check_url "$DOMAIN/cookie-policy.html" "Cookie Policy"
check_url "$DOMAIN/contact.html" "Contact page"

echo ""
echo "=== Part 4: SEO Recommendations ==="
echo ""

# Check for Google verification meta tag
if [ -f "frontend/index.html" ]; then
    echo -n "Checking for Google Search Console verification... "
    if grep -q 'google-site-verification' "frontend/index.html"; then
        if grep -q 'content="YOUR_VERIFICATION_CODE_HERE"' "frontend/index.html"; then
            echo -e "${YELLOW}⚠ PLACEHOLDER${NC} (Need to add real verification code)"
            ((WARNINGS++))
        else
            echo -e "${GREEN}✓ CONFIGURED${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ NOT ADDED${NC} (Add after Google Search Console setup)"
        ((WARNINGS++))
    fi
fi

echo ""

# Summary
echo "=================================="
echo "Validation Summary"
echo "=================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CHECKS PASSED!${NC}"
    echo ""
    echo "Your site is ready for Google Search Console submission!"
    echo ""
    echo "Next steps:"
    echo "1. Deploy your site to www.uaeschoolcup.com"
    echo "2. Follow GOOGLE_SEARCH_CONSOLE_SETUP.md"
    echo "3. Submit sitemap: $DOMAIN/sitemap.xml"
else
    if [ $ERRORS -gt 0 ]; then
        echo -e "${RED}✗ Found $ERRORS error(s)${NC}"
    fi
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ Found $WARNINGS warning(s)${NC}"
    fi
    echo ""
    if [ $ERRORS -gt 0 ]; then
        echo "Please fix errors before submitting to Google Search Console."
    else
        echo "Warnings are non-critical but recommended to address."
    fi
fi

echo ""

# Show helpful links
echo "=================================="
echo "Helpful Testing Tools"
echo "=================================="
echo ""
echo "1. XML Sitemap Validator:"
echo "   https://www.xml-sitemaps.com/validate-xml-sitemap.html"
echo ""
echo "2. robots.txt Tester:"
echo "   https://en.ryte.com/free-tools/robots-txt/"
echo ""
echo "3. Mobile-Friendly Test:"
echo "   https://search.google.com/test/mobile-friendly"
echo ""
echo "4. Rich Results Test:"
echo "   https://search.google.com/test/rich-results"
echo ""
echo "5. PageSpeed Insights:"
echo "   https://pagespeed.web.dev/"
echo ""

exit $ERRORS
