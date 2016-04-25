var express = require('express');
var bodyParser = require('body-parser');
var os = require('os');
var _ = require('underscore');
var request = require('request');

var urlencodedParser = bodyParser.urlencoded({ extended: false })

var app = express();
app.set('views', './views');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));
app.set('port', (process.env.PORT || 5000));


//Routes
app.get('/', function(req, res) {
  res.render('home', {
    title: 'Welcome'
  });
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

    var difference = _.difference(signaturesSigIds, bookmarkSigIds);

    request({url: 'https://www.eve-scout.com/api/wormholes', json: true}, function(err, res, json) {
      if (err) {
        console.log("timeout");
      }
      var evescoutlist = json;
      var filteredevescoutlist = _.filter(evescoutlist, function(a){
          return _.find(difference, function(b){
              return b === a.signatureId;
          });
      });
      console.log(evescoutlist[0]);
      console.log("my filtered ones");
      console.log(filteredevescoutlist);
    });

    res.render('home', {
      title: 'Welcome',
      wormholeFilterResult: difference,
      bookmarks: response.bookmarks,
      signatures: response.signatures,
    });
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
