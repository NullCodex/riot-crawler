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

var url = 'mongodb://localhost:27017/timewinder';
var request = require('request');
var accountId = 40831277;
var MongoClient = require('mongodb').MongoClient;
var apiKey = process.env.RIOT_KEY;
var baseUrl = "https://na1.api.riotgames.com";
var keyParam = "?api_key=" + apiKey;
var Long = require('mongodb').Long;

MongoClient.connect(url, function(err, db) {
    if (err) {
        console.log(err);
    } else {
        explor(accountId, 2, db);
    }
});

function explor(accountId, level, db) {
    console.log(accountId);
    if (level === 0) return;
    request({
        url: baseUrl + "/lol/match/v3/matchlists/by-account/" + accountId + keyParam,
        json: true
    }, function(err, res, matchlistBody) {
        if (err) {
            console.log(err);
        } else {
            if (res.statusCode == 429) {
                setTimeout(function() {
                    explor(accountId, level, db);
                }, 120000);
            } else {
                var matches = matchlistBody.matches;
                for (var i = 0; i < matches.length; i++) {
                    var match = matches[i];
                    var _gameId = match.gameId;

                    (function(gameId) {
                        request({
                            url: baseUrl + "/lol/match/v3/matches/" + gameId + keyParam,
                            json: true
                        }, function(err, res, matchDetailBody) {
                            if (err) {
                                console.log(err);
                            } else {
                                if (res.statusCode == 429) {
                                    setTimeout(function() {
                                        explor(accountId, level, db);
                                    }, 120000);
                                } else {
                                    db.collection('matches').findOne({ "matchId": gameId }, function(err, match) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            if (match == null) {
                                                db.collection('matches').insert({ matchId: Long(gameId), match: matchDetailBody }, function(err, result) {
                                                    if (err) {
                                                        console.log(err);
                                                    }
                                                    for (var j = 0; j < matchDetailBody.participantIdentities.length; j++) {
                                                        var _accountIdParam = matchDetailBody.participantIdentities[j].player.accountId;
                                                        (function(accountIdParam) {
                                                            setTimeout(function() {
                                                                explor(accountIdParam, level - 1);
                                                            }, 2000);
                                                        })(_accountIdParam)
                                                    }
                                                });
                                            }
                                          }
                                    });
                                }
                            }
                        });
                    })(_gameId)
                }
            }
        }
    });
}