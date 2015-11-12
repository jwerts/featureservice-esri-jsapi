/*global chai, describe, require, it, beforeEach, afterEach, sinon, $ */
/*jshint -W110 */

var expect = chai.expect;
var ok = chai.ok;

require(
  [
    "esri/config",
    "esri/graphic",
    "esri/geometry/Point",
    "esri/SpatialReference",
    "application/FeatureService",
    "dojo/text!data/200_adds_multi_layer_success.js",
    "dojo/text!data/200_adds_multi_layer_failure.js"
  ],
  function(esriConfig, Graphic, Point, SpatialReference, FeatureService,
    multiAddsSuccessJSON, multiAddsFailureJSON) {
    "use strict";

    var WGS_84 = new SpatialReference(4326);

    var JSON_HEADER = {
      'Content-Type': 'application/json; charset=utf-8'
    };
    // 9876 is karma port - use to avoid CORS errors / need to fake proxy
    var URL = 'http://localhost:9876/service';

    describe("basic", function() {
      it("should be constructed", function() {
        var service = new FeatureService(URL);
        expect(service.url).to.equal(URL);
      });
    });

    describe('applyEdits endpoint', function() {
      var xhr, requests;

      beforeEach(function() {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function(req) {
          requests.push(req);
        };
      });

      afterEach(function() {
        xhr.restore();
      });

      describe('on http 500', function() {

        it('should return esriRequest error to error handler', function() {
          var service = new FeatureService(URL);
          var successBack = sinon.spy();
          var errBack = sinon.spy();
          service.applyEdits([]).then(successBack, errBack);
          requests[0].respond(500);

          expect(successBack.calledOnce).to.be.false;
          expect(errBack.calledOnce).to.be.true;
        });

      });

      describe('on http 200', function() {

        it('should fake a response', function() {
          var service = new FeatureService(URL);
          var edits = [];

          var successBack = sinon.spy();
          var errBack = sinon.spy();
          service.applyEdits(edits).then(successBack, errBack);
          requests[0].respond(200, JSON_HEADER, multiAddsSuccessJSON);

          expect(successBack.calledOnce).to.be.true;
          expect(errBack.calledOnce).to.be.false;
        });

        it('should return array of objects with layer id and added, updated, deleted objectids', function(done) {
          var service = new FeatureService(URL);
          var edits = [
            {
              id: 0,
              adds: [
                new Graphic(new Point(0,0, WGS_84), null, {})
              ],
              updates: [
                new Graphic(new Point(0,0, WGS_84), null, {})
              ],
              deletes: [
                1, 2
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
            console.log(result);

            // 2 layers
            expect(result.length).to.equal(2);

            // contains correct objectids and layer id
            expect(result[0].id).to.equal(2);
            expect(result[0].adds).to.deep.equal([20]);
            expect(result[0].updates).to.deep.equal([30]);
            expect(result[0].deletes).to.deep.equal([31,32]);

            expect(result[1].id).to.equal(5);
            expect(result[1].adds).to.deep.equal([55,56,57]);
            expect(result[1].updates).to.deep.equal([]);
            expect(result[1].deletes).to.deep.equal([]);

            done();
          });
          requests[0].respond(200, JSON_HEADER, multiAddsSuccessJSON);
        });

        it('should trigger fault handler with array 200 code and errors array with error object and layer id when one or more edits fail', function(done) {
          var service = new FeatureService(URL);
          var edits = [
            {
              id: 2,
              adds: [
                new Graphic(new Point(0,0, WGS_84), null, {})
              ]
            },
            {
              id: 5,
              adds: [
                new Graphic(new Point(0,0, WGS_84), null, {}),
                new Graphic(new Point(0,0, WGS_84), null, {}),
                new Graphic(new Point(0,0, WGS_84), null, {})
              ]
            }
          ];

          service.applyEdits(edits).then(function(result) {
            throw new Error("Should not have called success");
          }, function(error) {
            console.log(error);
            expect(error.status).to.equal(200);
            expect(error.message).to.equal("At least one layer's edits failed.");
            expect(error.errors[0]).to.deep.equal({
              id: 2,
              code: -2147217395,
              description: "Made up error."
            });
            expect(error.errors[1]).to.deep.equal({
              id: 5,
              code: -2147217395,
              description: "Setting of Value for depth failed."
            });
            done();
          });
          requests[0].respond(200, JSON_HEADER, multiAddsFailureJSON);
        });

      });
    });
  }
);
