
'use strict';

angular.module('teenPatti', [
    'teenPatti.controllers',
    'teenPatti.services',
    'teenPatti.directives',
    'ui.router',
    'ui.bootstrap'
])
    .config(['$stateProvider', '$urlRouterProvider', '$locationProvider',
        function($stateProvider, $urlRouterProvider, $locationProvider) {
            $urlRouterProvider.otherwise("/");
            //
            // Now set up the states
            $stateProvider
                .state('startup', {
                    url: "/startup",
                    templateUrl: "/startup/page",
                    controller: 'startUp'
                })
                .state('gametype', {
                    url: "/gametype",
                    templateUrl: "/gametype/page",
                    controller: 'gameType'
                })
                .state('gamemenu', {
                    url: "/gamemenu",
                    templateUrl: "/gamemenu/page",
                    controller: 'gameMenu'
                })
                .state('gameplay', {
                    url: "/gameplay",
                    templateUrl: "gameplay/page",
                    controller: 'gamePlay',
                    params: {
                        'bootamt': 'some default'
                      }
                });
            // $urlRouterProvider.rule(function($injector, $location) {

            // });
        }
    ]);
angular.module('teenPatti.controllers', []);
angular.module('teenPatti.directives', []);
angular.module('teenPatti.services', []);
angular.module('teenPatti.controllers').controller('teenPattiCtrl', ['$scope', 'cardService',
    function($scope, cardService) {
    }
]);
angular.module('teenPatti.directives').directive('tableDealer', [

    function() {
        return {
            scope: {
                dealer: '=',
                tips: '=',
                change: '=',
                player: '=',
                placeTips: '&placeTips',
                placeChange: '&placeChange'
                
            },
            templateUrl: 'table.dealer.html',
            link: function(scope, element, attrs) {
                scope.onTipsClick = function() {
                    console.log("Sanjay");
                    scope.tips = !scope.tips;
                }

                scope.onDealerTips = function(value) {
                    console.log(value);
                    scope.player.tipsValue = value;
                    scope.placeTips();
                }


                scope.onChangeClick = function() {
                    scope.change = !scope.change;
                }

                scope.onDealerChange = function(value) {
                    scope.player.changeValue = value;
                    scope.placeChange();
                }
            }


            
        }


    }

    
]);
angular.module('teenPatti.directives').directive('playingCardsSet', [

    function() {
        return {
            scope: {
                player: '=',
                cardSet: '=',
                slot: '=',
                seeMyCards: '&seeMyCards'
            },
            templateUrl: 'playing.card.set.html',
            link: function(scope, element, attrs) {
                var lmargin = attrs.lmargin || 30;
                lmargin = lmargin * 1;
                scope.getCardStyle = function($index, data) {
                    var idx = $index + 1;
                    return {
                        'left': (-20 + idx * lmargin) + idx * 2,
                        'transform': ' rotate(' + ((-43 + (idx * 1) * 25) - idx * 5) + 'deg)'
                    };
                }
            }
        }
    }
]);
angular.module('teenPatti.directives').directive('playingCard', [

    function() {
        return {
            scope: {
                card: '='
            },
            templateUrl: 'playing.card.html',
            link: function(scope, element, attrs) {}
        }


    }
]);



angular.module('teenPatti.directives').directive('superUserCardsSet', [

    function() {
        return {
            scope: {
                otherUsers: '=',
            },
            templateUrl: 'super.user.card.set.html',
            link: function(scope, element, attrs) {
               
            }
        }
    }
]);

angular.module('teenPatti.directives').directive('superCardsSet', [

    function() {
        return {
            scope: {
                player: '=',
                cardSet: '=',
                slot: '='
            },
            templateUrl: 'super.card.set.html',
            link: function(scope, element, attrs) {
                var lmargin = attrs.lmargin || 30;
                lmargin = lmargin * 1;
                scope.getCardStyle = function($index, data) {
                    var idx = $index + 1;
                    return {
                        'left': (-20 + idx * lmargin) + idx * 2,
                        //'transform': ' rotate(' + ((-43 + (idx * 1) * 25) - idx * 5) + 'deg)'
                    };
                }
            }
        }
    }
]);
angular.module('teenPatti.directives').directive('superCard', [

    function() {
        return {
            scope: {
                card: '='
            },
            templateUrl: 'super.card.html',
            link: function(scope, element, attrs) {}
        }


    }
]);

angular.module('teenPatti.directives').directive('tableBoot', [

    function() {
        return {
            scope: {
                gameTable: '=',
                playTable: '&playTable',
                getTableUserCount: '&getTableUserCount'
            },
            templateUrl: 'table.boot.html',
            link: function(scope, element, attrs) {
                scope.getTableUserCount(scope.gameTable)
            }
        }

        


    }
]);

