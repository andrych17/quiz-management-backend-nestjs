import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('system')
@Controller('api')
export class VersionController {
  private readonly logger = new Logger(VersionController.name);
  private readonly pkg: Record<string, any>;
  private readonly changelog: string;

  constructor() {
    // Read package.json once at startup
    try {
      const pkgPath = path.join(process.cwd(), 'package.json');
      this.pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    } catch (err) {
      this.logger.warn(`Could not read package.json: ${err.message}`);
      this.pkg = { name: 'quiz-be', version: 'unknown' };
    }

    // Read CHANGELOG.md once at startup
    try {
      const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
      this.changelog = fs.readFileSync(changelogPath, 'utf8');
    } catch (err) {
      this.logger.warn(`Could not read CHANGELOG.md: ${err.message}`);
      this.changelog = 'No changelog available.';
    }
  }

  @Get('version')
  @ApiOperation({
    summary: 'Get app version',
    description: 'Returns current app version, Node.js version, environment, and uptime.',
  })
  @ApiResponse({ status: 200, description: 'Version info returned successfully' })
  getVersion() {
    return {
      success: true,
      data: {
        name: this.pkg.name,
        version: this.pkg.version,
        description: this.pkg.description || '',
        node: process.version,
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.floor(process.uptime()),
        uptimeHuman: this.formatUptime(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('changelog')
  @ApiOperation({
    summary: 'Get changelog',
    description: 'Returns the full CHANGELOG.md content as plain text and parsed list of versions.',
  })
  @ApiResponse({ status: 200, description: 'Changelog returned successfully' })
  getChangelog() {
    const versions = this.parseChangelog(this.changelog);
    return {
      success: true,
      data: {
        raw: this.changelog,
        versions,
      },
    };
  }

  /**
   * Parse CHANGELOG.md into structured version entries
   */
  private parseChangelog(content: string): Array<{
    version: string;
    date: string;
    sections: Record<string, string[]>;
  }> {
    const versions: Array<{ version: string; date: string; sections: Record<string, string[]> }> = [];
    const versionBlocks = content.split(/\n(?=## \[)/);

    for (const block of versionBlocks) {
      const headerMatch = block.match(/^## \[(.+?)\]\s*-\s*(\d{4}-\d{2}-\d{2})/);
      if (!headerMatch) continue;

      const version = headerMatch[1];
      const date = headerMatch[2];
      const sections: Record<string, string[]> = {};

      let currentSection = '';
      for (const line of block.split('\n')) {
        const sectionMatch = line.match(/^### (.+)/);
        if (sectionMatch) {
          currentSection = sectionMatch[1];
          sections[currentSection] = [];
        } else if (currentSection && line.startsWith('- ')) {
          sections[currentSection].push(line.replace(/^- /, '').trim());
        }
      }

      versions.push({ version, date, sections });
    }

    return versions;
  }

  private formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts: string[] = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  }
}
