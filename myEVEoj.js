// someThings.js

(function() {
  //EVEoj
  var EVEoj = require("EVEoj"),
      SDD = EVEoj.SDD.Create("json", {
          path: "\SDD_YC118_5_201605310"
      }),
      map;
  var solarSystems = {};
  SDD.LoadMeta().then(function() {
      map = EVEoj.map.Create(SDD, "K");
      return map.Load();
  }).then(function() {
    solarSystems = Object.keys(map.GetSystems().map.sysNameMap);
    module.exports.solarsystems = solarSystems;
  });

  function findSystemDistance(source, destination){
    try{
      var sourcesystem = map.GetSystem({name: source});
      var destinationsystem = map.GetSystem({name: destination});
      var route = map.Route(sourcesystem.ID, destinationsystem.ID, [], false, false);
      return {
        source: source,
        destination: destination,
        jumps: route.length
      };
    }
    catch(ex){
      return {
        source: source,
        destination: destination,
        jumps: "N/A"
      };
    }
  }

  function findTradeHubDistances(source){
    var results = {};
    results["Jita"] = findSystemDistance(source, "Jita");
    results["Amarr"] = findSystemDistance(source, "Amarr");
    results["Hek"] = findSystemDistance(source, "Hek");
    results["Rens"] = findSystemDistance(source, "Rens");
    return results;
  }
  //--EVEoj

    module.exports.findTradeHubDistances = findTradeHubDistances;
}());
