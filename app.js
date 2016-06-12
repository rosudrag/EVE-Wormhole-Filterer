var express = require('express');
var bodyParser = require('body-parser');
var os = require('os');
var _ = require('underscore');
var _iodash_ = require('lodash');
var request = require('request');
var $ = require('jquery');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var myEVEoj = require("./myEVEoj");
var myWormholeFilter = require("./myWormholeFilter");
var compression = require('compression');


var app = express();
app.use(compression());
app.set('views', './views');
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/bootstrap-3-typeahead')); // redirect bootstrap JS typeahead
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/js', express.static(__dirname + '/node_modules/bloodhound-js/dist')); // redirect JS jQuery
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

app.get('/solarsystems.json', function(req, res) {
  res.json(myEVEoj.solarsystems);
});

app.get('/trade-hub-distance', function(req, res) {
  myEVEoj.findTradeHubDistances("Jita", function(results){
    res.render('tradehubdistancepage', {
      title: 'Thera Wormhole Filter App',
      distances: results
    });
  });
});

app.post('/trade-hub-distance', urlencodedParser, function(req, res) {
  console.log("Got a POST request for the tradehubdistancepage");
  // Prepare output in JSON format
   source=req.body.distancefrom;
   if(source === undefined || source === ''){
     source = "Jita";
   }
   myEVEoj.findTradeHubDistances(source, function(results){
     res.render('tradehubdistancepage', {
       title: 'Thera Wormhole Filter App',
       distances: results
     });
   });
});

app.post('/', urlencodedParser, function (req, res) {
   console.log("Got a POST request for the wormholefilter");

   // Prepare output in JSON format
    response = {
        bookmarks:req.body.bookmarks,
        signatures:req.body.signatures
    };

    var bookmarkSigIds = myWormholeFilter.getSigIds(response.bookmarks);
    var signaturesSigIds = myWormholeFilter.getSigIds(response.signatures);

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
          mySigs[mySigId] = myWormholeFilter.createCosmicSigModel(mySigId, currentES.destinationSolarSystem.name, currentES.destinationSolarSystem.region.name, "evescout");
        }
        else{
          mySigs[mySigId] = myWormholeFilter.createCosmicSigModel(mySigId, "unknown", "unknown", "unscanned");
        }
      });

      //add expired ones
      var expiredSigs = {};
      _.each(expiredIds, function(expiredId){
        expiredSigs[expiredId] = myWormholeFilter.createCosmicSigModel(expiredId, "expired", "expired", "expired");
      });

      res.render('wormholefilterpage', {
        title: 'Thera Wormhole Filter App',
        supersignatures: mySigs,
        expiredsignatures: expiredSigs
      });
    });
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
