/*global chai, describe, require, it, beforeEach, afterEach, sinon, $ */
/*jshint -W110 */

var expect = chai.expect;

require(
  [
    "esri/config",
    "application/FeatureService",
  ],
  function(esriConfig, FeatureService) {
    "use strict";

    // esri throwing errors in testing environment without this.
    // basically set up a fake proxy.
    //TODO: There's got to be a better way to do this
    var PROXY_URL = "http://proxy";
    esriConfig.defaults.io.proxyUrl = PROXY_URL;
    esriConfig.defaults.io.alwaysUseProxy = false;

    var JSON_HEADER = {
      'Content-Type': 'application/json; charset=utf-8'
    };
    var URL = 'http://localhost/fakeservice/';

    describe("FeatureService", function() {
      it("should be constructed", function() {
        var service = new FeatureService(URL);
        expect(service.url).to.equal(URL);
      });
    });
  }
);
