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
const GRADLE_PLUGINS_URL = 'https://plugins.gradle.org';
const GRADLE_SERVICES_URL = 'https://services.gradle.org';
const PYPI_URL = 'https://pypi.org';
const PYPI_FILES_URL = 'https://files.pythonhosted.org';
const CONDA_MAIN_URL = 'https://repo.anaconda.com';
const CONDA_COMMUNITY_URL = 'https://conda.anaconda.org';
const HOMEBREW_URL = 'https://github.com/Homebrew';
const HOMEBREW_API_URL = 'https://formulae.brew.sh';
const HOMEBREW_BOTTLES_URL = 'https://ghcr.io';

/**
 * Determines the appropriate Gradle upstream URL based on the request path.
 * Distribution paths (e.g., /distributions/) go to services.gradle.org,
 * while plugin paths go to plugins.gradle.org.
 * @param {string} targetPath - The path after stripping the platform prefix.
 * @returns {string} The base URL for the Gradle upstream.
 */
function resolveGradleBaseUrl(targetPath) {
  // Distribution-related paths should go to services.gradle.org
  if (targetPath.startsWith('/distributions/') || targetPath.startsWith('/dist/')) {
    return GRADLE_SERVICES_URL;
  }
  return GRADLE_PLUGINS_URL;
}

/**
 * Determines the appropriate PyPI upstream URL based on the request path.
 * Package files (e.g., /packages/) go to files.pythonhosted.org,
 * while project pages and simple index go to pypi.org.
 * @param {string} targetPath - The path after stripping the platform prefix.
 * @returns {string} The base URL for the PyPI upstream.
 */
function resolvePypiBaseUrl(targetPath) {
  // Package download files should go to files.pythonhosted.org
  if (targetPath.startsWith('/packages/') || targetPath.startsWith('/pkg/')) {
    return PYPI_FILES_URL;
  }
  return PYPI_URL;
}

/**
 * Determines the appropriate Conda upstream URL based on the request path.
 * Main channel paths go to repo.anaconda.com,
 * while community channels go to conda.anaconda.org.
 * @param {string} targetPath - The path after stripping the platform prefix.
 * @returns {string} The base URL for the Conda upstream.
 */
function resolveCondaBaseUrl(targetPath) {
  // Main and pkgs channels go to repo.anaconda.com
  if (targetPath.startsWith('/main/') || targetPath.startsWith('/pkgs/')) {
    return CONDA_MAIN_URL;
  }
  // Community channels (conda-forge, etc.) go to conda.anaconda.org
  return CONDA_COMMUNITY_URL;
}

/**
 * Determines the appropriate Homebrew upstream URL based on the request path.
 * API paths go to formulae.brew.sh, bottles go to ghcr.io,
 * and other paths go to github.com/Homebrew.
 * @param {string} targetPath - The path after stripping the platform prefix.
 * @returns {string} The base URL for the Homebrew upstream.
 */
function resolveHomebrewBaseUrl(targetPath) {
  // API paths go to formulae.brew.sh
  if (targetPath.startsWith('/api/')) {
    return HOMEBREW_API_URL;
  }
  // Bottle paths go to ghcr.io
  if (
    targetPath.startsWith('/bottles/') ||
    targetPath.startsWith('/linuxbrew-bottles/') ||
    targetPath.startsWith('/homebrew-core/')
  ) {
    return HOMEBREW_BOTTLES_URL;
  }
  return HOMEBREW_URL;
}

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
 * Resolves a proxy platform path to the target URL contained in the path.
 * @param {string} effectivePath
 * @param {URL} url
 * @returns {{ targetUrl: string, cacheTargetUrl: string } | { response: Response }} Resolved target URLs or an early error response.
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

  // Use smart routing for platforms with multiple upstreams
  let baseUrl;
  if (platform === 'gradle') {
    baseUrl = resolveGradleBaseUrl(targetPath);
  } else if (platform === 'pypi') {
    baseUrl = resolvePypiBaseUrl(targetPath);
  } else if (platform === 'conda') {
    baseUrl = resolveCondaBaseUrl(targetPath);
  } else if (platform === 'homebrew') {
    baseUrl = resolveHomebrewBaseUrl(targetPath);
  } else {
    baseUrl = platforms[platform];
  }

  const targetUrl = `${baseUrl}${targetPath}${url.search}`;
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
