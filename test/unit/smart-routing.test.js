import { describe, expect, it } from 'vitest';
import { resolveTarget } from '../../src/routing/resolve-target.js';
import { PLATFORM_CATALOG as PLATFORMS } from '../../src/config/platform-catalog.js';

describe('PyPI Smart Routing', () => {
  it('should route project pages to pypi.org', () => {
    const url = new URL('https://xget.example.com/pypi/project/requests');
    const result = resolveTarget(url, '/pypi/project/requests', PLATFORMS);

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.platform).toBe('pypi');
    expect(result.targetUrl).toBe('https://pypi.org/project/requests');
  });

  it('should route simple index to pypi.org', () => {
    const url = new URL('https://xget.example.com/pypi/simple/requests');
    const result = resolveTarget(url, '/pypi/simple/requests', PLATFORMS);

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.platform).toBe('pypi');
    expect(result.targetUrl).toBe('https://pypi.org/simple/requests');
  });

  it('should route package files to files.pythonhosted.org', () => {
    const url = new URL(
      'https://xget.example.com/pypi/packages/py/requests/requests-2.28.0-py3-none-any.whl'
    );
    const result = resolveTarget(
      url,
      '/pypi/packages/py/requests/requests-2.28.0-py3-none-any.whl',
      PLATFORMS
    );

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.platform).toBe('pypi');
    expect(result.targetUrl).toBe(
      'https://files.pythonhosted.org/packages/py/requests/requests-2.28.0-py3-none-any.whl'
    );
  });

  it('should route /pkg/ paths to files.pythonhosted.org', () => {
    const url = new URL('https://xget.example.com/pypi/pkg/requests-2.28.0.tar.gz');
    const result = resolveTarget(url, '/pypi/pkg/requests-2.28.0.tar.gz', PLATFORMS);

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.platform).toBe('pypi');
    expect(result.targetUrl).toBe('https://files.pythonhosted.org/pkg/requests-2.28.0.tar.gz');
  });

  it('should preserve query parameters for package files', () => {
    const url = new URL(
      'https://xget.example.com/pypi/packages/py/requests/requests-2.28.0-py3-none-any.whl?download=true'
    );
    const result = resolveTarget(
      url,
      '/pypi/packages/py/requests/requests-2.28.0-py3-none-any.whl',
      PLATFORMS
    );

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.targetUrl).toBe(
      'https://files.pythonhosted.org/packages/py/requests/requests-2.28.0-py3-none-any.whl?download=true'
    );
  });

  it('should not have pypi-files platform', () => {
    expect(PLATFORMS).not.toHaveProperty('pypi-files');
  });
});

describe('Conda Smart Routing', () => {
  it('should route main channel to repo.anaconda.com', () => {
    const url = new URL('https://xget.example.com/conda/main/linux-64/');
    const result = resolveTarget(url, '/conda/main/linux-64/', PLATFORMS);

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.platform).toBe('conda');
    expect(result.targetUrl).toBe('https://repo.anaconda.com/main/linux-64/');
  });

  it('should route pkgs channel to repo.anaconda.com', () => {
    const url = new URL('https://xget.example.com/conda/pkgs/main/linux-64/');
    const result = resolveTarget(url, '/conda/pkgs/main/linux-64/', PLATFORMS);

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.platform).toBe('conda');
    expect(result.targetUrl).toBe('https://repo.anaconda.com/pkgs/main/linux-64/');
  });

  it('should route conda-forge to conda.anaconda.org', () => {
    const url = new URL('https://xget.example.com/conda/conda-forge/linux-64/');
    const result = resolveTarget(url, '/conda/conda-forge/linux-64/', PLATFORMS);

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.platform).toBe('conda');
    expect(result.targetUrl).toBe('https://conda.anaconda.org/conda-forge/linux-64/');
  });

  it('should route bioconda to conda.anaconda.org', () => {
    const url = new URL('https://xget.example.com/conda/bioconda/linux-64/');
    const result = resolveTarget(url, '/conda/bioconda/linux-64/', PLATFORMS);

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.platform).toBe('conda');
    expect(result.targetUrl).toBe('https://conda.anaconda.org/bioconda/linux-64/');
  });

  it('should preserve query parameters for conda channels', () => {
    const url = new URL('https://xget.example.com/conda/conda-forge/linux-64/?subdir=linux-64');
    const result = resolveTarget(url, '/conda/conda-forge/linux-64/', PLATFORMS);

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.targetUrl).toBe(
      'https://conda.anaconda.org/conda-forge/linux-64/?subdir=linux-64'
    );
  });

  it('should not have conda-community platform', () => {
    expect(PLATFORMS).not.toHaveProperty('conda-community');
  });
});

describe('Homebrew Smart Routing', () => {
  it('should route tap paths to github.com/Homebrew', () => {
    const url = new URL('https://xget.example.com/homebrew/homebrew-core');
    const result = resolveTarget(url, '/homebrew/homebrew-core', PLATFORMS);

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.platform).toBe('homebrew');
    expect(result.targetUrl).toBe('https://github.com/Homebrew/homebrew-core');
  });

  it('should route API paths to formulae.brew.sh', () => {
    const url = new URL('https://xget.example.com/homebrew/api/formulae/');
    const result = resolveTarget(url, '/homebrew/api/formulae/', PLATFORMS);

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.platform).toBe('homebrew');
    expect(result.targetUrl).toBe('https://formulae.brew.sh/api/formulae/');
  });

  it('should route bottles paths to ghcr.io', () => {
    const url = new URL(
      'https://xget.example.com/homebrew/bottles/python@3.11_3.11.0.big_sur.bottle.tar.gz'
    );
    const result = resolveTarget(
      url,
      '/homebrew/bottles/python@3.11_3.11.0.big_sur.bottle.tar.gz',
      PLATFORMS
    );

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.platform).toBe('homebrew');
    expect(result.targetUrl).toBe(
      'https://ghcr.io/bottles/python@3.11_3.11.0.big_sur.bottle.tar.gz'
    );
  });

  it('should route linuxbrew-bottles paths to ghcr.io', () => {
    const url = new URL(
      'https://xget.example.com/homebrew/linuxbrew-bottles/python@3.11_3.11.0.x86_64_linux.bottle.tar.gz'
    );
    const result = resolveTarget(
      url,
      '/homebrew/linuxbrew-bottles/python@3.11_3.11.0.x86_64_linux.bottle.tar.gz',
      PLATFORMS
    );

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.platform).toBe('homebrew');
    expect(result.targetUrl).toBe(
      'https://ghcr.io/linuxbrew-bottles/python@3.11_3.11.0.x86_64_linux.bottle.tar.gz'
    );
  });

  it('should preserve query parameters for homebrew API', () => {
    const url = new URL('https://xget.example.com/homebrew/api/formulae/?page=1');
    const result = resolveTarget(url, '/homebrew/api/formulae/', PLATFORMS);

    expect('response' in result).toBe(false);
    if ('response' in result) {
      return;
    }
    expect(result.targetUrl).toBe('https://formulae.brew.sh/api/formulae/?page=1');
  });

  it('should not have homebrew-api platform', () => {
    expect(PLATFORMS).not.toHaveProperty('homebrew-api');
  });

  it('should not have homebrew-bottles platform', () => {
    expect(PLATFORMS).not.toHaveProperty('homebrew-bottles');
  });
});
