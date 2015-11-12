# featureservice-esri-jsapi
Wrapper around esri REST API Feature Service

Work in progress... More to come....  

bower install featureservice-esri-jsapi

```js
define(
  [
    'application/FeatureService'
  ], function(FeatureService) {
    'use strict';

    var service = new FeatureService("http://[server]/arcgis/rest/MyService");
    var edits = {
      2: {
        adds: [
          new Graphic(new Point(0,0, WGS_84), null, {})
        ],
        updates: [
          new Graphic(new Point(0,0, WGS_84), null, {})
        ],
        deletes: [
          new Graphic(new Point(0,0, WGS_84), null, {}),
          new Graphic(new Point(0,0, WGS_84), null, {})
        ]
      },
      5: {
        adds: [
          new Graphic(new Point(0,0, WGS_84), null, {}),
          new Graphic(new Point(0,0, WGS_84), null, {}),
          new Graphic(new Point(0,0, WGS_84), null, {})
        ]
      }
    };

    var deferred = service.applyEdits(edits);
    deferred.then(function(result) {
      // result is an object keyed by layer id
      // each value contains an object with objectids of successful edits:
      /*
      {
        layerid:
        {
          adds: [oid, oid, oid, ...],
          updates: [oid, oid oid, ...],
          deletes: [oid, oid, oid, ...]
        },
        ...
      }
      */
      // layer 2 add objectids
      var layer2Adds = result[2].adds;

      // layer 5 add objectids
      var layer5Adds = result[5].adds;
    }, function(error) {
      /* error callback can be called for 2 reasons
        1. Service faults (server 500 error, etc)
        2. One or more of the edits failed (but server still responded with 200)

        In case 1, the error is a standard esri error object with code and message.
        In case 2, the error is an object with code (200) and message plus an additional
        errors property which contains and object with errors keyed by layer id.
      */
      // case 2
      if (error.code === 200) {
        if (error.errors.hasOwnProperty("2")) {
          console.log(error.errors["2"]);
        }
        if (error.errors.hasOwnProperty("5")) {
          console.log(error.errors["5"]);
        }
      }
    });
});
