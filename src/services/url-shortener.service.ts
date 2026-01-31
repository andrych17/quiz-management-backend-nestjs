import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { DebugLogger } from '../lib/debug-logger';

@Injectable()
export class UrlShortenerService {
  private readonly tinyUrlApiToken: string;
  private readonly tinyUrlApiBase = 'https://api.tinyurl.com';

  constructor() {
    // Initialize TinyURL API token
    this.tinyUrlApiToken =
      process.env.TINYURL_API_TOKEN ||
      'f5AaG8A2durI2CEOTP8qasCNVIuVvOMoQtp9RT19sLXXYXARE0C1l3VPWOpI';
  }

  async shortenUrl(longUrl: string, alias?: string): Promise<string> {
    try {
      if (!this.tinyUrlApiToken) {
        DebugLogger.warn(
          'UrlShortenerService',
          'TinyURL not configured, returning original URL',
        );
        return longUrl;
      }

      const payload: any = {
        url: longUrl,
        domain: 'tinyurl.com',
      };

      // Add alias if provided
      if (alias) {
        payload.alias = alias;
      }

      const response = await axios.post(
        `${this.tinyUrlApiBase}/create`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.tinyUrlApiToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data && response.data.data && response.data.data.tiny_url) {
        return response.data.data.tiny_url;
      }

      // Fallback to original URL if API response is unexpected
      return longUrl;
    } catch (error) {
      DebugLogger.error(
        'UrlShortenerService',
        'Error shortening URL',
        error.response?.data || error.message,
      );
      return longUrl;
    }
  }

  /**
   * Generate a quiz link using the app's base URL and quiz token
   */
  generateQuizUrl(token: string): string {
    const baseUrl = process.env.APP_URL || 'https://quiz.gms.com';
    return `${baseUrl}/q/${token}`;
  }

  /**
   * Generate and shorten a quiz link with optional alias
   */
  async generateAndShortenQuizUrl(
    token: string,
    alias?: string,
  ): Promise<string> {
    const longUrl = this.generateQuizUrl(token);
    return await this.shortenUrl(longUrl, alias);
  }

  /**
   * Create a custom short link (fallback method without external service)
   */
  generateCustomShortUrl(token: string): string {
    const baseUrl = process.env.APP_URL || 'https://quiz.gms.com';
    // Create a shorter custom format
    return `${baseUrl}/s/${token}`;
  }
}