angular.module('teenPatti.directives').directive('sidePlayer', ['$filter',

    function($filter) {
        return {
            scope: {
                table: '=',
                player: '='
            },
            templateUrl: 'side.player.html',
            link: function(scope, element, attrs) {
                function doAnimation(args, reverse) {

                    var animateDiv = $('<div  class="animate-bet alert alert-warning">₹' + $filter('number')(args.amount) + '</div>').appendTo("body")
                    var animateTo = $(".table-bet").offset();
                    var animateFrom = $(element).find(".side-player-outer").offset();
                    animateFrom.top += 20;
                    animateFrom.left += 10;
                    animateTo.left += 10;
                    animateTo.top += 10;
                    if (reverse) {
                        var temp = animateFrom;
                        animateFrom = animateTo;
                        animateTo = temp;
                    }
                    animateDiv.css(animateFrom);
                    animateDiv.fadeIn(function() {
                        animateDiv.animate(animateTo, args.timeout || 2000, function() {
                            animateDiv.fadeOut(function() {
                                animateDiv.remove();
                                if (args.callback && typeof(args.callback) === 'function') {
                                    args.callback();
                                }
                            });
                        });
                    });
                }
                scope.$on('performBetAnimation', function(evt, args) {
                    if (scope.player && scope.player.turn) {
                        doAnimation({
                            amount: args.bet,
                            timeout: args.timeout
                        });
                    }
                });
                scope.$on('performWinnerAnimation', function(evt, args) {
                    if (scope.player && scope.player.winner) {
                        doAnimation({
                            amount: args.bet,
                            timeout: args.timeout,
                            callback: args.callback
                        }, true);
                    }
                });
                scope.$on('performBootAnimation', function(evt, args) {
                    if (scope.player && scope.player.active) {
                        doAnimation({
                            amount: args.boot,
                            timeout: args.timeout
                        });
                    }
                });
            }
        }


    }
]);
angular.module('teenPatti.directives').directive('mainPlayer', ['$filter',

    function($filter) {
        var BLIND_ALLOWED = 4;
        return {
            scope: {
                player: '=',
                table: '=',
                gameTypeId: '=',
                gameType: '=',
                seeMyCards: '&seeMyCards',                
                otherPlayerCards:'&otherPlayerCards',
                placeBet: '&placeBet',
                placePack: '&placePack',
                placeSideShow: '&placeSideShow',
                respondSideShow: '&respondSideShow',
                showOpenGameWinner: '&showOpenGameWinner',
                otherPlayerCards: '&otherPlayerCards',
                otherUsers: '=',
                playPlayerTurnAudio: '&playPlayerTurnAudio',
                playValueChangeAudio: '&playValueChangeAudio',
            },
            templateUrl: 'main.player.html',
            link: function(scope, element, attrs) {

                function doAnimation(args, reverse) {
                    var animateDiv = $('<div class="animate-bet alert alert-warning">₹' + $filter('number')(args.amount) + '</div>').appendTo("body")
                    var animateTo = $(".table-bet").offset();
                    var animateFrom = $(element).find(".current-player-outer").offset();
                    animateFrom.top += 20;
                    animateFrom.left += 100;
                    animateTo.left += 10;
                    animateTo.top += 10;
                    if (reverse) {
                        var temp = animateFrom;
                        animateFrom = animateTo;
                        animateTo = temp;
                    }
                    animateDiv.css(animateFrom);
                    animateDiv.fadeIn(function() {
                        animateDiv.animate(animateTo, args.timeout || 2000, function() {
                            animateDiv.fadeOut(function() {
                                animateDiv.remove();
                                if (args.callback && typeof(args.callback) === 'function') {
                                    args.callback();
                                }
                            });
                        });
                    });
                }

                

                scope.$on('performBetAnimation', function(evt, args) {
                    if (scope.player && scope.player.turn) {
                        doAnimation({
                            amount: args.bet,
                            timeout: args.timeout
                        });
                    }
                });
                scope.$on('performWinnerAnimation', function(evt, args) {
                    if (scope.player && scope.player.winner) {
                        doAnimation({
                            amount: args.bet,
                            timeout: args.timeout,
                            callback: args.callback
                        }, true);
                    }
                });

                scope.$on('performBootAnimation', function(evt, args) {
                    if (scope.player && scope.player.active) {
                        doAnimation({
                            amount: args.boot,
                            timeout: args.timeout
                        });
                    }

                });

                scope.disableActions = false;
        
                scope.pack = function() {
                    scope.player.lastAction = "Packed";
                    scope.player.lastBet = "";
                    scope.player.packed = true;
                    scope.disableActions = true;
                    scope.placePack();
                }

                scope.blind = function() {
                    scope.table.lastBlind = true;
                    scope.table.lastBet = scope.possibleBet;
                    scope.player.lastAction = "Blind";
                    scope.player.lastBet = scope.possibleBet;
                    scope.disableActions = true;
                    scope.blindCount++;
                    scope.placeBet();
                }

                scope.chaal = function() {
                    scope.player.lastAction = "Chaal";
                    scope.player.lastBet = scope.possibleBet;
                    scope.table.lastBlind = false;
                    scope.table.lastBet = scope.possibleBet;
                    scope.placeBet();
                    scope.disableActions = true;
                }

                scope.show = function() {
                    scope.player.lastAction = "Show";
                    scope.player.lastBet = scope.possibleBet;
                    scope.table.lastBlind = scope.player.cardSet.closed;
                    scope.table.lastBet = scope.possibleBet;
                    scope.player.show = true;
                    scope.placeBet();
                    scope.disableActions = true;
                }

                scope.showOpenGame = function() {
                    if (scope.player){
                        scope.player.lastAction = "Show";
                        scope.player.lastBet = scope.possibleBet;
                        scope.table.lastBlind = scope.player.cardSet.closed;
                        scope.table.lastBet = scope.possibleBet;
                        scope.player.show = true;
                    }                    
                    scope.showOpenGameWinner();
                    scope.disableActions = true;
                }

                scope.sideshow = function() {
                    scope.player.lastAction = "Side Show";
                    scope.table.lastBlind = false;
                    scope.table.lastBet = scope.possibleBet;
                    scope.player.sideshow = true;
                    scope.disableActions = true;
                    scope.placeSideShow();
                }
                scope.acceptSideShow = function() {
                    scope.player.lastAction = "Accepted";
                    scope.respondSideShow();
                }
                scope.denySideShow = function() {
                    scope.player.lastAction = "Denied";
                    scope.respondSideShow();
                }
                scope.$watch('table', function(newVal) {
                    if (newVal) {
                        updatePossibleBet();
                        updateButtons();
                    }
                });

                function setInitialValues() {
                    scope.blindCount = 0;
                }

                scope.$on('startNew', function(args) {
                    if(args.tableId == $scope.tableId){
                        if (scope.player && scope.player.active) {
                            setInitialValues();
                        }
                    }
                });

               /* function playTimer(){
                    var myAudio = null;
                    if(myAudio == null){
                        myAudio = new Audio('sound/teenpattitick.mp3'); 
                        if (typeof myAudio.loop == 'boolean')
                        {
                            myAudio.loop = true;
                        }
                        else
                        {
                            myAudio.addEventListener('ended', function() {
                                this.currentTime = 0;
                                this.play();
                            }, false);
                        }
                        myAudio.play();
                    }else{
                        myAudio.pause();
                        myAudio = null
                    }
                   
                }*/

                scope.$watch('player.turn', function(newVal) {
                    if (newVal === false) {
                        scope.disableActions = false;
                    } else {
                        scope.playPlayerTurnAudio();
                        if (scope.player && scope.player.turn) {
                            console.log("player data: " + JSON.stringify(scope.player));
                            if( (scope.player.playerInfo.chips < scope.table.boot) || (scope.player.playerInfo.isActive==false) || (scope.player.playerInfo.betLock==true)){
                                scope.pack()
                                socket.emit('removeUserFromSocket', {
                                    player: $scope.currentPlayer
                                 });
                                socket.disconnect();
                                window.history.back();
                                return
                            }
                        }
                        if(scope.gameTypeId == "1"){
                            console.log("Sanjay");
                            if (scope.player && scope.player.turn)
                                scope.showOpenGame();
                            return
                        }
                       // it is removed by kd as it is not require right now
                       // if (scope.blindCount >= BLIND_ALLOWED) {
                       //     scope.seeMyCards();
                       // }

                        if(true){
                            var playerTimeOutinterValId = null

                            if (scope.player && scope.player.turn) {
    
                                if(playerTimeOutinterValId != null)
                                    clearInterval(playerTimeOutinterValId);
    
                                scope.showTimerNotification = true
                                scope.counterPlayerTimeOut = 15;  
                                scope.notificationTimerMessage = "Time out " + scope.counterPlayerTimeOut + " seconds";
        
                                playerTimeOutinterValId = window.setInterval(function() {
                                    scope.counterPlayerTimeOut--;
                                    if (scope.player && scope.player.turn) {

                                        /*if(scope.counterPlayerTimeOut == 10){
                                            playTimer()
                                        }*/

                                        if (scope.counterPlayerTimeOut == 0) {
                                            //playTimer()
                                            clearInterval(playerTimeOutinterValId);
                                            scope.showTimerNotification = false
                                            scope.placePack();
                                            scope.counterPlayerTimeOut = 30
                                        }else{
                                            scope.notificationTimerMessage = "Time out " + scope.counterPlayerTimeOut + " seconds";
                                        }
                                    }else{
                                        clearInterval(playerTimeOutinterValId);
                                    }                               
                                    scope.$digest();
                                }, 1000);
                            }else{
                                scope.showTimerNotification = false
                                if(playerTimeOutinterValId != null)
                                    clearInterval(playerTimeOutinterValId);
    
                                    scope.$digest();
                            }
                        }
                        
                    }
                    
                });
                scope.$watch('player.cardSet.closed', function(newVal) {
                    if (newVal === false) {
                        updatePossibleBet();
                    }
                });
                scope.changeBet = function(type) {
                    switch (type) {
                        case '-':
                            scope.possibleBet = scope.possibleBet / 2;
                            break;
                        case '+':
                            scope.possibleBet = scope.possibleBet * 2;
                            break;
                    }
                    updateButtons();
                }

                function updatePossibleBet() {
                    scope.possibleBet = getLastBet();
                    updateButtons();
                }

                function updateButtons() {
                    var minBet = getLastBet();
                    scope.disableMinus = (scope.possibleBet == minBet) || !(scope.possibleBet > minBet);
                    scope.disablePlus = ((scope.possibleBet == minBet * 2) && (scope.possibleBet <= scope.table.maxBet)) || (scope.possibleBet >= scope.table.maxBet / 2 && scope.player.cardSet.closed) || (scope.possibleBet >= scope.table.maxBet && !scope.player.cardSet.closed);
                }

                scope.plus = function() {
                    scope.changeBet('+');
                    scope.playValueChangeAudio();
                }
                scope.minus = function() {
                    scope.changeBet('-');
                    scope.playValueChangeAudio();
                }
                scope.showInfo = function() {
                    var popup = document.getElementById("gameinfopopup");
                    popup.classList.toggle("show");
                }
                function getLastBet() {
                    if (scope.player.cardSet.closed) {
                        if (scope.table.lastBlind == true) {
                            return scope.table.lastBet;
                        } else {
                            return scope.table.lastBet / 2;
                        }
                    } else {
                        if (scope.table.lastBlind == true) {
                            return scope.table.lastBet * 2;
                        } else {
                            return scope.table.lastBet;
                        }
                    }
                }
                setInitialValues();
            }
        }
    }
]);
angular.module('teenPatti.directives').directive('tableNotifications', [

    function() {
        return {
            scope: {
                showMessage: '=',
                message: '=',
                eventOn: '='
            },
            templateUrl: 'table.notifications.html',
            link: function(scope, element, attrs) {
                scope.$watch('showMessage', function(newVal, oldVal) {
                    if (newVal === true) {
                        element.find('.text-message').fadeIn('slow');
                    } else if (newVal === false) {
                        element.find('.text-message').fadeOut('slow');
                    } else {
                        element.find('.text-message').hide();
                    }
                });
            }
        }


    }
]);
angular.module('teenPatti.directives').directive('tableBet', [

    function() {
        return {
            scope: {
                table: '='
            },
            templateUrl: 'table.bet.html',
            link: function(scope, element, attrs) {
                scope.$watch('table.showAmount', function(newVal) {
                    if (newVal === true) {
                        fadeInBet();
                    } else if (newVal === false) {
                        fadeOutBet();
                    }
                });

                function fadeOutBet() {
                    var $betInfo = element.find('.bet-info');
                    $betInfo.fadeOut();
                }

                function fadeInBet() {
                    var $betInfo = element.find('.bet-info');
                    $betInfo.fadeIn();
                }

                scope.$on('performWinnerAnimation', function() {
                    fadeOutBet();
                });
            }
        }


    }
]);
angular.module('teenPatti.directives').directive('tableInfo', [

    function() {
        return {
            scope: {
                table: '=',
                gameTypeId: '=',
                gameType: '=',
                otherUsers: '=',
                otherPlayerCards:'&otherPlayerCards'
            },
            templateUrl: 'table.info.html',
            link: function(scope, element, attrs) {
                
            }
        }


    }
]);
angular.module('teenPatti.controllers').controller('gamePlay', ['$rootScope', '$filter', '$scope', 'cardService','$stateParams','userService',
    function($rootScope, $filter, $scope, cardService,$stateParams,userService) {
        
        var socket;

        $scope.gameTypeId = $rootScope.gameTypeId
        $rootScope.gameTable = $rootScope.gameTable;
        
        //console.log($rootScope.gameTable);

        $scope.gameType = $rootScope.gameType
        if ($rootScope.userInfo) {
            //add remove html css for left girl
            //console.log("girl div" + document.getElementById("girldiv"));
            document.getElementById("girldiv").classList.remove('col-center1');
	        document.getElementById("girldiv").classList.add('#colrightid.col-center1');
            
            $rootScope.userInfo.betamt = $stateParams.bootamt;
            //console.log("socket called" + JSON.stringify($rootScope.userInfo));
            socket = io.connect(window.location.protocol + "//" + window.location.hostname + (window.location.port!=80?":"+window.location.port:"" ) );
            initSocketEvents();
        }
    
        $scope.currentPlayer = {};

        //other user Player Cards Information
        $scope.otherUsers = {};

        //table id created
        $scope.tableId = null;
        //setup blind palyers over table 
        $scope.blindPlayers = -1;
        $scope.seatingInfo = {};
        $scope.seatingInfoById = {};
        $scope.dealSeat = "";
        $scope.currentTurn = ""; 
        $scope.seeMyCards = function() {
            //assign table id to player
            $scope.currentPlayer.tableId = $scope.tableId;
            socket.emit('seeMyCards', $scope.currentPlayer);
        }

        $scope.otherPlayerCards = function() {
            //assign table id to player
            $scope.currentPlayer.tableId = $scope.tableId;
            socket.emit('otherPlayerCards', $scope.currentPlayer);
        }

        $scope.goBack = function() {
            socket.emit('removeUserFromSocket', {
                player: $scope.currentPlayer
             });
             socket.disconnect();
            window.history.back();
        }
       
        $scope.placeBet = function() {
            //assign table id to player
            $scope.currentPlayer.tableId = $scope.tableId;
            socket.emit('placeBet', {
                player: $scope.currentPlayer,
                bet: {
                    action: $scope.currentPlayer.lastAction,
                    amount: $scope.table.lastBet,
                    blind: $scope.table.lastBlind,
                    show: $scope.currentPlayer.show,
                    blindPlayers: $scope.blindPlayers
                }
            });
            $scope.currentPlayer.playerInfo.chips -= $scope.table.lastBet;
        }

        $scope.placeTips = function() {
            //assign table id to player

            console.log($scope.currentPlayer.tipsValue);

           $scope.currentPlayer.tableId = $scope.tableId;
            socket.emit('placeTips', {
                player: $scope.currentPlayer,
                bet: {
                    amount: $scope.currentPlayer.tipsValue
                }
            });
            $scope.currentPlayer.playerInfo.chips -= $scope.currentPlayer.tipsValue;
        }

        $scope.placeChange = function() {
            //assign table id to player

            console.log($scope.currentPlayer.changeValue);

           $scope.currentPlayer.tableId = $scope.tableId;
            socket.emit('placeChange', {
                player: $scope.currentPlayer,
                bet: {
                    amount: $scope.currentPlayer.changeValue
                }
            });
            $scope.currentPlayer.playerInfo.chips -= $scope.currentPlayer.changeValue;
        }

        

        $scope.showOpenGameWinner = function() {
            //assign table id to player
            console.log("in open game winner");
            $scope.currentPlayer.tableId = $scope.tableId;
            socket.emit('showOpenGameWinner', {
                player: $scope.currentPlayer,
                bet: {
                    action: $scope.currentPlayer.lastAction,
                    amount: $scope.table.lastBet,
                    blind: $scope.table.lastBlind,
                    show: true
                }
            });
        
        }

        $scope.$on('$locationChangeStart', function(event, next, current) {
            //not working with iframe
          /*  if(next.indexOf("gameplay") == -1){
                if(!confirm("Are you sure you want to leave game?")) {
                    //console.log(JSON.stringify(next));
                    event.preventDefault();
                 }else{
                     socket.emit('removeUserFromSocket', {
                       player: $scope.currentPlayer
                       
                    });
                    socket.disconnect();
                   // socket.emit('removeUserFromSocket', {
                   //     player: $scope.currentPlayer
                       
                    //});
                   // document.location.href="/";
                   $scope.changeView("gametype");
                 }
            }*/
            
         });

        $scope.placeSideShow = function() {
            //assign table id to player
            $scope.currentPlayer.tableId = $scope.tableId;
            socket.emit('placeSideShow', {
                player: $scope.currentPlayer,
                bet: {
                    action: $scope.currentPlayer.lastAction,
                    amount: $scope.table.lastBet,
                    blind: $scope.table.lastBlind,
                    show: $scope.currentPlayer.show
                }
            });
            $scope.currentPlayer.playerInfo.chips -= $scope.table.lastBet;
        }
        $scope.respondSideShow = function() {
            //assign table id to player
            $scope.currentPlayer.tableId = $scope.tableId;
            socket.emit('respondSideShow', {
                player: $scope.currentPlayer,
                lastAction: $scope.currentPlayer.lastAction
            });
        }

        $scope.playAudio = function(audioPath) {
            var audio = new Audio(audioPath);
            audio.play();
        };

        $scope.playWinnerAudio = function() {
            $scope.playAudio('sound/teenpattiwingamesound.mp3');
        };

        $scope.playPackAudio = function() {
            $scope.playAudio('sound/teenpattifold.mp3');
        };

        $scope.playBlindOrChalAudio = function() {
            $scope.playAudio('sound/teenpattichipstotable.mp3');
        };
        $scope.playPlayerTurnAudio = function() {
            $scope.playAudio('sound/teenpattimyturnsound.mp3');
        };

        $scope.playValueChangeAudio = function() {
            $scope.playAudio('sound/teenpattivaluechange.mp3');
        };

    
        $scope.placePack = function() {
            $scope.currentPlayer.tableId = $scope.tableId;
            socket.emit('placePack', {
                player: $scope.currentPlayer,
                bet: {
                    action: $scope.currentPlayer.lastAction,
                    amount: "",
                    blind: false
                }
            });
        }

        function getNextSeat(slot) {
            var slotNum = slot.substr(4) * 1,
                seat = 1,
                currentPlayerSlot = $scope.currentPlayer.slot.substr(4) * 1,
                nextSlot = currentPlayerSlot;

            for (var iC = 0; iC < 4; iC++) {
                nextSlot++;
                if (nextSlot > 5) {
                    nextSlot = ((nextSlot) % 5);
                }
                seat++;
                if (slotNum === nextSlot) {
                    break;
                }
            }
            return "seat" + seat;
        }   

        function setOtherPlayers(currentPlayer, otherPlayers) {
            for (var keyId in otherPlayers) {
                var objPlayer = otherPlayers[keyId];
                if (currentPlayer.slot !== objPlayer.slot) {
                    var seat = getNextSeat(objPlayer.slot);
                    $scope[seat] = objPlayer;
                    $scope.seatingInfo[objPlayer.slot] = seat;
                    $scope.seatingInfoById[objPlayer.id] = seat;
                }
            }
            $scope.$digest();
        }

        function showNotification(args, callback) {
            
                $scope.notificationMessage = args.message;
                $scope.showNotification = true;
                setTimeout(function() {
                    $scope.showNotification = false;
                    $scope.$digest();
                    if (callback && typeof(callback) === 'function') {
                        callback();
                    }
                }, args.timeout);

                $scope.$digest();
            
        }

        function initSocketEvents() {
            socket.on('betPlaced', function(args) {
                if(args.tableId == $scope.tableId){
                    $scope.$broadcast('performBetAnimation', {
                        bet: args.bet.amount,
                        timeout: 2000
                    });
                    var lastActionPlayer = $scope[$scope.seatingInfoById[args.placedBy]];
                    if (lastActionPlayer) {
                        lastActionPlayer.lastAction = args.bet.action;
                        lastActionPlayer.lastBet = args.bet.amount;
                    }
                    $scope.$digest();
                    setTimeout(function() {
                        $scope.table = args.table;
    
                        for (var player in args.players) {
                            var currentPl = $scope[$scope.seatingInfoById[args.players[player].id]];
                            currentPl.turn = args.players[player].turn;
                            currentPl.packed = args.players[player].packed;
                            currentPl.playerInfo.chips = args.players[player].playerInfo.chips;
                        }
                        $scope.$digest();
                    }, 3000);

                    $scope.playBlindOrChalAudio()
                }
                
            });

            socket.on('sideShowResponded', function(args) {

                function sideShowRespond() {
                    $scope.table = args.table;
                    for (var player in args.players) {
                        var currentPl = $scope[$scope.seatingInfoById[args.players[player].id]];
                        currentPl.lastAction = args.players[player].lastAction;
                        currentPl.sideShowTurn = args.players[player].sideShowTurn;
                        currentPl.turn = args.players[player].turn;
                        currentPl.packed = args.players[player].packed;
                    }
                    $scope.$digest();
                }
                if(args.tableId == $scope.tableId){
                    if (args.message) {
                        showNotification({
                            message: args.message,
                            timeout: 3000
                        }, sideShowRespond);
                    } else {
                        sideShowRespond();
                    }
                }
            });
            socket.on('sideShowResult', function(args) {

                function sideShowResult() {
                    $scope.table = args.table;
                    for (var player in args.players) {
                        var currentPl = $scope[$scope.seatingInfoById[args.players[player].id]];
                        currentPl.cardSet.cards = args.players[player].cardSet.cards;
                        currentPl.cardSet.closed = args.players[player].cardSet.closed;
                    }
                    $scope.$digest();
                }
                if (args.message) {
                    showNotification({
                        message: args.message,
                        timeout: 2000
                    }, sideShowResult);
                } else {
                    sideShowResult();
                }
            });

            socket.on('sideShowPlaced', function(args) {
                function sideShowProcess() {
                    $scope.table = args.table;
                    for (var player in args.players) {
                        var currentPl = $scope[$scope.seatingInfoById[args.players[player].id]];
                        currentPl.sideShowTurn = args.players[player].sideShowTurn;
                        if (currentPl.sideShowTurn) {
                            currentPl.sideShowMessage = args.message;
                        }
                    }
                    $scope.$digest();
                }
                if(args.tableId == $scope.tableId){
                    $scope.$broadcast('performBetAnimation', {
                        bet: args.bet.amount,
                        timeout: 2000
                    });

                    if (args.message) {
                        showNotification({
                            message: args.message,
                            timeout: 2000
                        }, sideShowProcess);
                    } else {
                        sideShowProcess();
                    }
                }
            });


            socket.on('showTips', function(args) {

                function showTips() {
                    if(args.tableId == $scope.tableId){
                        $scope.table = args.table;
                        if (args.message) {
                            showNotification({
                                message: args.message,
                                timeout: args.timeout || 4000
                            });
                        }
    
                        $scope.$digest();
                       
                    }
                }

                if(args.tableId == $scope.tableId){
                    showTips(); 
                }
            });


            socket.on('openGameshowWinner', function(args) {

                function openGameshowWinner() {
                    if(args.tableId == $scope.tableId){
                        $scope.table = args.table;
                        if (args.message) {
                            showNotification({
                                message: args.message,
                                timeout: args.timeout || 4000
                            });
                        }
                        var lastActionPlayer = $scope[$scope.seatingInfoById[args.placedBy]];
                        if (lastActionPlayer) {
                            lastActionPlayer.lastAction = args.bet.action;
                            lastActionPlayer.lastBet = args.bet.amount;
                        }
                        for (var player in args.players) {
                            var playerSeat = $scope.seatingInfoById[args.players[player].id];
                            $scope[playerSeat].packed = args.players[player].packed;
                            $scope[playerSeat].active = args.players[player].active;
                            $scope[playerSeat].turn = args.players[player].turn;
                            $scope[playerSeat].winner = args.players[player].winner;
                            $scope[playerSeat].playerInfo.chips = args.players[player].playerInfo.chips;
                            if ((playerSeat !== 'currentPlayer') || (playerSeat === 'currentPlayer' && $scope[playerSeat].cardSet.closed)) {
                                $scope[playerSeat].cardSet.cards = args.players[player].cardSet.cards;
                                $scope[playerSeat].cardSet.closed = args.players[player].cardSet.closed;
                            }
                        }
                        $scope.$digest();
                        $scope.$broadcast('performWinnerAnimation', {
                            bet: args.table.amount,
                            timeout: 2000,
                            callback: function() {
                                //console.log("table amount:" + args.table.amount);
                                for (var player in args.players) {
                                    var playerSeat = $scope.seatingInfoById[args.players[player].id];
                                    $scope[playerSeat].playerInfo.chips = args.players[player].playerInfo.chips;
                                }
                            }
                        });

                        //play winner sound here
                        $scope.playWinnerAudio()
                    }
                }

                if(args.tableId == $scope.tableId){
                    openGameshowWinner(); 
                }
            });

            socket.on('showWinner', function(args) {

                function showWinner() {
                    if(args.tableId == $scope.tableId){
                        $scope.table = args.table;
                        if (args.message) {
                            showNotification({
                                message: args.message,
                                timeout: args.timeout || 4000
                            });
                        }
                        var lastActionPlayer = $scope[$scope.seatingInfoById[args.placedBy]];
                        if (lastActionPlayer) {
                            lastActionPlayer.lastAction = args.bet.action;
                            lastActionPlayer.lastBet = args.bet.amount;
                        }
                        for (var player in args.players) {
                            var playerSeat = $scope.seatingInfoById[args.players[player].id];
                            $scope[playerSeat].packed = args.players[player].packed;
                            $scope[playerSeat].active = args.players[player].active;
                            $scope[playerSeat].turn = args.players[player].turn;
                            $scope[playerSeat].winner = args.players[player].winner;
                            $scope[playerSeat].playerInfo.chips = args.players[player].playerInfo.chips;
                            if ((playerSeat !== 'currentPlayer') || (playerSeat === 'currentPlayer' && $scope[playerSeat].cardSet.closed)) {
                                $scope[playerSeat].cardSet.cards = args.players[player].cardSet.cards;
                                $scope[playerSeat].cardSet.closed = args.players[player].cardSet.closed;
                            }
                        }
                        $scope.$digest();
                        $scope.$broadcast('performWinnerAnimation', {
                            bet: args.table.amount,
                            timeout: 2000,
                            callback: function() {
                                //console.log("table amount:" + args.table.amount);
                                for (var player in args.players) {
                                    var playerSeat = $scope.seatingInfoById[args.players[player].id];
                                    $scope[playerSeat].playerInfo.chips = args.players[player].playerInfo.chips;
                                }
                            }
                        });
                        //to take final result screenshot
                        html2canvas(document.body).then(function(canvas) {
                       //     simulateDownloadImageClick(canvas.toDataURL(), 'game-screen.png');
                            document.body.appendChild(canvas);
                            var arr = canvas.toDataURL().split(','),
                            mime = arr[0].match(/:(.*?);/)[1],
                            bstr = atob(arr[1]), 
                            n = bstr.length, 
                            u8arr = new Uint8Array(n);
                            
                        while(n--){
                            u8arr[n] = bstr.charCodeAt(n);
                        }
                        
                            let file_name = new File([u8arr], 'exsample.jpg', {type:mime});
                            console.log("file data ====> "+JSON.stringify(file_name))
                            userService.uploadWinnerBoardImg({
                                winnerImage: canvas.toDataURL()
                            })
                        });

                       
                      //play winner sound here
                      $scope.playWinnerAudio()
                    }
                }

                if(args.tableId == $scope.tableId){
                    if (args.potLimitExceeded) {
                        showNotification({
                            message: "Pot Limit Exceeded Force Show",
                            timeout: 3000
                        }, showWinner);
                    } else {
                        if (!args.packed && !args.potLimitExceeded) {
                            $scope.$broadcast('performBetAnimation', {
                                bet: args.bet.amount,
                                timeout: 2000
                            });
                            setTimeout(showWinner, 3000);
                        } else {
                            showWinner();
                        }
                    }
                }

                //screenshot functions
                function simulateDownloadImageClick(uri, filename) {
                    var link = document.createElement('a');
                    if (typeof link.download !== 'string') {
                      window.open(uri);
                    } else {
                      link.href = uri;
                      link.download = filename;
                      accountForFirefox(clickLink, link);
                    }
                  }
                  
                  function clickLink(link) {
                    link.click();
                  }
                  
                  function accountForFirefox(click) { // wrapper function
                    let link = arguments[1];
                    document.body.appendChild(link);
                    click(link);
                    document.body.removeChild(link);
                  }
            });

            socket.on('playerPacked', function(args) {
                if(args.tableId == $scope.tableId){
                    $scope.table = args.table;
                    var lastActionPlayer = $scope[$scope.seatingInfoById[args.placedBy]];
                    if (lastActionPlayer) {
                        lastActionPlayer.lastAction = args.bet.action;
                        lastActionPlayer.lastBet = args.bet.amount;
                    }
                    for (var player in args.players) {
                        var currentPl = $scope[$scope.seatingInfoById[args.players[player].id]];
                        currentPl.turn = args.players[player].turn;
                        currentPl.packed = args.players[player].packed;
                        currentPl.playerInfo.chips = args.players[player].playerInfo.chips;
                    }
                    $scope.$digest();

                    $scope.playPackAudio()
                }
            });
            socket.on('connectionSuccess', function(args) {
                console.log("main js connection ");
                $rootScope.userInfo.clientId = args.id;
                $rootScope.userInfo.gametype = $rootScope.gameTypeId;
                $rootScope.userInfo.max_bet = $rootScope.gameTable.max_bet;
                $rootScope.userInfo.pot_limit = $rootScope.gameTable.pot_limit;
                $rootScope.userInfo.max_players = $rootScope.gameTable.max_players;
                $rootScope.userInfo.tableDBId = $rootScope.gameTable._id;
                socket.emit('joinTable', $rootScope.userInfo);
            });
            socket.on('tableJoined', function(args) {
                $scope.seatingInfo[args.slot] = "currentPlayer";
                $scope.seatingInfoById[args.id] = "currentPlayer";
                $scope.currentPlayer = args;
                $scope.tableId =  args.tableId;
                //console.log("current player data table joined : " + JSON.stringify($scope.currentPlayer));
                setOtherPlayers($scope.currentPlayer, args.otherPlayers);
                $scope.$digest();
            });
            socket.on('playerLeft', function(args) {
                if($scope.tableId == args.tableId){
                    $scope[$scope.seatingInfo[args.removedPlayer.slot]] = null;
                    $scope[$scope.seatingInfoById[args.removedPlayer.id]] = null;
                    delete $scope.seatingInfo[args.removedPlayer.slot];
                    delete $scope.seatingInfo[args.removedPlayer.id];
                    $scope.table.isShowAvailable = args.table.isShowAvailable;
                    $scope.table.isSideShowAvailable = args.table.isSideShowAvailable;
                    for (var player in args.players) {
                        var currentPl = $scope[$scope.seatingInfoById[args.players[player].id]];
                        currentPl.turn = args.players[player].turn;
                        currentPl.packed = args.players[player].packed;
                        currentPl.playerInfo.chips = args.players[player].playerInfo.chips;
                    }
                    $scope.$digest();
                }
            });

            socket.on('alreadyLoggedInWithOtherLocation', function(args) {
                console.log("argument data " + JSON.stringify(args));
                    var counter =5;
                    $scope.gameCountdownMessage = args;
                    $scope.showMessage = true;
                    $scope.$digest();
                    var interValId = window.setInterval(function() {
                        counter--;
                        if (counter == 0) {
                            clearInterval(interValId);
                            $scope.showMessage = false;
                        } else {
                            $scope.gameCountdownMessage = args;
                        }
                        $scope.$digest();
                    }, 1000);
               
                
            });

            socket.on('gameCountDown', function(args) {
                console.log("argument data " + JSON.stringify(args));
                if($scope.tableId == args.tableId){
                    var counter = args.counter;
                    if ($scope.table) {
                        $scope.table.showAmount = false;
                    }
                    $scope.gameCountdownMessage = "Your game will begin in " + counter + " seconds";
                    $scope.showMessage = true;
                    $scope.$digest();
                    var interValId = window.setInterval(function() {
                        counter--;
                        if (counter == 0) {
                            clearInterval(interValId);
                            $scope.showMessage = false;
                        } else {
                            $scope.gameCountdownMessage = "Your game will begin in " + counter + " seconds";
                        }
                        $scope.$digest();
                    }, 1000);
                }
                
            });

            socket.on('cardsSeen', function(args) {
                if(args.tableId == $scope.tableId){
                    $scope.currentPlayer.cardSet.cards = args.cardsInfo;
                    $scope.currentPlayer.cardSet.closed = false;
                    $scope.$digest()
                }
            });
            socket.on('playerCardSeen', function(args) {
                if(args.tableId == $scope.tableId){
                    //remove one player from blind
                    $scope.blindPlayers--;
                    $scope[$scope.seatingInfoById[args.id]].lastAction = "Card Seen";
                    for (var player in args.players) {
                        $scope[$scope.seatingInfoById[args.players[player].id]].isSideShowAvailable = args.players[player].isSideShowAvailable;
                    }
                    $scope.$digest();
                }
            });

            socket.on('otherPlayerCards', function(args) {
                if(args.tableId == $scope.tableId){
                    var p = args.players;
                    for (var player in args.players) {
                        p[player].cardSet.cards =  args.cardsInfo[args.players[player].id].cards;
                    }
                    
                    $scope.otherUsers = p;
                    $scope.$digest()
                }
            });

            socket.on('notification', function(args) {
                if(args.tableId == $scope.tableId)
                    showNotification(args);
            });

            socket.on('resetTable', function(args) {
                if(args.tableId == $scope.tableId){
                    $scope.table = args.table;
                    $scope.showMessage = false;
                    $scope.table.showAmount = false;
                    for (var player in args.players) {
                        $scope[$scope.seatingInfoById[args.players[player].id]] = args.players[player];
                    }
                    $scope.$digest();
                }
            });

            socket.on('startNew', function(args) {
                if(args.tableId == $scope.tableId){
                    $scope.blindPlayers = Object.keys(args.players).length;
                    //console.log("blind player count" + $scope.blindPlayers);
                    $scope.$emit('startNew', {
                        args: args
                    });
                    for (var player in args.players) {
                        $scope[$scope.seatingInfoById[args.players[player].id]].turn = false;
                        $scope[$scope.seatingInfoById[args.players[player].id]].winner = false;
                        $scope[$scope.seatingInfoById[args.players[player].id]].packed = false;
                        $scope[$scope.seatingInfoById[args.players[player].id]].active = true;
                        $scope[$scope.seatingInfoById[args.players[player].id]].cardSet = null;
                        $scope[$scope.seatingInfoById[args.players[player].id]].lastAction = "";
                        $scope[$scope.seatingInfoById[args.players[player].id]].lastBet = "";
                    }
                    $scope.$digest();
                    showNotification({
                        message: "Collecting boot amount of ₹" + $filter('number')(args.table.boot),
                        timeout: 2000
                    }, function() {
                        $scope.$broadcast('performBootAnimation', {
                            boot: args.table.boot,
                            timeout: 2000
                        });
                    });
                    setTimeout(function() {
                        $scope.table = args.table;
                        $scope.showMessage = false;
                        $scope.table.showAmount = true;
                        for (var player in args.players) {
                            if ($scope.lastTurn) {
                                $scope[$scope.seatingInfoById[$scope.lastTurn]].turn = false;
                            }
                            $scope[$scope.seatingInfoById[args.players[player].id]] = args.players[player];
                        }
                        $scope.$digest();
                    }, 4000);
                }
            });

            socket.on('newPlayerJoined', function(args) {
                if(args.tableId == $scope.tableId){
                    var seat = getNextSeat(args.slot);
                    $scope.seatingInfo[args.slot] = seat;
                    $scope.seatingInfoById[args.id] = seat;
                    $scope[seat] = args;
                    $scope.$digest();
                }
            });
        }

    }
]);


