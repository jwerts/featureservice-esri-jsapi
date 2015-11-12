/*
 * FeatureService.js
 *
 * -------
 * Copyright 2015 Josh Werts All rights reserved.
 */

 // ES5 15.2.3.14
 // http://es5.github.com/#x15.2.3.14
if (!Object.keys) {
     // http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
  var hasDontEnumBug = true,
      dontEnums = [
        "toString",
        "toLocaleString",
        "valueOf",
        "hasOwnProperty",
        "isPrototypeOf",
        "propertyIsEnumerable",
        "constructor"
      ],
      dontEnumsLength = dontEnums.length;

  for (var key in {"toString": null}) {
    hasDontEnumBug = false;
  }

  Object.keys = function keys(object) {
    if (
    (typeof object != "object" && typeof object != "function") ||
            object === null
    ) {
      throw new TypeError("Object.keys called on a non-object");
    }

    var keys = [];
    for (var name in object) {
      if (owns(object, name)) {
        keys.push(name);
      }
    }

    if (hasDontEnumBug) {
      for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
        var dontEnum = dontEnums[i];
        if (owns(object, dontEnum)) {
          keys.push(dontEnum);
        }
      }
    }
    return keys;
  };
}

define(
  [
    'dojo/_base/declare',
    'dojo/Evented',
    'dojo/_base/array',
    'dojo/_base/lang',
    'esri/request',
    'dojo/Deferred'
  ], function(declare, Evented, array, lang, esriRequest, Deferred) {
    'use strict';

    return declare([Evented], {
      constructor: function(url, options) {
        lang.mixin(this, options);
        this.url = url;
      },
      applyEdits: function(/* Object */ edits, /* string? */ gdbVersion) {
        /**
        object keyed by layer id containing objects with arrays of adds, updates, and deletes
        edits = {
          id int (service layer id): {
            adds: Graphic[],
            updates: Graphic[],
            deletes: int[] ObjectIds of features to delete
          }
        }

        returns dojo.Deferred.

        On success, response contains:
        {
          adds: [oid, oid, oid, ...],
          deletes: [oid, oid, oid, ...],
          updates: [oid, oid, oid, ...]
        }

        On error, response will either be the error from the service (500) OR
        error with 200 code containing an errors object keyed by layer id.
        **/
        gdbVersion = typeof gdbVersion === 'undefined' ? null : gdbVersion;

        // build inputs to REST API - transform graphics to json
        var editsJson = [];
        var layerIds = Object.keys(edits);
        var layerIdCount = layerIds.length;
        for (var i=0; i<layerIdCount; i++) {
          var layerIdKey = layerIds[i];
          var edit = edits[layerIdKey];
          var editJson = {
            id: parseInt(layerIdKey, 10)
          };
          editJson.adds = array.map(edit.adds, function(graphic) {
            return graphic.toJson();
          });
          editJson.updates = array.map(edit.updates, function(graphic) {
            return graphic.toJson();
          });
          // these should just be objectids, not graphics
          editJson.deletes = edit.deletes || [];
          editsJson.push(editJson);
        }

        var params = {
          edits: JSON.stringify(editsJson),

          // if one edit fails, they should all fail.
          // NOTE: may not be supported by all data sources, see ESRI docs
          rollbackOnFailure: true,
          gdbVersion: gdbVersion
        };

        var options = {
          url: this.url + '/applyEdits?f=json',
          content: params,
          handleAs: 'json',
          useProxy: false
        };
        console.log(options.url);

        // NOTE: API specifies POST only
        var request = esriRequest(options, {'usePost': true});

        // this is the deferred we'll return to client.
        var deferred = new Deferred();

        // intercept response from feature service
        function onSuccess(response) {
          // we are assuming here that this will be always be used with rollbackOnFailure = true
          // and we should yield an error if anything fails.
          // If all succeed, then provide back a simplified response as keyed by layer id
          /**
          {
            1: {  // assuming layer id was 1
              adds: [oid, oid, oid, ...],
              deletes: [oid, oid, oid, ...],
              updates: [oid, oid, oid, ...]
            }
          }
          **/
          var packagedResponse = {};
          var errors = null;

          function addError(errors, layerId, error) {
            if (errors === null) {
              errors = {};
            }
            if (!errors.hasOwnProperty(layerId)) {
              errors[layerId] = [];
            }
            errors[layerId].push(error);
            return errors;
          }

          array.forEach(response, function(layer) {
            var layerResult = {
              adds: [],
              updates: [],
              deletes: []
            };
            array.forEach(layer.addResults, function(result) {
              if (!result.success) {
                errors = addError(errors, layer.id, result.error);
              } else {
                layerResult.adds.push(result.objectId);
              }
            });
            array.forEach(layer.updateResults, function(result) {
              if (!result.success) {
                errors = addError(errors, layer.id, result.error);
              } else {
                layerResult.updates.push(result.objectId);
              }
            });
            array.forEach(layer.deleteResults, function(result) {
              if (!result.success) {
                errors = addError(errors, layer.id, result.error);
              } else {
                layerResult.deletes.push(result.objectId);
              }
            });
            packagedResponse[layer.id] = layerResult;
          });

          if (errors !== null) {
            deferred.reject({
              message: "At least one layer's edits failed.",
              status: 200,
              errors: errors
            });
          } else {
            deferred.resolve(packagedResponse);
          }
        }

        function onError(error) {
          // just pass on standard error
          console.log(error);
          deferred.reject(error);
        }

        request.then(onSuccess, onError);

        return deferred;
      }
    });
  }
);
