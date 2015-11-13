# featureservice-esri-jsapi

**bower install featureservice-esri-jsapi**

Wrapper around esri REST API Feature Service allowing edits to multiple layers in a Feature Service in a single request with rollback on all if any edits fail (if supported by data source - see ESRI documentation).

License: MIT

```js
var package_path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
var dojoConfig = {
  async: true,
  packages: [
    {
      name: 'feature-service',
      location: package_path + '/js/lib/bower_components/featureservice-esri-jsapi/dist',
      main: 'FeatureService.min'
    }
  ]
};

require(
  [
    'feature-service'
  ], function(FeatureService) {
    'use strict';

    var service = new FeatureService("http://[server]/arcgis/rest/MyService");
    var edits = [
      {
        id: 2,  // id of layer in service
        adds: [
          addGraphic
        ],
        updates: [
          updateGraphic
        ],
        deletes: [
          1, 2  // just objectids of features to delete.
        ]
      },
      {
        id: 5,  // id of layer in service
        adds: [
          someGraphic,
          anotherGraphic,
          yetAnotherGraphic
        ]
      }
    ];

    var deferred = service.applyEdits(edits);
    deferred.then(function(result) {
      // result is an array
      // each array value contains an object with layer id and objectids of successful edits:
      /*
      [
        {
          id: int id of feature service layer
          adds: [oid, oid, oid, ...],
          updates: [oid, oid oid, ...],
          deletes: [oid, oid, oid, ...]
        },
        ...
      ]
      */
      // layer 2 results
      console.log(result[0].id);
      console.log(result[0].adds);
      console.log(result[0].updates);
      console.log(result[0].deletes);

      // layer 5 results
      console.log(result[1].id);
      console.log(result[1].adds);
      console.log(result[1].updates);
      console.log(result[1].deletes);

    }, function(error) {
      /* error callback can be called for 2 reasons
        1. Regular service faults (server 500 error, etc)
        2. One or more of the edits failed (but server still responded with 200)

        In case 1, the error is a standard esri error object with code and message.
        In case 2, the error is an object with code (200) and message plus an additional
        errors property which contains an array of error objects.
        Error object contains code, description, and id (layer id).
      */
      // case 2
      if (error.code === 200) {
        for (var i; i<error.errors.length; i++) {
          var err = error.errors[i];
          console.log(err.id);
          console.log(err.code);
          console.log(err.description);
        }
      }
    });
});
```