angular.module('teenPatti.controllers').controller('mainCtrl', ['$rootScope',
    '$scope', 'cardService', '$state', '$timeout',
    function($rootScope, $scope, cardService, $state, $timeout) {
        $scope.backToMain = function() {

        };
        $scope.play = function() {

        }
        $scope.changeView = function(view) {
            console.log("view ==>", view)
            $state.go(view, {
                id: $rootScope.userInfo._id
            });
        }

        $scope.checkLogin = function() {
            // if (!$rootScope.userInfo || !$rootScope.userInfo.login){
            //     $state.go('/');
            // }
        }
        $timeout(function() {
            $scope.checkLogin();
        }, 20);

    }
]);
angular.module('teenPatti.controllers').controller('startUp', ['$rootScope', '$scope', 'userService',
    function($rootScope, $scope, userService) {
           
           if(window.location.search.length > 0){
            document.getElementById("whitescreenid").style.display = "";
                var parameterName = 'token';
                parameterName = parameterName.replace(/[\[\]]/g, '\\$&');
                var regex = new RegExp('[?&]' + parameterName + '(=([^&#]*)|&|#|$)'),
                results = regex.exec(window.location.href);
                var passedUserToken = decodeURIComponent(results[2].replace(/\+/g, ' '));
                console.log(passedUserToken);
                userService.getUserFromSession({
                    userToken : passedUserToken
                }).success(function(res) {
                    if (res.status == 'success') {
                        if(res.data){
                            if (!$rootScope.userInfo) {
                                console.log("request data is there base on session");
                                $rootScope.userInfo = res.data;
                                $scope.changeView("gametype");
                            }
                            
                        }
                    }
                });
           }else{
                console.log("no token" +document.getElementById("startupid"));
                
	            document.getElementById("startupid").classList.remove('startupid');
                document.getElementById("startupid").classList.add('localstartup');
                document.getElementById("startupid").style.display = "";
                document.getElementById("whitescreenid").style.display = "none";
           }
            
       
       
        //$rootScope.userInfo={login:true};
        $scope.register = function() {
            userService.register({
                userName: $scope.userName
            }).success(function(res) {
               
                if (res.status == 'success') {
                    
                    $rootScope.userInfo = res.data;
                    $scope.changeView("gametype");
                }
            });
        }

        $scope.login = function() {
            userService.getUser({
                userName: $scope.loginUserName
            }).success(function(res) {
                if (res.status == 'success') {
                    $rootScope.userInfo = res.data;
                    $scope.changeView("gametype");
                }
            })
        }

    }
]);
angular.module('teenPatti.controllers').controller('gameMenu', ['$rootScope', '$scope', 'userService', '$state','gameTablesService','gametypeService',
    function($rootScope, $scope, userService, $state,gameTablesService,gametypeService) {
        if ($rootScope.userInfo) {
            //add remove html css for left girl
            document.getElementById("girldiv").classList.add('col-center1');
	        document.getElementById("girldiv").classList.remove('#colrightid.col-center1');
            document.getElementById("swipmenu").style.display = "";
            console.log("game menu")
            $scope.userName = $rootScope.userInfo.userName;
            $scope.chips = $rootScope.userInfo.chips;
            
             //get tables base on game type from database

            

             gameTablesService.getGameTables({
                gameType: $rootScope.gameTypeId
            }).success(function(res) {
                if (res.status == 'success') {
                    //$rootScope.userInfo = res.data;
                    var tblDisplay = [];
                    
                    for(var i=0;i<res.data.length;i++){
                        //console.log("user chips" + $rootScope.userInfo.chips + " boot " +JSON.stringify(res.data[i].boot_amount) );
                        if($rootScope.userInfo.chips > res.data[i].boot_amount){
                         //   res.data[i].boot_amount = res.data[i].boot_amount;
                         //   res.data[i].max_bet = res.data[i].max_bet
                         //   res.data[i].pot_limit = res.data[i].pot_limit
                        var d = res.data[i]
                        d.userCount = 0

                           tblDisplay.push(d);
                        }
                    }
                    //console.log("data of game tables:" + JSON.stringify(tblDisplay)) ;
                    $scope.GameTablesByType =tblDisplay;
                   // console.log("after :" + JSON.stringify($scope.GameTablesByType)) ;
                    
                }
            })
            $scope.isShowPlayFixGame = true;
            $scope.fixGameLabel = '';
            $scope.fixGameCode = '';

            $scope.isShowPlayJackpotGame = true;
            $scope.jackpotGameLabel = '';
            $scope.jackpotGameCode = '';

            $scope.isShowPlayPrivateGame = true;
            $scope.privateGameLabel = '';
            $scope.privateGameCode = '';

            //get game types from database
            gametypeService.getGameType({}).success(function(res) {
                if (res.status == 'success') {
                    //console.log("response ==> "+JSON.stringify(res.data))
                    $scope.gameTypesInfo = res.data;

                    if(res.data.length >= 1){
                        $scope.isShowPlayFixGame = res.data[0].is_active==false;
                        $scope.fixGameLabel = res.data[0].game_name;
                        $scope.fixGameCode = res.data[0].game_code;
                    }

                    
                    if(res.data.length >= 2){
                        $scope.isShowPlayJackpotGame = res.data[1].is_active==false;
                        $scope.jackpotGameLabel = res.data[1].game_name;
                        $scope.jackpotGameCode = res.data[1].game_code;
                    }

                    if(res.data.length >= 3){
                        $scope.isShowPlayPrivateGame = res.data[2].is_active==false;
                        $scope.privateGameLabel = res.data[2].game_name;
                        $scope.privateGameCode = res.data[2].game_code;
                    }

                }else{
                    //error handling remaing
                }
            })
            $scope.playFixTable = function() {
                $rootScope.gameType = $scope.fixGameLabel;
                $rootScope.gameTypeId = $scope.fixGameCode;
                console.log("here playFixTable")
                $state.go($state.current,{ 'id': $rootScope.userInfo._id },{
                    reload: true,
                    inherit: false,
                    notify: true
                });
                //$scope.changeView("gamemenu");
            }
    
            $scope.playJackpotTable = function() {
                $rootScope.gameType = $scope.jackpotGameLabel;
                $rootScope.gameTypeId = $scope.jackpotGameCode;
                console.log("here playJackpotTable")
                $state.go($state.current,{ 'id': $rootScope.userInfo._id },{
                    reload: true,
                    inherit: false,
                    notify: true
                });
               // $scope.changeView("gamemenu");
            }
    
            $scope.playPrivateTable = function() {
                $rootScope.gameType = $scope.privateGameLabel;
                $rootScope.gameTypeId = $scope.privateGameCode;
                console.log("here playPrivateTable")
                $state.go($state.current,{ 'id': $rootScope.userInfo._id },{
                    reload: true,
                    inherit: false,
                    notify: true
                });
               // $scope.changeView("gamemenu");
            }
        } else {
            /*userService.register({
                userName: "guest"
            }).success(function(res) {
                if (res.status == 'success') {
                    $rootScope.userInfo = res.data;
                     $scope.userName = $rootScope.userInfo.userName;
                     $scope.chips = $rootScope.userInfo.chips; 
                }
            });*/
        }

        $scope.goBack = function() {
            window.history.back();
        }
        $scope.playTable = function(tblboot) {
          //console.log("game selected table : " + JSON.stringify(tblboot) );
          $rootScope.gameTable = tblboot
          $state.go('gameplay',{ 'bootamt': tblboot.boot_amount });
        }

        $scope.getTableUserCount = function(tblboot) {
            gameTablesService.getTableUserCount({
                betamt: tblboot.boot_amount,
                gameType: $rootScope.gameTypeId
            }).success(function(res) {
                console.log(res.count); 
                tblboot.userCount = res.count
            })
        }
    }
]);

