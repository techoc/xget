import { describe, expect, it } from 'vitest';
import { resolveTarget } from '../../src/routing/resolve-target.js';
import { PLATFORM_CATALOG as PLATFORMS } from '../../src/config/platform-catalog.js';

describe('Gradle Smart Routing', () => {
  it('should route distribution files to services.gradle.org', () => {
    const url = new URL('https://xget.example.com/gradle/distributions/gradle-9.8.0-bin.zip');
    const result = resolveTarget(url, '/gradle/distributions/gradle-9.8.0-bin.zip', PLATFORMS);

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.platform).toBe('gradle');
    expect(result.targetUrl).toBe('https://services.gradle.org/distributions/gradle-9.8.0-bin.zip');
  });

  it('should route /dist/ paths to services.gradle.org', () => {
    const url = new URL('https://xget.example.com/gradle/dist/gradle-9.8.0-bin.zip');
    const result = resolveTarget(url, '/gradle/dist/gradle-9.8.0-bin.zip', PLATFORMS);

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.platform).toBe('gradle');
    expect(result.targetUrl).toBe('https://services.gradle.org/dist/gradle-9.8.0-bin.zip');
  });

  it('should route plugin paths to plugins.gradle.org', () => {
    const url = new URL('https://xget.example.com/gradle/plugins/com.example.plugin');
    const result = resolveTarget(url, '/gradle/plugins/com.example.plugin', PLATFORMS);

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.platform).toBe('gradle');
    expect(result.targetUrl).toBe('https://plugins.gradle.org/plugins/com.example.plugin');
  });

  it('should route wrapper paths to plugins.gradle.org', () => {
    const url = new URL('https://xget.example.com/gradle/wrapper/dists/gradle-8.0-bin.zip');
    const result = resolveTarget(url, '/gradle/wrapper/dists/gradle-8.0-bin.zip', PLATFORMS);

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.platform).toBe('gradle');
    expect(result.targetUrl).toBe('https://plugins.gradle.org/wrapper/dists/gradle-8.0-bin.zip');
  });

  it('should preserve query parameters for distribution files', () => {
    const url = new URL(
      'https://xget.example.com/gradle/distributions/gradle-9.8.0-bin.zip?redirect=true'
    );
    const result = resolveTarget(url, '/gradle/distributions/gradle-9.8.0-bin.zip', PLATFORMS);

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.targetUrl).toBe(
      'https://services.gradle.org/distributions/gradle-9.8.0-bin.zip?redirect=true'
    );
  });

  it('should handle nested distribution paths', () => {
    const url = new URL('https://xget.example.com/gradle/distributions/vfs/gradle-9.8.0-bin.zip');
    const result = resolveTarget(url, '/gradle/distributions/vfs/gradle-9.8.0-bin.zip', PLATFORMS);

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.targetUrl).toBe(
      'https://services.gradle.org/distributions/vfs/gradle-9.8.0-bin.zip'
    );
  });

  it('should not have gradle-dist platform', () => {
    expect(PLATFORMS).not.toHaveProperty('gradle-dist');
  });
});
