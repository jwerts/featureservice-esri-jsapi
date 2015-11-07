var allTestFiles = [];
var TEST_REGEXP = /.*Spec\.js$/;

Object.keys(window.__karma__.files).forEach(function(file) {
    if (TEST_REGEXP.test(file)) {
        allTestFiles.push(file);
    }
});

var package_path = '/base/src';
var dojoConfig = {
  packages: [
    {
      name: "spec",
      location:"/base/test/spec"
    }, {
      name: "data",
      location: "/base/test/data"
    }, {
      name: 'esri',
      location: 'http://js.arcgis.com/3.10/js/esri'
    }, {
      name: 'dojo',
      location: 'http://js.arcgis.com/3.10/js/dojo/dojo'
    }, {
      name: 'application',
      location: package_path + '/js'
    }, {
      name: 'widgets',
      location: package_path + '/js/widgets'
    }
  ],
  async: true
};


/**
 * This function must be defined and is called back by the dojo adapter
  * @returns {string} a list of dojo spec/test modules to register with your testing framework
 */
window.__karma__.dojoStart = function(){
    return allTestFiles;
};