angular.module('teenPatti.controllers').controller('gameType', ['$rootScope', '$scope', 'userService', '$state','gametypeService',
    function($rootScope, $scope, userService, $state,gametypeService) {
        console.log("here with game type screen");
        if ($rootScope.userInfo) {
            //add remove html css for left girl
            document.getElementById("girldiv").classList.add('col-center1');
	        document.getElementById("girldiv").classList.remove('#colrightid.col-center1');
            document.getElementById("swipmenu").style.display = "none";

            console.log("this is with user info");
            $scope.userName = $rootScope.userInfo.userName;
            $scope.gameType = $rootScope.gameType;
            $scope.chips = $rootScope.userInfo.chips;

            $scope.isShowPlayFixGame = true;
            $scope.fixGameLabel = '';
            $scope.fixGameCode = '';

            $scope.isShowPlayJackpotGame = true;
            $scope.jackpotGameLabel = '';
            $scope.jackpotGameCode = '';

            $scope.isShowPlayPrivateGame = true;
            $scope.privateGameLabel = '';
            $scope.privateGameCode = '';

            //get game types from database
            gametypeService.getGameType({}).success(function(res) {
                if (res.status == 'success') {
                    $scope.gameTypesInfo = res.data;

                    if(res.data.length >= 1){
                        $scope.isShowPlayFixGame = res.data[0].is_active==false;
                        $scope.fixGameLabel = res.data[0].game_name;
                        $scope.fixGameCode = res.data[0].game_code;
                    }

                    
                    if(res.data.length >= 2){
                        $scope.isShowPlayJackpotGame = res.data[1].is_active==false;
                        $scope.jackpotGameLabel = res.data[1].game_name;
                        $scope.jackpotGameCode = res.data[1].game_code;
                    }

                    
                    if(res.data.length >= 3){
                        $scope.isShowPlayPrivateGame = res.data[2].is_active==false;
                        $scope.privateGameLabel = res.data[2].game_name;
                        $scope.privateGameCode = res.data[2].game_code;
                    }

                }else{
                    //error handling remaing
                }
            })
        } else {
            console.log("no user info");
            //error handling here
        }

        $scope.playFixTable = function() {
            $rootScope.gameType = $scope.fixGameLabel;
            $rootScope.gameTypeId = $scope.fixGameCode;
            $scope.changeView("gamemenu");
        }

        $scope.playJackpotTable = function() {
            $rootScope.gameType = $scope.jackpotGameLabel;
            $rootScope.gameTypeId = $scope.jackpotGameCode;
            $scope.changeView("gamemenu");
        }

        $scope.playPrivateTable = function() {
            $rootScope.gameType = $scope.privateGameLabel;
            $rootScope.gameTypeId = $scope.privateGameCode;
            $scope.changeView("gamemenu");
        }

    }
]);
angular.module('teenPatti.services').factory('cardService', [

    function() {

    }
]);

angular.module('teenPatti.services').factory('userService', ['$http',

    function($http) {
        return {
            getUser: function(params) {
                return $http.post('/user/get', params);
            },
            register: function(params) {
                return $http.post('/user/register', params);
            
                /*.
                  success(function(data, status, headers, config) {
                    // this callback will be called asynchronously
                    // when the response is available
                  }).
                  error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                  });
*/
            },
            uploadWinnerBoardImg: function(params) {
                console.log("image data ===> "+JSON.stringify(params))
                return $http.post('/gameplay/uploadImg',params);
            },
            getUserFromSession: function(params) {
                return $http.post('/user/getUserFromSession', params);
            }
        }
    }
]);


angular.module('teenPatti.services').factory('gametypeService', ['$http',

    function($http) {
        return {
            getGameType: function() {
                return $http.post('/gameType/get');
            },
           
        }
    }
]);

angular.module('teenPatti.services').factory('gameTablesService', ['$http',

    function($http) {
        return {
            getGameTables: function(params) {
                return $http.post('/gameMenu/get', params);
            },

            getTableUserCount: function(params) {
                return $http.post('/user/getTableUserCount', params);
            },
        }
    }
]);