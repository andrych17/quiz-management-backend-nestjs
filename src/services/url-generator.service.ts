import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DebugLogger } from '../lib/debug-logger';

@Injectable()
export class UrlGeneratorService {
  private readonly frontendUrl: string;
  private readonly tinyUrlApiToken: string;
  private readonly enableTinyUrl: boolean;

  constructor(private configService: ConfigService) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    this.tinyUrlApiToken = this.configService.get<string>('TINYURL_API_TOKEN');
    this.enableTinyUrl =
      this.configService.get<string>('ENABLE_TINYURL') === 'true';
  }

  /**
   * Generate normal URL for quiz access
   */
  generateNormalUrl(quizSlug: string, quizToken: string): string {
    // Use token only format for cleaner URLs
    return `${this.frontendUrl}/quiz/${quizToken}`;
  }

  /**
   * Generate short URL using TinyURL API
   */
  async generateShortUrl(
    normalUrl: string,
    alias?: string,
  ): Promise<string | null> {
    // Check if TinyURL is enabled
    if (!this.enableTinyUrl) {
      DebugLogger.debug(
        'UrlGeneratorService',
        'TinyURL is disabled in configuration',
      );
      return null;
    }

    if (!this.tinyUrlApiToken) {
      DebugLogger.warn(
        'UrlGeneratorService',
        'TinyURL API token not configured',
      );
      return null;
    }

    try {
      const response = await fetch('https://api.tinyurl.com/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.tinyUrlApiToken}`,
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
        DebugLogger.warn(
          'UrlGeneratorService',
          'TinyURL API error',
          result.errors || result,
        );
        return null;
      }
    } catch (error) {
      DebugLogger.error(
        'UrlGeneratorService',
        'Error generating short URL',
        error.message,
      );
      return null;
    }
  }

  /**
   * Generate both normal and short URLs for a quiz
   */
  async generateQuizUrls(
    quizSlug: string,
    quizToken: string,
    quizId: number,
    alias?: string,
  ): Promise<{
    normalUrl: string;
    shortUrl: string;
  }> {
    const normalUrl = this.generateNormalUrl(quizSlug, quizToken);
    const generatedAlias = alias || this.generateUrlAlias(quizId, quizToken);
    const shortUrlResult = await this.generateShortUrl(
      normalUrl,
      generatedAlias,
    );

    return {
      normalUrl,
      shortUrl: shortUrlResult || '', // Empty string if TinyURL fails
    };
  }

  /**
   * Generate unique alias from quiz ID and token for short URL
   */
  generateUrlAlias(quizId: number, quizToken: string): string {
    // Generate hash dari quiz ID + first 8 chars of token untuk uniqueness
    const uniquePart = `${quizId}-${quizToken.substring(0, 8)}`;
    return `quiz-${uniquePart}`;
  }
}
