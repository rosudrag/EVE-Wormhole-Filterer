(function() {
  var request = require('request');
  var _ = require('underscore');

  function IsKnownSystem(id){
    var idvalue = id + "";
    return idvalue.startsWith("30");
  }

  function getTheraHoleJsonResult (source) {
    return new Promise((resolve, reject) => {
      request({url: 'https://www.eve-scout.com/api/wormholes?systemSearch=' + source, json: true}, (err, res, body) => {
        if (err) {
          reject(err); return;
        }
        resolve(body);
      });
    });
  };

  function successTheraHoleResponse(json, source, results, callback){
    var theraHole = _.reduce(json, function(current, next){
      if(current.jumps > next.jumps && IsKnownSystem(next.wormholeDestinationSolarSystemId)){
        current = next;
      }
      console.log(current.jumps);
      return current;
    }, {jumps: 999});
    console.log(theraHole);
    result = {
      source: theraHole.destinationSolarSystem.name,
      destination: "Thera",
      jumps: theraHole.jumps
    }
    results["Thera"] = result;

    callback(results);
  };

  function failureTheraHoleResponse(reason, source, results, callback){
    console.error(reason);
    results["Thera"] = {
      source: source,
      destination: "Thera",
      jumps: "N/A"
    };
    callback(results);
  };

  function getMeTheraHole(source, results, callback){
    getTheraHoleJsonResult(source).then(json => successTheraHoleResponse(json, source, results, callback))
    .catch(reason => failureTheraHoleResponse(reason));
  }

  module.exports.getMeTheraHole = getMeTheraHole;
  module.exports.getTheraHoleJsonResult = getTheraHoleJsonResult;
}());
