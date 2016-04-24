var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var os = require('os');
var _ = require('underscore');
// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.set('views', './views');
app.set('view engine', 'jade');
//app.use(express.static('/public'));
//app.use("/styles", express.static(__dirname + '/styles'));
app.use(express.static(__dirname + '/public'));

app.set('port', (process.env.PORT || 5000));

app.get('/', function(req, res) {
  res.render('home', {
    title: 'Welcome'
  });
});

// This responds a POST request for the homepage
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
