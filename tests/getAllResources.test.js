const {describe, it, afterEach} = require('mocha');
const {expect} = require('chai');
const fs = require('fs');
const path = require('path');
const {mapValues, omit} = require('lodash');
const getAllResources = require('../src/server/getAllResources');
const clearCache = getAllResources.clearCache;
const {RGridResource} = require('@applitools/eyes.sdk.core');
const testServer = require('./testServer');

function toRGridResource({url, type, value}) {
  const resource = new RGridResource();
  resource.setUrl(url);
  resource.setContentType(type);
  resource.setContent(value);
  resource.getSha256Hash();
  return resource;
}

describe('getAllResources', () => {
  let baseUrl, closeServer;

  afterEach(() => {
    clearCache();
  });

  it('works for absolute urls', async () => {
    const server = await testServer();
    baseUrl = `http://localhost:${server.port}`;
    closeServer = server.close;

    const jpgName = 'smurfs.jpg';
    const cssName = 'test.css';
    const jsonName = 'test.cdt.json';
    const jsName = 'test.js';
    const jpgUrl = `${baseUrl}/${jpgName}`;
    const cssUrl = `${baseUrl}/${cssName}`;
    const jsonUrl = `${baseUrl}/${jsonName}`;
    const jsUrl = `${baseUrl}/${jsName}`;
    const jpgContent = fs.readFileSync(path.resolve(__dirname, 'fixtures', jpgName));
    const cssContent = fs.readFileSync(path.resolve(__dirname, 'fixtures', cssName));
    const jsonContent = fs.readFileSync(path.resolve(__dirname, 'fixtures', jsonName));
    const jsContent = fs.readFileSync(path.resolve(__dirname, 'fixtures', jsName));

    const expected = mapValues(
      {
        [jpgUrl]: {type: 'image/jpeg', value: jpgContent, url: jpgUrl},
        [cssUrl]: {type: 'text/css; charset=UTF-8', value: cssContent, url: cssUrl},
        [jsonUrl]: {type: 'application/json; charset=UTF-8', value: jsonContent, url: jsonUrl},
        [jsUrl]: {type: 'application/javascript; charset=UTF-8', value: jsContent, url: jsUrl},
      },
      toRGridResource,
    );

    try {
      const resources = await getAllResources([jpgUrl, cssUrl, jsonUrl, jsUrl]);
      expect(resources).to.deep.equal(expected);
    } catch (ex) {
      throw ex;
    } finally {
      closeServer();
    }
  });

  it('works for relative urls', async () => {
    const server = await testServer();
    baseUrl = `http://localhost:${server.port}`;
    closeServer = server.close;

    const url = 'smurfs.jpg';
    const absoluteUrl = `${baseUrl}/${url}`;
    const expected = {
      [absoluteUrl]: toRGridResource({
        url: absoluteUrl,
        type: 'image/jpeg',
        value: fs.readFileSync(path.resolve(__dirname, 'fixtures/smurfs.jpg')),
      }),
    };

    try {
      const resources = await getAllResources([url], baseUrl);
      expect(resources).to.deep.equal(expected);
    } catch (ex) {
      throw ex;
    } finally {
      closeServer();
    }
  });

  it('fetches with cache', async () => {
    const server = await testServer();
    baseUrl = `http://localhost:${server.port}`;
    closeServer = server.close;

    const url = `${baseUrl}/test.js`;
    const expected = {
      [url]: toRGridResource({
        url,
        type: 'application/javascript; charset=UTF-8',
        value: fs.readFileSync(path.resolve(__dirname, 'fixtures/test.js')),
      }),
    };

    try {
      const resources = await getAllResources([url]);
      expect(resources).to.deep.equal(expected);
    } catch (ex) {
      throw ex;
    } finally {
      closeServer();
    }

    const expectedFromCache = mapValues(expected, rGridResource => {
      rGridResource._content = null; // yuck! but this is the symmetrical yuck of getAllResources::fromCacheToRGridResource since we save resource in cache without content, but with SHA256
      return rGridResource;
    });

    const resourcesFromCache = await getAllResources([url]);
    expect(resourcesFromCache).to.deep.equal(expectedFromCache);
  });
});