// Instagram OAuth Authentication Module
class InstagramAuth {
  constructor() {
    this.appId = '1957511428186858';
    this.appSecret = '794e0ea2e0e9706a8eed75cc9a6c57ae';
    this.redirectUri = window.location.origin + '/auth/callback';
    this.scope = 'instagram_basic';
    this.accessToken = null;
  }

  // Initiate OAuth flow
  login() {
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${this.appId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&scope=${this.scope}&response_type=code`;
    window.location.href = authUrl;
  }

  // Handle OAuth callback
  async handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      try {
        // Exchange code for access token
        const tokenResponse = await this.exchangeCodeForToken(code);
        this.accessToken = tokenResponse.access_token;

        // Store token with expiration (1 hour)
        const expirationTime = Date.now() + (60 * 60 * 1000); // 1 hour
        localStorage.setItem('instagram_access_token', this.accessToken);
        localStorage.setItem('instagram_token_expires', expirationTime);

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);

        return true;
      } catch (error) {
        console.error('OAuth error:', error);
        return false;
      }
    }
    return false;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code) {
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${this.appId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&client_secret=${this.appSecret}&code=${code}`;

    const response = await fetch(tokenUrl);
    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    return await response.json();
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('instagram_access_token');
    const expires = localStorage.getItem('instagram_token_expires');

    if (!token || !expires) {
      return false;
    }

    // Check if token is expired
    if (Date.now() > parseInt(expires)) {
      this.logout();
      return false;
    }

    this.accessToken = token;
    return true;
  }

  // Logout
  logout() {
    localStorage.removeItem('instagram_access_token');
    localStorage.removeItem('instagram_token_expires');
    this.accessToken = null;
  }

  // Get current access token
  getAccessToken() {
    return this.accessToken;
  }
}

// Export for use in other modules
window.InstagramAuth = InstagramAuth;