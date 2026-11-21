/**
 * Xget - High-performance acceleration engine for developer resources
 * Copyright (C) Xi Xu
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { SORTED_PLATFORMS } from './platform-index.js';
import { transformPath } from './platform-transformers.js';
import { normalizeRegistryApiPath } from '../protocols/docker.js';
import { shouldVaryCacheByOrigin } from '../upstream/cache-policy.js';
import { createErrorResponse } from '../utils/security.js';

export const HOME_PAGE_URL = 'https://github.com/xixu-me/Xget';

/**
 * Creates the canonical homepage redirect response.
 * @returns {Response} Redirect response to the Xget homepage.
 */
export function createHomepageRedirect() {
  return Response.redirect(HOME_PAGE_URL, 302);
}

/**
 * Normalizes request paths before platform routing.
 * @param {URL} url
 * @param {boolean} isDocker
 * @returns {{ effectivePath: string } | { response: Response }} Normalized path or an early error response.
 */
export function normalizeEffectivePath(url, isDocker) {
  let effectivePath = url.pathname;

  if (!isDocker) {
    return { effectivePath };
  }

  if (
    !url.pathname.startsWith('/cr/') &&
    !url.pathname.startsWith('/v2/cr/') &&
    url.pathname !== '/v2/auth'
  ) {
    return {
      response: createErrorResponse('container registry requests must use /cr/ prefix', 400)
    };
  }

  effectivePath = url.pathname.replace(/^\/v2/, '');

  if (url.pathname.startsWith('/v2/cr/')) {
    effectivePath = effectivePath.replace(/^\/cr\/([^/]+)\//, '/cr/$1/v2/');
  }

  return { effectivePath };
}

/**
 * Resolves an effective request path to an upstream target URL.
 * @param {URL} url
 * @param {string} effectivePath
 * @param {{ [key: string]: string }} platforms
 * @returns {{
 *   cacheTargetUrl: string,
 *   platform: string,
 *   shouldVaryCacheByOrigin: boolean,
 *   targetPath: string,
 *   targetUrl: string
 * } | { response: Response }} Target metadata or an early redirect response.
 */
/**
 * Resolves a proxy platform path to the target URL contained in the path.
 * @param {string} effectivePath
 * @param {URL} url
 * @returns {{ targetUrl: string, cacheTargetUrl: string } | { response: Response }}
 */
function resolveProxyTarget(effectivePath, url) {
  const proxyPrefix = '/proxy/';
  const encodedTarget = effectivePath.slice(proxyPrefix.length);

  if (!encodedTarget) {
    return { response: createErrorResponse('proxy target URL is required', 400) };
  }

  let targetUrl;
  try {
    targetUrl = decodeURIComponent(encodedTarget);
  } catch {
    return { response: createErrorResponse('invalid proxy target URL encoding', 400) };
  }

  // Validate the target URL
  let parsedTarget;
  try {
    parsedTarget = new URL(targetUrl);
  } catch {
    return { response: createErrorResponse('invalid proxy target URL', 400) };
  }

  // Only allow HTTP and HTTPS protocols
  if (parsedTarget.protocol !== 'http:' && parsedTarget.protocol !== 'https:') {
    return { response: createErrorResponse('proxy only supports http and https protocols', 400) };
  }

  // Build the final target URL with the original query string
  const finalTargetUrl = `${parsedTarget.origin}${parsedTarget.pathname}${parsedTarget.search}${url.search}`;
  const cacheTargetUrl = finalTargetUrl;

  return {
    targetUrl: finalTargetUrl,
    cacheTargetUrl
  };
}

export function resolveTarget(url, effectivePath, platforms) {
  const platform =
    SORTED_PLATFORMS.find(key => {
      const expectedPrefix = `/${key.replace('-', '/')}/`;
      return effectivePath.startsWith(expectedPrefix);
    }) || effectivePath.split('/')[1];

  if (!platform || !Object.prototype.hasOwnProperty.call(platforms, platform)) {
    return { response: createHomepageRedirect() };
  }

  // Handle proxy platform specially - the target URL is encoded in the path
  if (platform === 'proxy') {
    const proxyResult = resolveProxyTarget(effectivePath, url);
    if ('response' in proxyResult) {
      return proxyResult;
    }
    return {
      cacheTargetUrl: proxyResult.cacheTargetUrl,
      platform: 'proxy',
      shouldVaryCacheByOrigin: false,
      targetPath: '',
      targetUrl: proxyResult.targetUrl
    };
  }

  const platformPath = `/${platform.replace(/-/g, '/')}`;
  if (effectivePath === platformPath || effectivePath === `${platformPath}/`) {
    return { response: createHomepageRedirect() };
  }

  const transformedPath = transformPath(effectivePath, platform);
  const targetPath = platform.startsWith('cr-')
    ? normalizeRegistryApiPath(platform, transformedPath)
    : transformedPath;
  const targetUrl = `${platforms[platform]}${targetPath}${url.search}`;
  const varyCacheByOrigin = shouldVaryCacheByOrigin(platform, effectivePath);
  const cacheTargetUrl = varyCacheByOrigin
    ? `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}__xget_origin=${encodeURIComponent(url.origin)}`
    : targetUrl;

  return {
    cacheTargetUrl,
    platform,
    shouldVaryCacheByOrigin: varyCacheByOrigin,
    targetPath,
    targetUrl
  };
}
