// Instagram Graph API Client Module
class InstagramAPI {
  constructor(auth) {
    this.auth = auth;
    this.baseUrl = 'https://graph.instagram.com/v18.0';
    this.rateLimitDelay = 1000; // 1 second between requests
    this.lastRequestTime = 0;
  }

  // Rate limiting helper
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  // Search hashtags
  async searchHashtags(query) {
    if (!this.auth.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    await this.waitForRateLimit();

    const url = `${this.baseUrl}/ig_hashtag_search?q=${encodeURIComponent(query)}&access_token=${this.auth.getAccessToken()}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Hashtag search failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Hashtag search error:', error);
      throw error;
    }
  }

  // Get hashtag media (top posts)
  async getHashtagMedia(hashtagId, limit = 10) {
    if (!this.auth.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    await this.waitForRateLimit();

    const url = `${this.baseUrl}/${hashtagId}/top_media?fields=id,media_type,media_url,permalink,caption,timestamp,like_count,comments_count&limit=${limit}&access_token=${this.auth.getAccessToken()}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Media fetch failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Media fetch error:', error);
      throw error;
    }
  }

  // Get recent hashtag media
  async getRecentHashtagMedia(hashtagId, limit = 10) {
    if (!this.auth.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    await this.waitForRateLimit();

    const url = `${this.baseUrl}/${hashtagId}/recent_media?fields=id,media_type,media_url,permalink,caption,timestamp,like_count,comments_count&limit=${limit}&access_token=${this.auth.getAccessToken()}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Recent media fetch failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Recent media fetch error:', error);
      throw error;
    }
  }

  // Search for leads based on keywords
  async searchLeads(keywords, limit = 20) {
    const results = [];

    for (const keyword of keywords) {
      try {
        // Search for hashtag
        const hashtags = await this.searchHashtags(keyword);
        if (hashtags.length === 0) continue;

        // Get media for first hashtag
        const hashtagId = hashtags[0].id;
        const media = await this.getHashtagMedia(hashtagId, Math.ceil(limit / keywords.length));

        // Convert to lead format
        for (const post of media) {
          if (results.length >= limit) break;

          const lead = {
            id: post.id,
            segment: keyword,
            matchScore: this.calculateMatchScore(post.caption || '', keyword),
            source: 'instagram',
            sourceUrl: post.permalink,
            sourceText: post.caption || '',
            matchReasons: this.findMatchReasons(post.caption || '', keyword),
            recommended: this.calculateMatchScore(post.caption || '', keyword) > 0.5
          };

          results.push(lead);
        }
      } catch (error) {
        console.error(`Error searching for ${keyword}:`, error);
      }
    }

    return results;
  }

  // Calculate match score (simple keyword matching)
  calculateMatchScore(text, keyword) {
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    if (lowerText.includes(lowerKeyword)) {
      return 0.8; // High match if keyword appears
    }

    // Check for related terms
    const relatedTerms = this.getRelatedTerms(keyword);
    for (const term of relatedTerms) {
      if (lowerText.includes(term)) {
        return 0.6;
      }
    }

    return 0.3; // Low match
  }

  // Find match reasons
  findMatchReasons(text, keyword) {
    const reasons = [];
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    if (lowerText.includes(lowerKeyword)) {
      reasons.push(keyword);
    }

    const relatedTerms = this.getRelatedTerms(keyword);
    for (const term of relatedTerms) {
      if (lowerText.includes(term)) {
        reasons.push(term);
      }
    }

    return reasons;
  }

  // Get related search terms
  getRelatedTerms(keyword) {
    const termMap = {
      'art': ['アート', '絵画', '作品', '創作'],
      'wall': ['壁', 'インテリア', '飾り', 'ディスプレイ'],
      'decoration': ['装飾', 'デコレーション', '飾る'],
      'home': ['家', '住宅', '新居', 'インテリア'],
      'wedding': ['結婚', 'ウェディング', '結婚式'],
      'gift': ['プレゼント', 'ギフト', '贈り物']
    };

    return termMap[keyword.toLowerCase()] || [];
  }
}

// Export for use in other modules
window.InstagramAPI = InstagramAPI;