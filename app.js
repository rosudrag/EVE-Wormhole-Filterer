var express = require('express');
var app = express();
var bodyParser = require('body-parser');
// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })


app.set('views', './views');
app.set('view engine', 'jade');

app.get('/', function(req, res) {
  res.render('home', {
    title: 'Welcome'
  });
});

// This responds a POST request for the homepage
app.post('/wormholefilter', urlencodedParser, function (req, res) {
   console.log("Got a POST request for the wormholefilter");

   // Prepare output in JSON format
    response = {
        bookmarks:req.body.bookmarks,
        signatures:req.body.signatures
    };

    console.log(response);

   res.send('Hello wormholefilter POST');
})

app.listen(80);
