## Plan: Integrate Instagram Graph API for Real Lead Discovery

**TL;DR** - Replace hardcoded persona database with real Instagram hashtag search using Graph API, add security measures for safe API usage.

**Steps**
1. Set up Facebook app configuration with provided app ID (1957511428186858) and obtain app secret
2. Implement OAuth 2.0 authentication flow for Instagram business account access
3. Create API client module for Instagram Graph API calls (hashtag search, media retrieval)
4. Update search functionality to use real Instagram data instead of hardcoded database
5. Add security measures: rate limiting, error handling, token validation
6. Update UI to handle real-time search results and loading states
7. Add configuration for API keys (environment variables, not hardcoded)

**Relevant files**
- index.html — Update UI for real search, add auth flow
- package.json — Add dependencies for API calls (axios/fetch)
- New: js/instagram-api.js — API client module
- New: js/auth.js — Authentication handling
- New: config/.env — API keys storage

**Verification**
1. Test OAuth flow with Instagram business account
2. Verify hashtag search returns real Instagram posts
3. Check rate limiting prevents API abuse
4. Ensure error handling for invalid tokens/network issues
5. Validate that search results match user keywords

**Decisions**
- Use Instagram Graph API v18+ for hashtag-based search
- Implement client-side only (no backend server initially)
- Store access tokens in localStorage with expiration
- Add manual approval step before sending DMs to comply with Instagram policies
- Exclude direct messaging automation to avoid policy violations

**Further Considerations**
1. Need Facebook app secret from user for server-side token exchange
2. Consider adding Instagram business account setup instructions
3. Evaluate if backend server is needed for token security