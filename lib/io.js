var io = require('socket.io');
var _ = require('underscore');
var deck = require('./deck');
var DAL = require('./dal');
var tables = require('./tabledecks');

global.userSocketIdMap = new Map();

function Io() {
    return {
        init: function(server) {
            
            //var objServ = io.listen(server);
            var objServ = require('socket.io')(server);
            var table = null;
             //a map of online usernames and their clients
            objServ.sockets.on('connection', function(client) {
                // var playerInfo = DAL.db.users.find({_id:Object(client.id)})
                
                client.on('joinTable', function(args) {
                     //check player is already logged in to another location
                    // console.log(JSON.stringify(args));
                    if(addClientToMap(args.userName, client.id, args.betamt, args.gametype)){
                        //check same boot amoutn able is already exist
                        var tableWithGameType = args.gametype + "-" + args.betamt;
                        var arrTables = tables.getTableByGameTypeWithBoot(tableWithGameType);
                        if(arrTables == null) {
                            //if there is no table there for same boot amount then create new 
                            table =  tables.createNewTable(tableWithGameType,parseInt(args.betamt), parseInt(args.max_bet), parseInt(args.pot_limit), args.gametype,args.tableDBId);
                        }else{
                            var isRequireNewTable = null;
                            arrTables.forEach(tbl => {
                                //check existing table has 5 users 
                                if(tbl.getAllPlayers() < 5) {
                                    isRequireNewTable = tbl;
                                }
                            });
                            if(isRequireNewTable == null){
                                //if 5 users there in existing player then create new table with same boot amount
                                table =  tables.createNewTable(tableWithGameType,parseInt(args.betamt),parseInt(args.max_bet), parseInt(args.pot_limit), args.gametype,args.tableDBId);
                            }else{
                                table = isRequireNewTable;
                            }
                        }
                        
                        //added client id and table id for disconnection use
                        client.tableId = table.gid;
                        console.log("socket client table id" + client.tableId);
                        var addedPlayer = table.addPlayer({
                            id: client.id,
                            cardSet: {
                                closed: true
                            },
                            playerInfo: args
                        }, client);
                        console.log('now player count is:' + table.getAllPlayers());
                        if (addedPlayer !== false) {
                            var newPlayer = {
                                id: client.id,
                                tableId: table.gid,
                                slot: addedPlayer.slot,
                                active: addedPlayer.active,
                                packed: addedPlayer.packed,
                                playerInfo: args,
                                cardSet: addedPlayer.cardSet,
                                otherPlayers: table.getPlayers()
                            };
                            client.emit('tableJoined', newPlayer);
                            client.broadcast.emit('newPlayerJoined', newPlayer);
                            startNewGameOnPlayerJoin(table);
                        }
                    }else{
                        client.emit('alreadyLoggedInWithOtherLocation',"You are logged in with system from another location, please close the session from another location and try again.");
                    }
                   
                    
                });
                client.emit('connectionSuccess', {
                    id: client.id
                    //table id removed by kd as it is not rquire right now
                    //tableId: table.gid
                });
                client.on('seeMyCards', function(args) {
                    //console.log(args)
                    //find table //added logic for multi table 
                    var playerTable = tables.getTable(args.tableId);
                    var cardsInfo = playerTable.getCardInfo()[args.id].cards;
                    playerTable.updateSideShow(args.id);
                    client.emit('cardsSeen', {
                        cardsInfo: cardsInfo,
                        players: playerTable.getPlayers(),
                        tableId : playerTable.gid
                    });
                    client.broadcast.emit('playerCardSeen', {
                        id: args.id,
                        players: playerTable.getPlayers(),
                        tableId: playerTable.gid
                    });
                });

                client.on('otherPlayerCards', function(args) {
                    //find table //added logic for multi table 
                    var playerTable = tables.getTable(args.tableId);
                    var cardsInfo = playerTable.getCardInfo();//[args.id].cards;
                    playerTable.updateSideShow(args.id);
                    client.emit('otherPlayerCards', {
                        cardsInfo: cardsInfo,
                        players: playerTable.getPlayers(),
                        tableId : playerTable.gid
                    });
                   
                });

                
                client.on('placePack', function(args) {
                    //added logic for multi table 
                    var playerTable = tables.getTable(args.player.tableId);
                    var players = playerTable.packPlayer(args.player.id);
                    if (playerTable.getActivePlayers() === 1) {
                        playerTable.decideWinner();
                        //for jackpot game
                        var jackpotMsg  = '' ;
                        var gTypeArr = playerTable.GameTypeWithBoot.split('-');
                        if(gTypeArr[0] == '2'){
                            jackpotMsg  = playerTable.jackpotPlayers();
                        }
                        if(jackpotMsg !=''){
                            client.emit('showWinner', {
                                message: jackpotMsg,
                                bet: args.bet,
                                placedBy: args.player.id,
                                players: players,
                                table: playerTable.getTableInfo(),
                                packed: true,
                                tableId: playerTable.gid
    
                            });
                            client.broadcast.emit('showWinner', {
                                message: jackpotMsg,
                                bet: args.bet,
                                placedBy: args.player.id,
                                players: players,
                                table: playerTable.getTableInfo(),
                                packed: true,
                                tableId: playerTable.gid
                            });
                        }else{
                            client.emit('showWinner', {
                                bet: args.bet,
                                placedBy: args.player.id,
                                players: players,
                                table: playerTable.getTableInfo(),
                                packed: true,
                                tableId: playerTable.gid
    
                            });
                            client.broadcast.emit('showWinner', {
                                bet: args.bet,
                                placedBy: args.player.id,
                                players: players,
                                table: playerTable.getTableInfo(),
                                packed: true,
                                tableId: playerTable.gid
                            });
                        }
                        playerTable.stopGame();
                        startNewGame(playerTable);

                    } else {
                        client.emit('playerPacked', {
                            bet: args.bet,
                            placedBy: args.player.id,
                            players: players,
                            table: playerTable.getTableInfo(),
                            tableId: playerTable.gid
                        });
                        client.broadcast.emit('playerPacked', {
                            bet: args.bet,
                            placedBy: args.player.id,
                            players: players,
                            table: playerTable.getTableInfo(),
                            tableId: playerTable.gid
                        });
                    }


                });

                function addClientToMap(userName, socketId, betamt, gametype){
                    if (!userSocketIdMap.has(userName)) {
                        //when user is joining first time
                        var data = {
                            userName : new Set([socketId]),
                            betamt : betamt,
                            gametype : gametype
                        }
                        userSocketIdMap.set(userName, data);
                        
                        return true;
                    } else{
                        //user had already joined from one client and now joining using another
                        //userSocketIdMap.get(userName).add(socketId);
                        return false;
                    }
                }
                function removeClientFromMap(userName, socketId){
                    if (userSocketIdMap.has(userName)) {
                        userSocketIdMap.delete(userName);
                        /*let userSocketIdSet = userSocketIdMap.get(userName);
                        userSocketIdSet.delete(socketID);
                        //if there are no clients for a user, remove that user from online
                        list (map)
                        if (userSocketIdSet.size ==0 ) {
                            userSocketIdMap.delete(userName);
                        }*/
                    }
                }
                function startNewGameOnPlayerJoin(currentTable) {
                    if (currentTable.getPlayersCount() >= 2 && !currentTable.gameStarted) {
                        setTimeout(function() {
                            var sentObj = {
                                counter: 7,
                                tableId: currentTable.gid
                            };
                            client.emit('gameCountDown', 
                                sentObj
                            );
                            client.broadcast.emit('gameCountDown', 
                                sentObj
                            );
                        }, 1000);
                        setTimeout(function() {
                            if (currentTable.getPlayersCount() >= 2 && !currentTable.gameStarted) {
                                currentTable.startGame();
                                var sentObj = {
                                    players: currentTable.getPlayers(),
                                    table: currentTable.getTableInfo(),
                                    tableId : currentTable.gid
                                };
                                client.emit('startNew', sentObj);
                                client.broadcast.emit('startNew', sentObj);
                            } else if (currentTable.getPlayersCount() == 1 && !currentTable.gameStarted) {
                                client.emit('notification', {
                                    message: 'Please wait for more players to join',
                                    timeout: 4000,
                                    tableId : currentTable.gid
                                });
                                client.broadcast.emit('notification', {
                                    message: 'Please wait for more players to join',
                                    timeout: 4000,
                                    tableId : currentTable.gid
                                });
                            }
                        }, 9000);
                    } else if (currentTable.getPlayersCount() == 1 && !currentTable.gameStarted) {
                        client.emit('notification', {
                            message: 'Please wait for more players to join',
                            timeout: 4000,
                            tableId : currentTable.gid
                        });
                        client.broadcast.emit('notification', {
                            message: 'Please wait for more players to join',
                            timeout: 4000,
                            tableId : currentTable.gid
                        });
                    }
                }

                function startNewGame(currentTable) {
                    if (currentTable.getPlayersCount() >= 2 && !currentTable.gameStarted) {
                        setTimeout(function() {
                            client.emit('gameCountDown', {
                                counter: 9,
                                tableId: currentTable.gid
                            });
                            client.broadcast.emit('gameCountDown', {
                                counter: 9,
                                tableId: currentTable.gid
                            });
                        },  6000);
                        setTimeout(function() {
                            if (currentTable.getPlayersCount() >= 2 && !currentTable.gameStarted) {
                                currentTable.startGame();
                                var sentObj = {
                                    players: currentTable.getPlayers(),
                                    table: currentTable.getTableInfo(),
                                    tableId: currentTable.gid
                                };
                                client.emit('startNew', sentObj);
                                client.broadcast.emit('startNew', sentObj);
                            } else if (currentTable.getPlayersCount() == 1) {
                                client.emit('notification', {
                                    message: 'Please wait for more players to join',
                                    timeout: 4000,
                                    tableId : currentTable.gid
                                });
                                client.broadcast.emit('notification', {
                                    message: 'Please wait for more players to join',
                                    timeout: 4000,
                                    tableId : currentTable.gid
                                });
                                // setTimeout(function() {
                                currentTable.reset();
                                var sentObj = {
                                    players: currentTable.getPlayers(),
                                    table: currentTable.getTableInfo(),
                                    tableId: currentTable.gid
                                };
                                client.emit('resetTable', sentObj);
                                client.broadcast.emit('resetTable', sentObj);
                                // }, 7000);
                            }
                        }, 15000);
                    } else if (currentTable.getPlayersCount() == 1) {
                        setTimeout(function() {
                            client.emit('notification', {
                                message: 'Please wait for more players to join',
                                timeout: 4000,
                                tableId : currentTable.gid
                            });
                            client.broadcast.emit('notification', {
                                message: 'Please wait for more players to join',
                                timeout: 4000,
                                tableId : currentTable.gid
                            });
                        }, 4000);
                        setTimeout(function() {
                            currentTable.reset();
                            var sentObj = {
                                players: currentTable.getPlayers(),
                                table: currentTable.getTableInfo(),
                                tableId: currentTable.gid
                            };
                            client.emit('resetTable', sentObj);
                            client.broadcast.emit('resetTable', sentObj);
                        }, 4000);
                    }
                }


                client.on('show', function(args) {
                    //added logic for multi table 
                    var playerTable = tables.getTable(args.player.tableId);
                    var players = playerTable.placeBet(args.player.id, args.bet.amount, args.bet.blind, args.player.playerInfo._id);
                    if (args.bet.show || playerTable.isPotLimitExceeded()) {
                        args.bet.show = true;
                        var msg = playerTable.decideWinner(args.bet.show);

                        //for jackpot game
                        var jackpotMsg  = '' ;
                        var gTypeArr = playerTable.GameTypeWithBoot.split('-');
                        if(gTypeArr[0] == '2'){
                            jackpotMsg  = playerTable.jackpotPlayers();
                        }
                        client.emit('showWinner', {
                            message: msg + ' ' + jackpotMsg,
                            bet: args.bet,
                            placedBy: args.player.id,
                            players: players,
                            table: playerTable.getTableInfo(),
                            potLimitExceeded: table.isPotLimitExceeded(),
                            tableId : playerTable.gid
                        });
                        client.broadcast.emit('showWinner', {
                            message: msg + ' ' + jackpotMsg,
                            bet: args.bet,
                            placedBy: args.player.id,
                            players: players,
                            table: playerTable.getTableInfo(),
                            potLimitExceeded: playerTable.isPotLimitExceeded(),
                            tableId : playerTable.gid
                        });
                        playerTable.stopGame();
                        startNewGame(playerTable);
                    } else {
                        client.emit('betPlaced', {
                            bet: args.bet,
                            placedBy: args.player.id,
                            players: players,
                            table: playerTable.getTableInfo(),
                            tableId : playerTable.gid

                        });
                        client.broadcast.emit('betPlaced', {
                            bet: args.bet,
                            placedBy: args.player.id,
                            players: players,
                            table: playerTable.getTableInfo(),
                            tableId : playerTable.gid
                        });
                    }
                });

                client.on('placeBet', function(args) {
                    //added logic for multi table 
                    var playerTable = tables.getTable(args.player.tableId);
                    //console.log("blind players"  + JSON.stringify(args)  );
                    var players = playerTable.placeBet(args.player.id, args.bet.amount, args.bet.blind, args.player.playerInfo._id);
                    
                    if (args.bet.show || playerTable.isPotLimitExceeded() || playerTable.isBlindLimitExceeded(args.bet.blindPlayers) ) {
                        args.bet.show = true;
                        var msg = playerTable.decideWinner(args.bet.show);
                        //for jackpot game players
                        var jackpotMsg  = '' ;
                        var gTypeArr = playerTable.GameTypeWithBoot.split('-');
                        if(gTypeArr[0] == '2'){
                            jackpotMsg  = playerTable.jackpotPlayers();
                        }
                        //console.log("jackpot data =" + jackpotMsg);
                        client.emit('showWinner', {
                            message: msg + ' ' + jackpotMsg,
                            bet: args.bet,
                            placedBy: args.player.id,
                            players: players,
                            table: playerTable.getTableInfo(),
                            potLimitExceeded: table.isPotLimitExceeded(),
                            tableId : playerTable.gid
                        });
                        client.broadcast.emit('showWinner', {
                            message: msg + ' ' + jackpotMsg,
                            bet: args.bet,
                            placedBy: args.player.id,
                            players: players,
                            table: playerTable.getTableInfo(),
                            potLimitExceeded: playerTable.isPotLimitExceeded(),
                            tableId : playerTable.gid
                        });
                        playerTable.stopGame();
                        startNewGame(playerTable);
                    } else {
                        client.emit('betPlaced', {
                            bet: args.bet,
                            placedBy: args.player.id,
                            players: players,
                            table: playerTable.getTableInfo(),
                            tableId : playerTable.gid

                        });
                        client.broadcast.emit('betPlaced', {
                            bet: args.bet,
                            placedBy: args.player.id,
                            players: players,
                            table: playerTable.getTableInfo(),
                            tableId : playerTable.gid
                        });
                    }
                });

                client.on('placeTips', function(args) {
                    //added logic for multi table 
                    
                    var playerTable = tables.getTable(args.player.tableId);
                    //console.log("blind players"  + JSON.stringify(args)  );
                    var players = playerTable.placeTips(args.player.id, args.bet.amount);
            
                    var msg = args.player.playerInfo.displayName + " give the tips to dealer ₹" + args.bet.amount

                        client.emit('showTips', {
                            message : msg,
                            table: playerTable.getTableInfo(),
                            tableId : playerTable.gid
                        });
                        client.broadcast.emit('showTips', {
                            message: msg,
                            table: playerTable.getTableInfo(),
                            tableId : playerTable.gid
                        });
                });

                client.on('placeChange', function(args) {
                    //added logic for multi table 
                    
                    var playerTable = tables.getTable(args.player.tableId);
                    //console.log("blind players"  + JSON.stringify(args)  );
                    var players = playerTable.placeTips(args.player.id, args.bet.amount);
            
                    var msg = args.player.playerInfo.displayName + " change dealer to spend ₹" + args.bet.amount

                        client.emit('showTips', {
                            message : msg,
                            table: playerTable.getTableInfo(),
                            tableId : playerTable.gid
                        });
                        client.broadcast.emit('showTips', {
                            message: msg,
                            table: playerTable.getTableInfo(),
                            tableId : playerTable.gid
                        });
                });

                client.on('showOpenGameWinner', function(args) {
                    //added logic for multi table 
                    var playerTable = tables.getTable(args.player.tableId);
                
                    var players = playerTable.getPlayers();
                        args.bet.show = true;
                        var msg = playerTable.decideWinner(args.bet.show);
                        client.emit('openGameshowWinner', {
                            message: msg,
                            bet: args.bet,
                            placedBy: args.player.id,
                            players: players,
                            table: playerTable.getTableInfo(),
                            potLimitExceeded: true,
                            tableId : playerTable.gid
                        });
                        client.broadcast.emit('openGameshowWinner', {
                            message: msg,
                            bet: args.bet,
                            placedBy: args.player.id,
                            players: players,
                            table: playerTable.getTableInfo(),
                            potLimitExceeded: true,
                            tableId : playerTable.gid
                        });
                        playerTable.stopGame();
                        startNewGame(playerTable);
                   
                });

                

                client.on('respondSideShow', function(args) {
                    //added logic for multi table 
                    var playerTable = tables.getTable(args.player.tableId);
                    var players = playerTable.getPlayers(),
                        msg = "";
                    playerTable.resetSideShowTurn();
                    if (args.lastAction === "Denied") {
                        playerTable.setNextPlayerTurn();
                        playerTable.sideShowDenied(args.player.id);
                        msg = [args.player.playerInfo.userName, ' has denied side show'].join('');
                        client.emit('sideShowResponded', {
                            message: msg,
                            placedBy: args.player.id,
                            players: players,
                            table: playerTable.getTableInfo(),
                            tableId : playerTable.gid
                        });
                        client.broadcast.emit('sideShowResponded', {
                            message: msg,
                            bet: args.bet,
                            placedBy: args.player.id,
                            players: players,
                            table: playerTable.getTableInfo(),
                            tableId : playerTable.gid
                        });

                    } else if (args.lastAction === "Accepted") {
                        playerTable.setNextPlayerTurn();
                        msg = playerTable.sideShowAccepted(args.player.id);
                        client.emit('sideShowResponded', {
                            message: msg.message,
                            placedBy: args.player.id,
                            players: players,
                            table: playerTable.getTableInfo(),
                            tableId : playerTable.gid
                        });
                        client.broadcast.emit('sideShowResponded', {
                            message: msg.message,
                            bet: args.bet,
                            placedBy: args.player.id,
                            players: players,
                            table: playerTable.getTableInfo(),
                            tableId : playerTable.gid
                        });
                    }
                });
                client.on('placeSideShow', function(args) {
                    //added logic for multi table 
                    var playerTable = tables.getTable(args.player.tableId);
                    var sideShowMessage = playerTable.placeSideShow(args.player.id, args.bet.amount, args.bet.blind, args.player.playerInfo._id);
                    var players = playerTable.getPlayers();
                    if (playerTable.isPotLimitExceeded()) {
                        args.bet.show = true;
                        var msg = playerTable.decideWinner(args.bet.show);
                        //for jackpot game
                        var jackpotMsg  = '' ;
                        var gTypeArr = playerTable.GameTypeWithBoot.split('-');
                        if(gTypeArr[0] == '2'){
                            jackpotMsg  = playerTable.jackpotPlayers();
                        }
                        client.emit('showWinner', {
                            message: msg + ' ' + jackpotMsg,
                            bet: args.bet,
                            placedBy: args.player.id,
                            players: players,
                            table: playerTable.getTableInfo(),
                            potLimitExceeded: playerTable.isPotLimitExceeded(),
                            tableId : playerTable.gid
                        });
                        client.broadcast.emit('showWinner', {
                            message: msg + ' ' + jackpotMsg,
                            bet: args.bet,
                            placedBy: args.player.id,
                            players: players,
                            table: playerTable.getTableInfo(),
                            potLimitExceeded: playerTable.isPotLimitExceeded(),
                            tableId : playerTable.gid
                        });
                        playerTable.stopGame();
                        startNewGame(playerTable);
                    } else {
                        client.emit('sideShowPlaced', {
                            message: sideShowMessage,
                            bet: args.bet,
                            placedBy: args.player.id,
                            players: players,
                            table: playerTable.getTableInfo(),
                            tableId : playerTable.gid

                        });
                        client.broadcast.emit('sideShowPlaced', {
                            message: sideShowMessage,
                            bet: args.bet,
                            placedBy: args.player.id,
                            players: players,
                            table: playerTable.getTableInfo(),
                            tableId : playerTable.gid
                        });
                    }
                });
                client.on('removeUserFromSocket', function(args) {
                    console.log("remove user" + JSON.stringify(args.player.playerInfo.userName) );
                    removeClientFromMap( args.player.playerInfo.userName, client.id);
                   
                });
                client.on('disconnect', function() {
                    //console.log('disconnect for ' + clients );
                    if(client.tableId){
                        var playerTable = tables.getTable(client.tableId);
                        if (playerTable.gameStarted && playerTable.isActivePlayer(client.id)) {
                            playerTable.packPlayer(client.id);
                        }
                        var removedPlayer = playerTable.removePlayer(client.id);
                        
                        console.log('total players left:' + JSON.stringify(removedPlayer) );
                        client.broadcast.emit('playerLeft', {
                            bet: {
                                lastAction: "Packed",
                                lastBet: ""
                            },
                            removedPlayer: removedPlayer,
                            placedBy: removedPlayer.id,
                            players: playerTable.getPlayers(),
                            table: playerTable.getTableInfo(),
                            tableId : playerTable.gid
                        });
                        removeClientFromMap( removedPlayer.playerInfo.userName, client.id);
                        if (playerTable.getActivePlayers() == 1 && playerTable.gameStarted) {
                            playerTable.decideWinner();
                            //for jackpot game
                            var jackpotMsg  = '' ;
                            var gTypeArr = playerTable.GameTypeWithBoot.split('-');
                            if(gTypeArr[0] == '2'){
                                jackpotMsg  = playerTable.jackpotPlayers();
                            }
                            if(jackpotMsg != ''){
                                client.emit('showWinner', {
                                    message: jackpotMsg,
                                    bet: {
                                        lastAction: "Packed",
                                        lastBet: ""
                                    },
                                    placedBy: removedPlayer.id,
                                    players: playerTable.getPlayers(),
                                    table: playerTable.getTableInfo(),
                                    packed: true,
                                    tableId : playerTable.gid
        
                                });
                                client.broadcast.emit('showWinner', {
                                    message: jackpotMsg,
                                    bet: {
                                        lastAction: "Packed",
                                        lastBet: ""
                                    },
                                    placedBy: removedPlayer.id,
                                    players: playerTable.getPlayers(),
                                    table: playerTable.getTableInfo(),
                                    packed: true,
                                    tableId : playerTable.gid
                                });
                            }else{
                                client.emit('showWinner', {
                                    bet: {
                                        lastAction: "Packed",
                                        lastBet: ""
                                    },
                                    placedBy: removedPlayer.id,
                                    players: playerTable.getPlayers(),
                                    table: playerTable.getTableInfo(),
                                    packed: true,
                                    tableId : playerTable.gid
        
                                });
                                client.broadcast.emit('showWinner', {
                                    bet: {
                                        lastAction: "Packed",
                                        lastBet: ""
                                    },
                                    placedBy: removedPlayer.id,
                                    players: playerTable.getPlayers(),
                                    table: playerTable.getTableInfo(),
                                    packed: true,
                                    tableId : playerTable.gid
                                });
                            }
                            
                            playerTable.stopGame();
                            startNewGame(playerTable);
                        }
                    }
                    
                });
            });

        }
    }

}
module.exports = new Io();