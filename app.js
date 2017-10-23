
// accountId = 40831277

// exploer(40831277, 3)
//   function explor (accountId, level):
//     if level = 0 return
//     matches = https://na1.api.riotgames.com/lol/match/v3/matchlists/by-account/{accountId}
//     for match in matches:
//       matchId = match.gameId
//       match_detail = https://na1.api.riotgames.com/lol/match/v3/matches/
//       if gameId not exists:
//         store details
//       for participant in match.participantIdentities:
//         explorer(partipant.accountId, level-1)


// todo: random function to get an account id from a selected league

var url = 'mongodb://localhost:27017/test';
var request = requir('request');
var accountId = 40831277;
var MongoClient = require('mongodb').MongoClient;
var apiKey = process.env.key;
var baseUrl = "https://na1.api.riotgames.com";
var keyParam = "?api_key=" + apiKey;
var ObjectId = require('mongodb').ObjectID;

MongoClient.connect(url, function(err, db) {
  explor(accountId, 4, db);
});


function explor(accountId, level, db) {
  if (level === 0) return;

  request(baseUrl + "/lol/match/v3/matchlists/by-account/" + accountId + keyParam, function (err, res, body) {
    var matches = body.matches;

    for (match in matches) {
      var gameId = match.gameId;
      request(baseUrl + "/lol/match/v3/matches/" + gameId + keyParam, function(err, res, body) {
        db.collection('matches').find({"_id": ObjectId(gameId)}, function (err, match) {
          if (match == null) {
            db.collection('matches').insert({_id: ObjectId(gameId), match: body}, function(err, result) {
              for (partipant in body.participantIdentities) {
                setTimeout(function() {
                  explor(partipant.player.accountId, level-1);
                }, 2000);
              }
            });
          }
        });
      });
    }
  });
}
