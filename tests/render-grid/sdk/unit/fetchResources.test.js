const {describe, it, before, after} = require('mocha');
const fetchResources = require('../../../../src/render-grid/sdk/fetchResources');
const {expect} = require('chai');
const {mapValues} = require('lodash');
const testServer = require('../../../util/testServer');
const {loadFixtureBuffer} = require('../../../util/loadFixture');

describe('fetchResources', () => {
  let baseUrl, closeServer;
  before(async () => {
    const server = await testServer();
    baseUrl = `http://localhost:${server.port}`;
    closeServer = server.close;
  });

  after(() => {
    closeServer();
  });

  it('works', async () => {
    const jpgName = 'smurfs.jpg';
    const cssName = 'test.css';
    const jsonName = 'test.cdt.json';
    const jsName = 'test.js';
    const jpgUrl = `${baseUrl}/${jpgName}`;
    const cssUrl = `${baseUrl}/${cssName}`;
    const jsonUrl = `${baseUrl}/${jsonName}`;
    const jsUrl = `${baseUrl}/${jsName}`;
    const jpgContent = loadFixtureBuffer(jpgName);
    const cssContent = loadFixtureBuffer(cssName);
    const jsonContent = loadFixtureBuffer(jsonName);
    const jsContent = loadFixtureBuffer(jsName);

    const expected = mapValues(
      {
        [jpgUrl]: {type: 'image/jpeg', value: jpgContent},
        [cssUrl]: {type: 'text/css; charset=UTF-8', value: cssContent},
        [jsonUrl]: {type: 'application/json; charset=UTF-8', value: jsonContent},
        [jsUrl]: {type: 'application/javascript; charset=UTF-8', value: jsContent},
      },
      (o, url) => ({type: o.type, value: o.value, url}),
    );

    const resources = await fetchResources([jpgUrl, cssUrl, jsonUrl, jsUrl]);

    expect(resources).to.deep.equal(expected);
  });
});