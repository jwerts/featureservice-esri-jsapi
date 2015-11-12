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
});
