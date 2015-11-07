/*
 * FeatureService.js
 *
 * -------
 * Copyright 2015 Josh Werts All rights reserved.
 */

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
      applyEdits: function(/* Object[] */ edits, /* bool? */ rollbackOnFailure) {
        /**
        edit = {
          id: int (service layer id)
          adds: Graphic[],
          updates: Graphic[],
          deletes: int[] ObjectIds of features to delete
        }

        returns dojo.Deferred.

        On success, response contains:
        {
          adds: [oid, oid, oid, ...],
          deletes: [oid, oid, oid, ...],
          updates: [oid, oid, oid, ...]
        }

        On error, response will either be the error from the service OR
        the first error encountered in the results.
        **/
        if (typeof rollbackOnFailure === 'undefined') { rollbackOnFailure = true; }

        // build inputs to REST API - transform graphics to json
        var editsJson = [];
        array.forEach(edits, function(edit) {
          var editJson = {
            id: edit.id
          };
          editJson['adds'] = array.map(edit.adds, function(graphic) {
            return graphic.toJson();
          });
          editJson['updates'] = array.map(edit.updates, function(graphic) {
            return graphic.toJson();
          });
          // these should just be objectids, not graphics
          editJson['deletes'] = edit.deletes || [];
          editsJson.push(editJson);
        });

        var params = {
          edits: JSON.stringify(editsJson),
          rollbackOnFailure: rollbackOnFailure
        };

        var options = {
          url: this.url + '/applyEdits?f=json',
          content: params,
          handleAs: 'json',
          useProxy: false
        };

        // NOTE: API specifies POST only
        var request = esriRequest(options, {'usePost': true});

        // intercept response from feature service
        function onSuccess(response) {
          // we are assuming here that this will be always be used with rollbackOnFailure = true
          // and we should yield an error if anything fails.
          // If all succeed, then provide back a simplified response as follows:
          /**
          {
            adds: [oid, oid, oid, ...],
            deletes: [oid, oid, oid, ...],
            updates: [oid, oid, oid, ...]
          }
          **/
          var packagedResponse = [];
          array.some(response, function(layer) {
            var layerResult = {
              id: layer.id,
              adds: [],
              updates: [],
              deletes: []
            };
            array.some(layer.addResults, function(result) {
              if (!result.success) {
                deferred.reject(result.error);
                return false;
              } else {
                layerResult.adds.push(result.objectId);
              }
            });
            array.some(layer.updateResults, function(result) {
              if (!result.success) {
                deferred.reject(result.error);
                return false;
              } else {
                layerResult.updates.push(result.objectId);
              }
            });
            array.some(layer.deleteResults, function(result) {
              if (!result.success) {
                deferred.reject(result.error);
                return false;
              } else {
                layerResult.deletes.push(result.objectId);
              }
            });
            packagedResponse.push(layerResult);
          });
          return packagedResponse;
        }

        // don't handle error here - allows error to fall through to method's caller
        var deferred = request.then(onSuccess);
        return deferred;
      }
    });
  }
);
