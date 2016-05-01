var express = require('express');
var bodyParser = require('body-parser');
var os = require('os');
var _ = require('underscore');
var request = require('request');
var $ = require('jquery');


var urlencodedParser = bodyParser.urlencoded({ extended: false })

var app = express();
app.set('views', './views');
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap

app.set('port', (process.env.PORT || 5000));


//Routes
app.get('/', function(req, res) {
  res.render('home', {
    title: 'Welcome'
  });
});


//Routes
app.get('/testdataWormhole', function(req, res) {
  res.sendFile(__dirname + '/views/testdataWormhole.txt');
});

app.get('/testdataSignatures', function(req, res) {
  res.sendFile(__dirname + '/views/testdataSignatures.txt');
});

app.post('/', urlencodedParser, function (req, res) {
   console.log("Got a POST request for the wormholefilter");

   // Prepare output in JSON format
    response = {
        bookmarks:req.body.bookmarks,
        signatures:req.body.signatures
    };

    var bookmarksSplit = response.bookmarks.match(/^.*((\r\n|\n|\r)|$)/gm);
    var bookmarkSigIds = bookmarksSplit.map(function(obj){
      return obj.slice(0,3);
    })

    var signaturesSplit = response.signatures.match(/^.*((\r\n|\n|\r)|$)/gm);
    var signaturesSigIds = signaturesSplit.map(function(obj){
      return obj.slice(0,3);
    })

    var missingScanned = _.difference(signaturesSigIds, bookmarkSigIds);
    var expired = _.difference(bookmarkSigIds, signaturesSigIds);

    var mySigs = {};

    request({url: 'https://www.eve-scout.com/api/wormholes', json: true}, function(err, resES, json) {
      if (err) {
        console.log("timeout");
      }
      var evescoutlist = json;
      var filteredevescoutlist = _.filter(evescoutlist, function(a){
          return _.find(missingScanned, function(b){
              return b === a.signatureId;
          });
      });

      var myFilteredEveScoutDict = _.reduce(filteredevescoutlist, function (o, item) {
        o[item.signatureId] = item; return o }, {}
      );

      _.each(missingScanned, function(mySigId){
        var currentES = myFilteredEveScoutDict[mySigId];
        if(currentES){
          mySigs[mySigId] = createCosmicSigModel(mySigId, currentES.destinationSolarSystem.name, currentES.destinationSolarSystem.region.name, "evescout");
        }
        else{
          mySigs[mySigId] = createCosmicSigModel(mySigId, "unknown", "unknown", "unscanned");
        }
      });

      //add expired ones
      _.each(expired, function(expiredId){
        mySigs[expiredId] = createCosmicSigModel(expiredId, "expired", "expired", "expired");
      });
      
      res.render('home', {
        title: 'Welcome',
        wormholeFilterResult: missingScanned,
        bookmarks: response.bookmarks,
        signatures: response.signatures,
        supersignatures: mySigs
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

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
