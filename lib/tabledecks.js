var _ = require('underscore');
var utils = require('./base/utils');
var DAL = require('./dal');
var deck = require('./deck');
var cardComparer = require('./cardComparer');
var https = require('https');
const { networkInterfaces, hostname } = require('os');

function Table(GameTypeWithBoot,boot, max_bet, pot_limit, gametype,tblDBId) {

    this.gid = utils.guid();
    this.boot = boot;
    this.GameTypeWithBoot = GameTypeWithBoot;
    this.max_bet = max_bet;
    this.pot_limit=pot_limit;
    this.gametype=gametype;
    this.gameStarted = false;
    this.tblDBId = tblDBId;
    var maxPlayers = 5;
    var players = {};
    var clients = {};
    var tableInfo;
    var cardsInfo = {};


    var avialbleSlots = {
        "slot1": "slot1",
        "slot2": "slot2",
        "slot3": "slot3",
        "slot4": "slot4",
        "slot5": "slot5"
    };

    this.resetTable = function() {
        var iBoot = boot || 1000;
        var iGameTypeWithBoot = GameTypeWithBoot
        tableInfo = {
            boot: iBoot,
            GameTypeWithBoot : iGameTypeWithBoot,
            lastBet: iBoot,
            lastBlind: true,
            maxBet: max_bet,  //iBoot * 10, //Math.pow(2, 7),
            potLimit:pot_limit, //iBoot * 100,  //Math.pow(2, 11),
            showAmount: true,
        };
    }
    this.getPlayers = function() {
        return players;
    };
    this.getPlayersCount = function() {
        return _.size(players);
    }

    this.getTableInfo = function() {
        tableInfo.isShowAvailable = this.getActivePlayers() === 2;
        return tableInfo;
    }

    this.getTableInfoForOpenGame = function() {
        tableInfo.isShowAvailable = true
        return tableInfo;
    }
    this.isBlindLimitExceeded = function(blindPlayers) {
        //console.log("table desk get player data " + Object.keys(this.getPlayers()).length);
        if(blindPlayers == 2){
            if(tableInfo.amount > ((tableInfo.boot*10000)/100)){  //(tableInfo.boot*100)
                return true;
            }
        }
        if(blindPlayers > 3){
            if(tableInfo.amount >((tableInfo.boot*8000)/100)){ //(tableInfo.boot*80)
                return true;
            }
        }
        if(blindPlayers==Object.keys(this.getPlayers()).length){
            if(tableInfo.amount > ((tableInfo.boot*5000)/100)){  //(tableInfo.boot*50)
                return true;
            }
        }
        
        return false;
    }

    this.isPotLimitExceeded = function() {
        if (tableInfo.amount) {
            return tableInfo.amount > tableInfo.potLimit;
        }
        return false;
    }

    this.addPlayer = function(player, client) {
        if (this.getActivePlayers() <= maxPlayers) {
            for (var slot in avialbleSlots) {
                player.slot = slot;
            }
            players[player.id] = player;
            clients[player.id] = client;
            players[player.id].active = !this.gameStarted;
            delete avialbleSlots[player.slot];
            return player;
        }
        return false;
    };
    this.removePlayer = function(id) {
        if (id && players[id]) {
            var player = players[id];
            avialbleSlots[player.slot] = player.slot;
            delete cardsInfo[id];
            delete players[id];
            delete clients[id];
            return player;
        }
    };

    this.getPlayerBySlot = function(slot) {
        for (var player in players) {
            if (players[player].slot === slot) {
                return players[player];
            }
        }
        return undefined;
    }
    this.getPrevActivePlayer = function(id) {
        var slot = players[id].slot,
            num = slot.substr(4) * 1;
        for (var count = 0; count <= 4; count++) {
            num--;
            if (num === 0) {
                num = 5;
            }
            if (avialbleSlots["slot" + num]) {
                continue;
            }
            if (this.getPlayerBySlot("slot" + num)) {
                if (!this.getPlayerBySlot("slot" + num).active || this.getPlayerBySlot("slot" + num).packed) {
                    continue;
                } else {
                    break;
                }
            }
        }

        var newPlayer = this.getPlayerBySlot("slot" + num);
        return newPlayer;
    }
    this.getNextActivePlayer = function(id) {
        var slot = players[id].slot,
            num = slot.substr(4) * 1;
        for (var count = 0; count <= 4; count++) {
            num++;
            if (num > 5) {
                num = num % 5;
            }
            if (avialbleSlots["slot" + num]) {
                continue;
            }
            if (this.getPlayerBySlot("slot" + num)) {
                if (!this.getPlayerBySlot("slot" + num).active || this.getPlayerBySlot("slot" + num).packed) {
                    continue;
                } else {
                    break;
                }
            }
        }

        var newPlayer = this.getPlayerBySlot("slot" + num);
        return newPlayer;
    }

    this.getNextSlotForTurn = function(id) {
        players[id].turn = false;
        var newPlayer = this.getNextActivePlayer(id);
        newPlayer.turn = true;
    }
    this.isActivePlayer = function(id) {
        return players[id] && players[id].active;
    }
    this.packPlayer = function(id) {

        players[id].packed = true;
        this.getNextSlotForTurn(id);
        return this.getPlayers();
    }
    this.placeBetOnly = function(id, bet, blind) {
        tableInfo.amount += bet;
        tableInfo.lastBet = bet;
        players[id].playerInfo.chips -= bet;
        console.log('bet palced with table desk' + players[id].playerInfo._id);

            console.log('call place bet ');
            //temp need to remove in furute 
            var gameName = "";
            if(this.gametype ==1) 
                gameName = "Open Game";
            else if(this.gametype ==2) 
                gameName = "Jackpot Game";
            else
                gameName = "Normal Game";
            var data = {
                operatorPlayerId : players[id].playerInfo.userName,
                roundId : tableInfo.game_rounds_id,
                tableCode : this.tblDBId,
                gameCategory: "TEENPATTI",
                gameCode: this.gametype,
                gameName : gameName,
                amount : bet,
                betStatus : "PLACED",
                parentId : "PDE",
                parents : ["PDE"],
                device : 'DESKTOP', // hostname(),
                clientIP :this.getIP(),
                isRollBack : false,
                description : "bet desc"

            }
            this.callPlaceBet(data,players);
        
        tableInfo.lastBlind = blind;
    }

    this.placeTipsOnly = function(id, bet) {
        
        players[id].playerInfo.chips -= bet;
            if(this.gametype ==1) 
                gameName = "Open Game";
            else if(this.gametype ==2) 
                gameName = "Jackpot Game";
            else
                gameName = "Normal Game";
        //console.log('user updating result: ' + players[id].playerInfo._id);
        var data = {
            tableCode : this.tblDBId,
            gameCategory: "TEENPATTI",
            gameCode: this.gametype,
            gameName : gameName,
            operatorPlayerId : players[id].playerInfo.userName,
            type : "tip",
            amount : bet,
            description : "tip"

        }
        this.callDealerTip(data,players);
        /*DAL.db.users.update({
            userName: players[id].playerInfo.userName
        }, {
            $set: {
                chips: players[id].playerInfo.chips
            }
        }, function(err, result) {
            console.log('user update result: ' + result);
        });*/
    }

    this.placeBet = function(id, bet, blind) {
        this.placeBetOnly(id, bet, blind);
        this.getNextSlotForTurn(id);
        return this.getPlayers();
    };

    this.placeTips = function(id, bet) {
        this.placeTipsOnly(id, bet);
        return this.getPlayers();
    };

    this.getActionTurnPlayer = function() {
        var activePlayer;
        for (var player in players) {
            if (players[player].turn) {
                activePlayer = players[player];
                break;
            }
        }
        return activePlayer;
    }

    this.resetSideShowTurn = function() {
        for (var player in players) {
            players[player].sideShowTurn = false;
        }
    }
    this.sideShowDenied = function(id) {
        players[id].lastAction = 'Denied';
        return [players[id].playerInfo.userName, ' has denied the request'].join('');
    }
    this.sideShowAccepted = function(id) {
        players[id].lastAction = 'Accepted';
        var nextPlayer = this.getNextActivePlayer(id);
        var cardsToCompare = [{
            id: id,
            set: cardsInfo[id].cards
        }, {
            id: nextPlayer.id,
            set: cardsInfo[nextPlayer.id].cards
        }];
        var result = cardComparer.getGreatest(cardsToCompare),
            cardsToShow = {};
        cardsToShow[id] = {
            cardSet: cardsInfo[id].cards
        };
        cardsToShow[nextPlayer.id] = {
            cardSet: cardsInfo[nextPlayer.id].cards
        };
        if (result.id === id) {
            nextPlayer.packed = true;
        } else {
            players[id].packed = true;
        }
        return {
            message: [players[result.id].playerInfo.userName, ' has won the side show'].join(''),
            cardsToShow: cardsToShow
        }
    };

    this.setNextPlayerTurn = function() {
        var activeTurnPlayer = this.getActionTurnPlayer();
        this.getNextSlotForTurn(activeTurnPlayer.id);
    }
    this.placeSideShow = function(id, bet, blind) {
        this.placeBetOnly(id, bet, blind);
        var message = this.setPlayerForSideShow(id);
        return message;
    }
    this.setPlayerForSideShow = function(id) {
        var prevPlayer = this.getPrevActivePlayer(id);
        prevPlayer.sideShowTurn = true;
        return [players[id].playerInfo.userName, ' asking for side show'].join('');
    }

    this.stopGame = function() {
        this.gameStarted = false;
        tableInfo.gameStarted = false;
    }

    this.collectBootAmount = function() {
        var bootAmount = 0;
        for (var player in players) {
            if (players[player].active) {
                players[player].lastBet = tableInfo.boot;
                players[player].lastAction = "";
                bootAmount = bootAmount + tableInfo.boot;
                players[player].playerInfo.chips -= tableInfo.boot;
                DAL.db.game_users.update({
                    user_name : players[player].playerInfo.userName
                }, {
                    $set: {
                        balance : players[player].playerInfo.chips
                    }
                }, function(err, result) {
                   // console.log('user update result: ' + result);
                });
            }
        }
        tableInfo.amount = bootAmount;
    }
    this.getCardInfo = function() {
        return cardsInfo;
    }

    this.updateSideShow = function(id) {
        var nextPlayer = this.getNextActivePlayer(id);
        if (nextPlayer) {
            nextPlayer.isSideShowAvailable = true;
        }
    }

    function distributeCards() {
        deck.shuffle();
        var deckCards = deck.getCards(),
        index = 0;
        //to setup trail sequence for test
        //deckCards =  getSequence(deckCards);
        // console.log("desk : " + JSON.stringify(deckCards));
        for (var i = 0; i < 3; i++) {
            for (var player in players) {
                if (players[player].active) {
                    if (!cardsInfo[players[player].id]) {
                        cardsInfo[players[player].id] = {};
                    }
                    if (!cardsInfo[players[player].id].cards) {
                        cardsInfo[players[player].id].cards = [];
                    }

                    cardsInfo[players[player].id].cards.push(deckCards[index++]);
                }
            }
        }
    }
    getSequence = function(deskCards) {
        deskCards[0].type = 'heart';
        deskCards[0].rank = 12;
        deskCards[0].name = 'Q';
        deskCards[0].priority = 12;

        deskCards[2].type = 'club';
        deskCards[2].rank = 12;
        deskCards[2].name = 'Q';
        deskCards[2].priority = 12;

        deskCards[4].type = 'spade';
        deskCards[4].rank = 12;
        deskCards[4].name = 'Q';
        deskCards[4].priority = 12;

        deskCards[1].type = 'club';
        deskCards[1].rank = 13;
        deskCards[1].name = 'K';
        deskCards[1].priority = 13;

        deskCards[3].type = 'heart';
        deskCards[3].rank = 13;
        deskCards[3].name = 'K';
        deskCards[3].priority = 13;

        deskCards[5].type = 'spade';
        deskCards[5].rank = 13;
        deskCards[5].name = 'K';
        deskCards[5].priority = 13;

        return deskCards;
    }
    this.getActivePlayers = function() {
        var count = 0;
        for (var player in players) {
            if (players[player].active && !players[player].packed) {
                count++;
            }
        }
        return count;
    }
    this.getAllPlayers = function() {
        var count = 0;
        for (var player in players) {
            if (!players[player].packed) {
                count++;
            }
        }
        return count;
    }
    this.resetAllPlayers = function() {
        for (var player in players) {
            delete players[player].winner;
            players[player].turn = false;
            players[player].active = true;
            players[player].packed = false;
            players[player].isSideShowAvailable = false;
            players[player].cardSet = {
                closed: true
            };
            players[player].lastBet = "";
            players[player].lastAction = "";
        }
    }
    this.decideWinner = function(showCards) {
        tableInfo.gametype = this.gametype;
        tableInfo.tableguid = this.gid;
        tableInfo.tblDBId = this.tblDBId;
        var cardSets = [],
            winnerCard,
            msg = "";
        //var playernameArr=[];
        for (var player in players) {
            players[player].turn = false;
            //logic removed as require to pass palyers which there with game started with round
           // if (players[player].active)
            //    playernameArr.push(players[player].playerInfo.userName);
            if (players[player].active && !players[player].packed) {
                if (showCards) {
                    players[player].cardSet.cards = cardsInfo[players[player].id].cards;
                    players[player].cardSet.closed = false;
                }
                cardSets.push({
                    id: players[player].id,
                    set: cardsInfo[players[player].id].cards
                });
            }
        }

        if (cardSets.length === 1) {
            winnerObj = players[cardSets[0].id];
        } else {
            winnerCard = cardComparer.getGreatest(cardSets);
            winnerObj = players[winnerCard.id];
        }
        tableInfo.winnerId = winnerObj.id
        winnerObj.winner = true;
        winnerObj.playerInfo.chips += tableInfo.amount;

        console.log('call winner' );
        //get game data like commission, name 
        var gameData;
        DAL.db.game_details.find({
            game_code : tableInfo.gametype
        }).toArray(function(err, game_details) {
            gameData = game_details[0];
            //console.log("game data from table: " + JSON.stringify(gameData) );
            var data = {
                winners: [winnerObj.playerInfo.userName],
                roundId : tableInfo.game_rounds_id,
                tableCode : tableInfo.tblDBId,
                gameCategory: "TEENPATTI",
                gameCode: gameData.game_code,
                gameName : gameData.game_name,
                totalAmount : tableInfo.amount,
                gameCommission : gameData.game_commission,
                providerCommission : gameData.provider_commission,
                tablePlayers : tableInfo.roundPlayers,
                isRollBack : false
            }
            //console.log("Before result declare players " + JSON.stringify(players));
            callResultDeclare(data,players);
            
        });
        if (winnerCard) {
            return [winnerObj.playerInfo.userName, ' won with ', winnerCard.typeName].join('');
        }
        return undefined
    }
    
    this.jackpotPlayers = function() {
        var cardSets = [],
            jackpotCard,
            msg = "";
        for (var player in players) {
            players[player].turn = false;
            if (players[player].active && !players[player].packed) {
                
                    players[player].cardSet.cards = cardsInfo[players[player].id].cards;
                    players[player].cardSet.closed = false;
               
                cardSets.push({
                    id: players[player].id,
                    set: cardsInfo[players[player].id].cards
                });
            }
        }
        jackpotCard = cardComparer.getTrailsForJackpot(cardSets);
        if(jackpotCard !=0){
            var jackpotPlayers = [];
            var jackPotmsg = "";
            var totalPrize = 0;
            if(jackpotCard.length == 1){
                var tailWinner = players[jackpotCard[0].set.id];
                totalPrize = decidePrize(jackpotCard[0].set.set[0].rank);
                jackPotmsg = tailWinner.playerInfo.userName + ' won trail prize of ' + totalPrize;
                jackpotPlayers.push({amount:totalPrize, operatorPlayerId: tailWinner.playerInfo.userName});
            }else{
                for (var i = 0; i < jackpotCard.length; i++) {
                    if(jackPotmsg==""){
                        totalPrize = decidePrize(jackpotCard[i].set.set[0].rank);
                        jackPotmsg = players[jackpotCard[i].set.id].playerInfo.userName + ' won trail prize of ' + totalPrize;
                        jackpotPlayers.push({amount:totalPrize, operatorPlayerId: players[jackpotCard[i].set.id].playerInfo.userName});
                    }else {
                        totalPrize = decidePrize(jackpotCard[i].set.set[0].rank);
                        jackPotmsg = jackPotmsg + ' and ' + players[jackpotCard[i].set.id].playerInfo.userName + ' won trail prize of ' + totalPrize;
                        jackpotPlayers.push({amount:totalPrize, operatorPlayerId: players[jackpotCard[i].set.id].playerInfo.userName});
                    }
                }
            }
            //call api for jackpot
            //temp need to remove in furute 
            var gameName = "";
            if(this.gametype ==1) 
                gameName = "Open Game";
            else if(this.gametype ==2) 
                gameName = "Jackpot Game";
            else
                gameName = "Normal Game";
            var data = {
                roundId : tableInfo.game_rounds_id,
                tableCode : this.tblDBId,
                gameCategory: "TEENPATTI",
                gameCode: this.gametype,
                gameName : gameName,
                jackpotPlayers : jackpotPlayers
            }
            this.callJackpot(data,players);
            return jackPotmsg;
        }else{
            return '';
        }
       
    }

    function decidePrize(rank){
        switch (rank) {
            case 1:
                return '21000';
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
            case 10:
                return '5000';
            case 11:
            case 12:
            case 13:
                return '10000';
            default:
                return '0';
        }
    }
    this.reset = function() {
        cardsInfo = {};
        this.resetTable();
        this.resetAllPlayers();
    }
    this.decideDeal = function() {
        var firstPlayer = null,
            dealFound = false,
            isFirst = true,
            dealPlayer;
        for (var player in players) {
            if (players[player].active) {

                if (isFirst) {
                    firstPlayer = players[player];
                    isFirst = false;
                }
                if (players[player].deal === true) {
                    players[player].deal = false;
                    dealPlayer = players[player];
                    dealFound = true;
                }
            }
        }
        if (!dealFound) {
            firstPlayer.deal = true;
        } else {
            var nextPlayer = this.getNextActivePlayer(dealPlayer.id);
            nextPlayer.deal = true;
        }
    }
    this.decideTurn = function() {
        var firstPlayer = null,
            dealFound = false,
            isFirst = true,
            dealPlayer;
        for (var player in players) {

            if (players[player].active) {
                if (isFirst) {
                    firstPlayer = players[player];
                    isFirst = false;
                }
                if (players[player].deal === true) {
                    dealPlayer = players[player];
                    dealFound = true;
                }
            }
        }
        if (!dealFound) {
            firstPlayer.turn = true;
        } else {
            var nextPlayer = this.getNextActivePlayer(dealPlayer.id);
            nextPlayer.turn = true;
        }
    }
    this.startGame = function() {
       // not needed here  
       // if(tableInfo.winnerId){
       //     this.insertRoundData()
       // }

        cardsInfo = {};
        this.resetTable();
        this.resetAllPlayers();
        this.gameStarted = true;
        tableInfo.gameStarted = true;
        this.decideDeal();
        this.decideTurn();
        tableInfo.isShowAvailable = this.getActivePlayers() === 2;
        tableInfo.isSideShowAvailable = false;
        this.collectBootAmount();
        distributeCards();

        this.insertRoundData() 
    }

    this.insertRoundData = async function(){

        //round table entry
        //console.log(tableInfo);
        //console.log(players);
        //console.log(this.getCardInfo()); 
        tableInfo.tblDBId = this.tblDBId;
        if(tableInfo.winnerId){
            var status = "Closed"
            winnerId = tableInfo.winnerId

            var openRoundId = ""
            if(tableInfo.game_rounds_id){
                var openRoundId = tableInfo.game_rounds_id
            }
        }else{
            var status = "Open"
            winnerId = ""
        }
        var p = []
        var playernameArr=[];
        for(var player in players){
            playernameArr.push(players[player].playerInfo.userName);
            p.push({
                id: players[player].id,
                user_name: players[player].playerInfo.userName,
                cardsInfo:JSON.stringify(cardsInfo[player])
            })
        }
        tableInfo.roundPlayers = playernameArr;
       var game_round = {
            game_code: this.gametype,
            table_id:  this.gid,
            bet_count: 0,
            bet_amount: tableInfo.boot,
            status:status,
            game_table_id:  this.gid,
            winner_username: winnerId,
            winner_amount:'',
            open_round_id:openRoundId,
            players:p
        };
        //console.log("---------------------------------");  
        //console.log(game_round);    
         DAL.db.game_rounds.insert(game_round, function(err,docsInserted){
            console.log(docsInserted._id);
            tableInfo.game_rounds_id = docsInserted._id
            //call server to provide round info
            //get table id from database
            //temp need to remove in furute 
            var gameName = "";
            if(game_round.game_code ==1) 
                gameName = "Open Game";
            else if(this.gametype ==2) 
                gameName = "Jackpot Game";
            else
                gameName = "Normal Game";

            var data = {
                roundId : tableInfo.game_rounds_id,
                tableCode : tableInfo.tblDBId,
                gameCategory: "TEENPATTI",
                gameCode: game_round.game_code,
                gameName : gameName,
                players : playernameArr,
                amount : tableInfo.boot,
                description : "game created"
            }
             callInitGame(data,players);
        });

        
    }

    callInitGame =  function(data,players){
        try{
            console.log("init game request data :" + JSON.stringify(data) );
            var options = {
                'method': 'POST',
                'hostname': 'api.deckheros.com',
                'path': '/game/init',
                'headers': {
                  'Content-Type': 'application/json',
                  'X-OP-KEY': 'REALGAMES',
                  'X-OP-SECRET': 'DEVREALGAMES',
                  'Content-Length': JSON.stringify(data).length
                },
                'maxRedirects': 20
              };
              //console.log("init game request data :" + JSON.stringify(options) );
              const reqinitGame = https.request(options, resHttp => {
                let resData = [];
                console.log("statusCode:"  + resHttp.statusCode);
                if(resHttp.statusCode == 200){
                    resHttp.on('data', d => {
                        resData.push(d);
                      });
                      resHttp.on('end', () => {
                        const initGameUserData = JSON.parse(Buffer.concat(resData).toString());
                        console.log("init game response data :" + JSON.stringify(initGameUserData) );
                        if(initGameUserData.isSuccess){
                            initGameUserData.data.usersAccount.forEach(function(userInitData) {
                                var userBalance = userInitData.availableBalance + userInitData.upLineBalance + userInitData.exposure;
                                DAL.db.game_users.update({
                                    user_name : userInitData.operatorId + ':' + userInitData.username
                                }, {
                                    $set: {
                                        balance: userBalance,
                                        betLock: Boolean(userInitData.betLock),
                                        isActive: Boolean(userInitData.isActive)

                                    }
                                }, function(err, result) {
                                    //console.log('init game user updated ' + JSON.stringify(players));
                                  for (var player in players) {
                                      if(players[player].playerInfo.userName == userInitData.operatorId + ':' + userInitData.username){
                                        players[player].playerInfo.chips =  userBalance;
                                        players[player].playerInfo.betLock = Boolean(userInitData.betLock);
                                        players[player].playerInfo.isActive = Boolean(userInitData.isActive);
                                      }
                                    }
                                });
                                
                            });
                        }
                       
                      });
                }else{
                    console.log("error response " );
                }
              })
              reqinitGame.write(JSON.stringify(data));
              reqinitGame.end()
        }catch(err) {
            console.log(err) ;
        }
        
        
    }

    this.callPlaceBet =  function(data,players){
        try{
            console.log("bet place option data:" + JSON.stringify(data) );
            var options = {
                'method': 'POST',
                'hostname': 'api.deckheros.com',
                'path': '/order/place',
                'headers': {
                  'Content-Type': 'application/json',
                  'X-OP-KEY': 'REALGAMES',
                  'X-OP-SECRET': 'DEVREALGAMES',
                  'Content-Length': JSON.stringify(data).length
                },
                'maxRedirects': 20
              };
              //console.log("bet place option data:" + JSON.stringify(options) );
              const reqPlaceBet = https.request(options, resHttp => {
                let resData = [];
                console.log("statusCode:"  + resHttp.statusCode);
                if(resHttp.statusCode == 200){
                    resHttp.on('data', d => {
                        resData.push(d);
                      });
                      resHttp.on('end', () => {
                        const usersBalanceData = JSON.parse(Buffer.concat(resData).toString());
                        console.log("bet place response :" + JSON.stringify(usersBalanceData) );
                        if(usersBalanceData.isSuccess){
                            var userBalance = usersBalanceData.availableBalance + usersBalanceData.upLineBalance + usersBalanceData.exposure;
                            DAL.db.game_users.update({
                                user_name : usersBalanceData.operatorId + ':' + usersBalanceData.username
                            }, {
                                $set: {
                                    balance: userBalance,
                                    betLock: Boolean(usersBalanceData.betLock),
                                    isActive: Boolean(usersBalanceData.isActive)
                                }
                            }, function(err, result) {
                              //  console.log('user update result: ' + result);
                              for (var player in players) {
                                  if(players[player].playerInfo.userName == usersBalanceData.operatorId + ':' + usersBalanceData.username){
                                    players[player].playerInfo.chips =  userBalance;
                                    players[player].playerInfo.betLock = Boolean(usersBalanceData.betLock);
                                    players[player].playerInfo.isActive = Boolean(usersBalanceData.isActive);
                                  }
                                }
                            });
                        }
                            
                       
                      });
                }else{
                    console.log("error response " );
                }
              })
              reqPlaceBet.write(JSON.stringify(data));
              reqPlaceBet.end()
        }catch(err) {
            console.log(err) ;
        }
    }

    this.callDealerTip = function(data,players){
        try{
            console.log("tip option data:" + JSON.stringify(data) );
            var options = {
                'method': 'POST',
                'hostname': 'api.deckheros.com',
                'path': '/tip',
                'headers': {
                  'Content-Type': 'application/json',
                  'X-OP-KEY': 'REALGAMES',
                  'X-OP-SECRET': 'DEVREALGAMES',
                  'Content-Length': JSON.stringify(data).length
                },
                'maxRedirects': 20
              };
              const reqPlaceTip = https.request(options, resHttp => {
                let resData = [];
                console.log("statusCode:"  + resHttp.statusCode);
                if(resHttp.statusCode == 200){
                    resHttp.on('data', d => {
                        resData.push(d);
                      });
                      resHttp.on('end', () => {
                        const userTipResData = JSON.parse(Buffer.concat(resData).toString());
                        console.log("bet place response :" + JSON.stringify(userTipResData) );
                        if(userTipResData.isSuccess){
                            var userBalance = userTipResData.availableBalance + userTipResData.upLineBalance + userTipResData.exposure;
                            DAL.db.game_users.update({
                                user_name : userTipResData.operatorId + ':' + userTipResData.username
                            }, {
                                $set: {
                                    balance: userBalance,
                                    betLock:Boolean(userTipResData.betLock) ,
                                    isActive: Boolean(userTipResData.isActive)
                                }
                            }, function(err, result) {
                              //  console.log('user update result: ' + result);
                              for (var player in players) {
                                  if(players[player].playerInfo.userName == userTipResData.operatorId + ':' + userTipResData.username){
                                    players[player].playerInfo.chips =  userBalance;
                                  }
                                }
                            });
                        }
                            
                       
                      });
                }else{
                    console.log("error response " );
                }
              })
              reqPlaceTip.write(JSON.stringify(data));
              reqPlaceTip.end();
        }catch(err) {
            console.log(err) ;
        }
    }
    this.callJackpot =  function(data,players){
        try{
            console.log("jackpot option data:" + JSON.stringify(data) );
            var options = {
                'method': 'POST',
                'hostname': 'api.deckheros.com',
                'path': '/result/jackpot',
                'headers': {
                  'Content-Type': 'application/json',
                  'X-OP-KEY': 'REALGAMES',
                  'X-OP-SECRET': 'DEVREALGAMES',
                  'Content-Length': JSON.stringify(data).length
                },
                'maxRedirects': 20
              };
              //console.log("bet place option data:" + JSON.stringify(options) );
              const reqJackpost = https.request(options, resHttp => {
                let resData = [];
                console.log("statusCode:"  + resHttp.statusCode);
                if(resHttp.statusCode == 200){
                    resHttp.on('data', d => {
                        resData.push(d);
                      });
                      resHttp.on('end', () => {
                        const usersJackpotData = JSON.parse(Buffer.concat(resData).toString());
                        console.log("jackpot response :" + JSON.stringify(usersJackpotData) );
                        usersJackpotData.forEach(function(usersJackpotData) {
                            var userBalance = usersJackpotData.availableBalance + usersJackpotData.upLineBalance + usersJackpotData.exposure;
                            DAL.db.game_users.update({
                                user_name : usersJackpotData.operatorId + ':' + usersJackpotData.username
                            }, {
                                $set: {
                                    balance: userBalance
                                }
                            }, function(err, result) {
                              //  console.log('user update result: ' + result);
                              for (var player in players) {
                                  if(players[player].playerInfo.userName == usersJackpotData.operatorId + ':' + usersJackpotData.username){
                                    players[player].playerInfo.chips =  userBalance;
                                  }
                                }
                            });
                            
                        });
                        
                      });
                }else{
                    console.log("error response " );
                }
              })
              reqJackpost.write(JSON.stringify(data));
              reqJackpost.end()
        }catch(err) {
            console.log(err) ;
        }
    }

    callResultDeclare =  function(data,players){
        try{
            console.log("result declare option data:" + JSON.stringify(data) );
            var options = {
                'method': 'POST',
                'hostname': 'api.deckheros.com',
                'path': '/result/declare',
                'headers': {
                  'Content-Type': 'application/json',
                  'X-OP-KEY': 'REALGAMES',
                  'X-OP-SECRET': 'DEVREALGAMES',
                  'Content-Length': JSON.stringify(data).length
                },
                'maxRedirects': 20
              };
             // console.log("result declare option data:" + JSON.stringify(options) );
              const reqResultDecaler = https.request(options, resHttp => {
                let resData = [];
                console.log("statusCode:"  + resHttp.statusCode);
                if(resHttp.statusCode == 200){
                    resHttp.on('data', d => {
                        resData.push(d);
                      });
                      resHttp.on('end', () => {
                        const usersBalanceData = JSON.parse(Buffer.concat(resData).toString());
                        console.log("result declare response :" + JSON.stringify(usersBalanceData) );
                        if(usersBalanceData.length > 0){
                            //console.log("in condition to check result declare");
                            usersBalanceData.forEach(function(userResponseData) {
                                var userBalance = userResponseData.availableBalance + userResponseData.upLineBalance + userResponseData.exposure;
                                DAL.db.game_users.update({
                                    user_name : userResponseData.operatorId + ':' + userResponseData.username
                                }, {
                                    $set: {
                                        balance: userBalance,
                                        betLock: Boolean(userResponseData.betLock) ,
                                        isActive: Boolean(userResponseData.isActive)
                                    }
                                }, function(err, result) {
                                  //  console.log('user update result: ' + result);
                                  for (var player in players) {
                                      if(players[player].playerInfo.userName == userResponseData.operatorId + ':' + userResponseData.username){
                                        players[player].playerInfo.chips =  userBalance;
                                        players[player].playerInfo.betLock = Boolean(userResponseData.betLock);
                                        players[player].playerInfo.isActive = Boolean(userResponseData.isActive);

                                      }
                                    }
                                });
                                
                            });
                        }
                      });
                }else{
                    console.log("error response " );
                }
              })
              reqResultDecaler.write(JSON.stringify(data));
              reqResultDecaler.end()
        }catch(err) {
            console.log(err) ;
        }
    }

    this.getIP = function(){
        const nets = networkInterfaces();
        //const results = Object.create(null); 
        
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
                if (net.family === 'IPv4' && !net.internal) {
                    console.log("---------------IP---------------");
                    console.log(net.address);
                    console.log(hostname());
                    console.log("------------------------------");
                    /*if (!results[name]) {
                        results[name] = [];
                    }
                    results[name].push(net.address);*/
                    return net.address;
                }
            }
        }
    }

    this.resetTable();
    return this;

}



function TableManager() {
    var tables = [];

    return {
        createNewTable: function(GameTypeWithBoot,boot, max_bet, pot_limit, gametype,tblDBId) {
            //boot =  global.tblboot;
            var table = new Table(GameTypeWithBoot,boot, max_bet, pot_limit, gametype,tblDBId);
            tables.push(table);
            return table;
        },
        getTable: function(guid) {
            var result = _.where(tables, {
                gid: guid
            });
            if (result.length !== 0) {
               // console.log("table find : " + result.length);
                return result[0];
            }
            return null;
        },
        getTableByBoot: function(boot) {
            var result = _.where(tables, {
                boot: boot
            });
            if (result.length !== 0) {
                return result;
            }
            return null;

        },
        getTableByGameTypeWithBoot: function(GameTypeWithBoot) {
            var result = _.where(tables, {
                GameTypeWithBoot: GameTypeWithBoot
            });
            if (result.length !== 0) {
                console.log("table find with game type : " + result.length);
                return result;
            }
            return null;

        },
        startCountDown: function(secs) {

        },

        startGame: function() {

        }
    }
}


module.exports = new TableManager();