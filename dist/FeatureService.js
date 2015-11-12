/*
 * FeatureService.js
 *
 * Wrapper around ESRI REST API allowing edits to multiple layers in Feature service
 * in single HTTP request.  Rolls back on failure for all layers if any single edit fails
 * (assumes data source supports rollback per esri docs).
 *
 * -------
 * MIT License, Copyright 2015 Josh Werts, http://joshwerts.com
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
      applyEdits: function(/* Object[] */ edits, /* string? */ gdbVersion) {
        /**
        edits = [edit] where edit is defined as:
        edit = {
          id: int (service layer id)
          adds: Graphic[],
          updates: Graphic[],
          deletes: int[] ObjectIds of features to delete
        }
        returns dojo.Deferred.
        On success, response contains [success] where success is defined as:
        success = {
          adds: [oid, oid, oid, ...],
          deletes: [oid, oid, oid, ...],
          updates: [oid, oid, oid, ...]
        }
        On error, response will either be the error from the service OR
        an error object with code = 200 and an "errors" property containing
        an array of error objects.
        **/
        gdbVersion = typeof gdbVersion === 'undefined' ? null : gdbVersion;

        // build inputs to REST API - transform graphics to json
        var editsJson = [];
        array.forEach(edits, function(edit) {
          var editJson = {
            id: edit.id
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
        });

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
          var packagedResponse = [];
          var errors = [];

          array.forEach(response, function(layer) {
            var layerResult = {
              id: layer.id,
              adds: [],
              updates: [],
              deletes: []
            };
            array.forEach(layer.addResults, function(result) {
              if (result.success) {
                layerResult.adds.push(result.objectId);
              } else {
                result.error.id = layer.id;
                errors.push(result.error);
              }
            });
            array.forEach(layer.updateResults, function(result) {
              if (result.success) {
                layerResult.updates.push(result.objectId);
              } else {
                result.error.id = layer.id;
                errors.push(result.error);
              }
            });
            array.forEach(layer.deleteResults, function(result) {
              if (result.success) {
                layerResult.deletes.push(result.objectId);
              } else {
                result.error.id = layer.id;
                errors.push(result.error);
              }
            });
            packagedResponse.push(layerResult);
          });

          if (errors.length) {
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
