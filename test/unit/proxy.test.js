import { describe, expect, it } from 'vitest';
import { resolveTarget } from '../../src/routing/resolve-target.js';
import { PLATFORM_CATALOG as PLATFORMS } from '../../src/config/platform-catalog.js';

describe('Proxy Platform', () => {
  it('should be defined in platform catalog', () => {
    expect(PLATFORMS).toHaveProperty('proxy');
  });

  describe('resolveProxyTarget', () => {
    it('should resolve a simple HTTPS URL', () => {
      const url = new URL('https://xget.example.com/proxy/https%3A%2F%2Fexample.com%2Fpath');
      const result = resolveTarget(url, '/proxy/https%3A%2F%2Fexample.com%2Fpath', PLATFORMS);

      expect('response' in result).toBe(false);
      if ('response' in result) {
        return;
      }
      expect(result.platform).toBe('proxy');
      expect(result.targetUrl).toBe('https://example.com/path');
    });

    it('should resolve a URL with query parameters', () => {
      const encodedUrl = encodeURIComponent('https://api.example.com/v1/data?key=123');
      const url = new URL(`https://xget.example.com/proxy/${encodedUrl}`);
      const result = resolveTarget(url, `/proxy/${encodedUrl}`, PLATFORMS);

      expect('response' in result).toBe(false);
      if ('response' in result) {
        return;
      }
      expect(result.targetUrl).toBe('https://api.example.com/v1/data?key=123');
    });

    it('should preserve original query string', () => {
      const encodedUrl = encodeURIComponent('https://example.com/api');
      const url = new URL(`https://xget.example.com/proxy/${encodedUrl}?cache=true`);
      const result = resolveTarget(url, `/proxy/${encodedUrl}`, PLATFORMS);

      expect('response' in result).toBe(false);
      if ('response' in result) {
        return;
      }
      expect(result.targetUrl).toBe('https://example.com/api?cache=true');
    });

    it('should reject empty proxy path', () => {
      const url = new URL('https://xget.example.com/proxy/');
      const result = resolveTarget(url, '/proxy/', PLATFORMS);

      expect('response' in result).toBe(true);
      if ('response' in result) {
        expect(result.response.status).toBe(400);
      }
    });

    it('should reject invalid URL encoding', () => {
      const url = new URL('https://xget.example.com/proxy/%ZZZZ');
      const result = resolveTarget(url, '/proxy/%ZZZZ', PLATFORMS);

      // decodeURIComponent throws, so we should get a 400 error
      expect('response' in result).toBe(true);
      if ('response' in result) {
        expect(result.response.status).toBe(400);
      }
    });

    it('should reject non-HTTP protocols', () => {
      const encodedUrl = encodeURIComponent('ftp://example.com/file.txt');
      const url = new URL(`https://xget.example.com/proxy/${encodedUrl}`);
      const result = resolveTarget(url, `/proxy/${encodedUrl}`, PLATFORMS);

      expect('response' in result).toBe(true);
      if ('response' in result) {
        expect(result.response.status).toBe(400);
      }
    });

    it('should reject file:// protocol', () => {
      const encodedUrl = encodeURIComponent('file:///etc/passwd');
      const url = new URL(`https://xget.example.com/proxy/${encodedUrl}`);
      const result = resolveTarget(url, `/proxy/${encodedUrl}`, PLATFORMS);

      expect('response' in result).toBe(true);
      if ('response' in result) {
        expect(result.response.status).toBe(400);
      }
    });

    it('should accept HTTP protocol', () => {
      const encodedUrl = encodeURIComponent('http://example.com/path');
      const url = new URL(`https://xget.example.com/proxy/${encodedUrl}`);
      const result = resolveTarget(url, `/proxy/${encodedUrl}`, PLATFORMS);

      expect('response' in result).toBe(false);
      if ('response' in result) {
        return;
      }
      expect(result.targetUrl).toBe('http://example.com/path');
    });

    it('should handle complex URLs', () => {
      const encodedUrl = encodeURIComponent('https://github.com/user/repo/releases/download/v1.0/app.tar.gz');
      const url = new URL(`https://xget.example.com/proxy/${encodedUrl}`);
      const result = resolveTarget(url, `/proxy/${encodedUrl}`, PLATFORMS);

      expect('response' in result).toBe(false);
      if ('response' in result) {
        return;
      }
      expect(result.targetUrl).toBe(
        'https://github.com/user/repo/releases/download/v1.0/app.tar.gz'
      );
    });
  });
});
