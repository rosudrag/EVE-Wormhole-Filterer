(function() {
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

  module.exports.createCosmicSigModel = createCosmicSigModel;
  module.exports.getSigIds = getSigIds;
}());
