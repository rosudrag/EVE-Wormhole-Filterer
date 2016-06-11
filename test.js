var request = require('request');
var myClosestTheraHole = require("./myClosestTheraHole");

function getRandomPonyFooArticle () {
  return new Promise((resolve, reject) => {
    request({url: 'https://www.eve-scout.com/api/wormholes?systemSearch=Jita', json: true}, (err, res, body) => {
      if (err) {
        reject(err); return;
      }
      resolve(body);
    });
  });
}

function ilog(txt){
  console.log(txt);
}


function getMeTheraHole(){
  myClosestTheraHole.getTheraHoleJsonResult("Jita").then(txt => ilog(txt));
}

getMeTheraHole();
