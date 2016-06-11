var express = require('express');
var bodyParser = require('body-parser');
var os = require('os');
var _ = require('underscore');
var _iodash_ = require('lodash');
var request = require('request');
var $ = require('jquery');
var urlencodedParser = bodyParser.urlencoded({ extended: false })

//EVEoj
var EVEoj = require("EVEoj"),
    SDD = EVEoj.SDD.Create("json", {
        path: "\SDD_YC118_5_201605310"
    }),
    map;
SDD.LoadMeta().then(function() {
    map = EVEoj.map.Create(SDD, "K");
    return map.Load();
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

function formatSystemName(source){
  return _iodash_.capitalize(source);
}
//--EVEoj

var app = express();
app.set('views', './views');
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.use('/css', express.static(__dirname + '/node_modules/flexboxgrid/css'));
app.use('/css', express.static(__dirname + '/bower_components/less-space/dist'));

app.set('port', (process.env.PORT || 5000));

//Routes
app.get('/', function(req, res) {
  res.render('wormholefilterpage', {
    title: 'Thera Wormhole Filter App'
  });
});

app.get('/trade-hub-distance', function(req, res) {
  var results = findTradeHubDistances("Jita");
  res.render('tradehubdistancepage', {
    title: 'Thera Wormhole Filter App',
    distances: results
  });
});

app.post('/trade-hub-distance', urlencodedParser, function(req, res) {
  console.log("Got a POST request for the tradehubdistancepage");

  // Prepare output in JSON format
   source=formatSystemName(req.body.distancefrom);
   console.log(source);

   if(source === undefined || source === ''){
     source = "Jita";
   }
  var results = findTradeHubDistances(source);
  res.render('tradehubdistancepage', {
    title: 'Thera Wormhole Filter App',
    distances: results
  });
});

app.post('/', urlencodedParser, function (req, res) {
   console.log("Got a POST request for the wormholefilter");

   // Prepare output in JSON format
    response = {
        bookmarks:req.body.bookmarks,
        signatures:req.body.signatures
    };

    var bookmarkSigIds = getSigIds(response.bookmarks);
    var signaturesSigIds = getSigIds(response.signatures);

    var missingScannedIds = _.difference(signaturesSigIds, bookmarkSigIds);
    var expiredIds = _.difference(bookmarkSigIds, signaturesSigIds);



    request({url: 'https://www.eve-scout.com/api/wormholes', json: true}, function(err, resES, json) {
      if (err) {
        console.log("timeout");
      }
      var evescoutlist = json;
      var filteredevescoutlist = _.filter(evescoutlist, function(a){
          return _.find(missingScannedIds, function(b){
              return b === a.signatureId;
          });
      });

      var myFilteredEveScoutDict = _.reduce(filteredevescoutlist, function (o, item) {
        o[item.signatureId] = item; return o }, {}
      );

      var mySigs = {};
      _.each(missingScannedIds, function(mySigId){
        var currentES = myFilteredEveScoutDict[mySigId];
        if(currentES){
          mySigs[mySigId] = createCosmicSigModel(mySigId, currentES.destinationSolarSystem.name, currentES.destinationSolarSystem.region.name, "evescout");
        }
        else{
          mySigs[mySigId] = createCosmicSigModel(mySigId, "unknown", "unknown", "unscanned");
        }
      });

      //add expired ones
      var expiredSigs = {};
      _.each(expiredIds, function(expiredId){
        expiredSigs[expiredId] = createCosmicSigModel(expiredId, "expired", "expired", "expired");
      });

      res.render('wormholefilterpage', {
        title: 'Thera Wormhole Filter App',
        supersignatures: mySigs,
        expiredsignatures: expiredSigs
      });
    });
})

function createCosmicSigModel(sigId, destination, region, status){
  return {
    signatureId: sigId,
    destination: destination,
    region: region,
    status: status
  };
}

function getSigIds(input){
  var inputSplit = input.match(/^.*((\r\n|\n|\r)|$)/gm);
  var sigIds = inputSplit.map(function(obj){
    return obj.slice(0,3).toUpperCase();
  })
  return sigIds;
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
