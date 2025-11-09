import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UrlGeneratorService {
  private readonly frontendUrl: string;
  private readonly tinyUrlApiToken: string;

  constructor(private configService: ConfigService) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    this.tinyUrlApiToken = this.configService.get<string>('TINYURL_API_TOKEN');
  }

  /**
   * Generate normal URL for quiz access
   */
  generateNormalUrl(quizSlug: string, quizToken: string): string {
    return `${this.frontendUrl}/quiz/${quizSlug}-${quizToken}`;
  }

  /**
   * Generate short URL using TinyURL API
   */
  async generateShortUrl(normalUrl: string, alias?: string): Promise<string> {
    if (!this.tinyUrlApiToken) {
      // Fallback to normal URL if TinyURL token not configured
      return normalUrl;
    }

    try {
      const response = await fetch('https://api.tinyurl.com/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.tinyUrlApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: normalUrl,
          domain: 'tinyurl.com',
          alias: alias || undefined,
          description: 'Quiz Link',
        }),
      });

      const result = await response.json();
      
      if (result.data && result.data.tiny_url) {
        return result.data.tiny_url;
      } else {
        console.warn('TinyURL API error:', result);
        return normalUrl;
      }
    } catch (error) {
      console.error('Error generating short URL:', error);
      return normalUrl; // Fallback to normal URL
    }
  }

  /**
   * Generate both normal and short URLs for a quiz
   */
  async generateQuizUrls(quizSlug: string, quizToken: string, alias?: string): Promise<{
    normalUrl: string;
    shortUrl: string;
  }> {
    const normalUrl = this.generateNormalUrl(quizSlug, quizToken);
    const shortUrl = await this.generateShortUrl(normalUrl, alias);

    return {
      normalUrl,
      shortUrl,
    };
  }

  /**
   * Generate alias from quiz title for short URL
   */
  generateUrlAlias(quizTitle: string): string {
    return quizTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 20); // Limit length for TinyURL
  }
}