/*global chai, describe, require, it, beforeEach, afterEach, sinon, $ */
/*jshint -W110 */

var expect = chai.expect;

require(
  [
    "esri/config",
    "esri/graphic",
    "esri/geometry/Point",
    "esri/SpatialReference",
    "application/FeatureService",
    "dojo/text!data/200_adds_multi_layer_success.js"
  ],
  function(esriConfig, Graphic, Point, SpatialReference, FeatureService, multiAddsSuccessJSON) {
    "use strict";

    var WGS_84 = new SpatialReference(4326);

    // esri throwing errors in testing environment without this.
    // basically set up a fake proxy.
    var PROXY_URL = "http://proxy";
    esriConfig.defaults.io.proxyUrl = PROXY_URL;
    esriConfig.defaults.io.alwaysUseProxy = false;

    var JSON_HEADER = {
      'Content-Type': 'application/json; charset=utf-8'
    };
    var URL = 'http://localhost/fakeservice/';

    describe("basic", function() {
      it("should be constructed", function() {
        var service = new FeatureService(URL);
        expect(service.url).to.equal(URL);
      });
    });

    describe('applyEdits endpoint', function() {
      var server;

      describe('on http 200', function() {
        beforeEach(function() {
          server = sinon.fakeServer.create();
        });

        afterEach(function() {
          server.restore();
        });

        it('should handle multiple adds on multiple layers', function() {
          server.respondWith(PROXY_URL + "?" + URL + "/applyEdits",
            [200, JSON_HEADER, multiAddsSuccessJSON]);

          service = new FeatureService(URL);
          edits = [
            {
              id: 0,
              adds: [
                new Graphic(new Point(0,0, WGS_84), null, {})
              ]
            },
            {
              id: 1,
              adds: [
                new Graphic(new Point(0,0, WGS_84), null, {}),
                new Graphic(new Point(0,0, WGS_84), null, {}),
                new Graphic(new Point(0,0, WGS_84), null, {})
              ]
            }
          ];
          service.applyEdits(edits).then(function(result) {
            expect(result.length).to.equal(2);
            expect(result[0].id).to.equal(0);
            expect(result[1].id).to.equal(1);
          });
        });

      });
    });
  }
);
