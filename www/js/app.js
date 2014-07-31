angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'starter.constants', 'starter.directives', 'starter.dao', 'ionic', 'ionic.contrib.frostedGlass'])

.run(function($location, $ionicPlatform, $rootScope, DB, Sign ) {
  $ionicPlatform.ready(function() {

    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    $rootScope.cameraFlag = false;
    if( window.device ){
      $rootScope.deviceId = device.uuid;
      $rootScope.rootImgPath = "img";
      $rootScope.rootPath = "";

      $rootScope.cameraFlag = true;

      var pushNotification = window.plugins.pushNotification;

      if (device.platform == 'android' || device.platform == 'Android') {
        pushNotification.register(successHandler, errorHandler,{"senderID":"944977353393","ecb":"onNotification"});
      } else {
        pushNotification.register(tokenHandler, errorHandler,{"badge":"true","sound":"true","alert":"true","ecb":"onNotificationAPN"});
      }

      document.addEventListener("resume", onResume, false);
      document.addEventListener("pause", onPause, false);

      function onResume() {
        console.log('On Resume');
      }

      function onPause() {
        console.log('On Pause');
        $rootScope.xpush.logout();
      }

    } else if ( $location.absUrl().indexOf( 'file' ) > -1 ) {
      $rootScope.rootImgPath = "img";
      $rootScope.rootPath = "../www/";
      $rootScope.deviceId = 'ionic';
    } else {
      $rootScope.rootImgPath = "../img";
      $rootScope.rootPath = "/";
      $rootScope.deviceId = 'ionic';
    }

    $rootScope.host = "http://stalk-front-s01.cloudapp.net:8000";
    $rootScope.app  = 'messengerx';

    // webrtc support ?
    if (
      (navigator.mozGetUserMedia && window.mozRTCPeerConnection) ||
      (navigator.webkitGetUserMedia && window.webkitRTCPeerConnection)
    ){
      $rootScope.supportWebRTC = true;
    }else{
      $rootScope.supportWebRTC = false;
    }

    $rootScope.localNoti = function(param, callback){
      if( window.plugin && window.plugin.notification.local ){
        window.plugin.notification.local.add({
          id: param.id,  // A unique id of the notifiction
          //date:,    // This expects a date object
          message: param.message,  // The message that is displayed
          title: param.title,  // The title of the message
          //repeat:     String,  // Either 'secondly', 'minutely', 'hourly', 'daily', 'weekly', 'monthly' or 'yearly'
          //badge:      Number,  // Displays number badge to notification
          //sound:      String,  // A sound to be played
          //json:       String,  // Data to be passed through the notification
          autoCancel: true // Setting this flag and the notification is automatically canceled when the user clicks it
          //ongoing:    Boolean, // Prevent clearing of notification (Android only)
        });
      }
    }
    // Android
    onNotification = function(e) {
      switch( e.event ){
        case 'registered':
          if ( e.regid.length > 0 ){
            console.log("regID = " + e.regid);
            $rootScope.notiId = e.regid;
            //$rootScope.deviceId =
          }
          break;

        case 'message':
          if (e.foreground){
            window.plugin.notification.local.add({
              id: e.payload.TS,  // A unique id of the notifiction
              message: e.payload.MG,  // The message that is displayed
              title: e.payload.UO.NM,  // The title of the message
              autoCancel: true // Setting this flag and the notification is automatically canceled when the user clicks it
            });
          }else{   // otherwise we were launched because the user touched a notification in the notification tray.
            if (e.coldstart){
              //$("#app-status-ul").append('<li>--COLDSTART NOTIFICATION--' + '</li>');
            }else{
              //$("#app-status-ul").append('<li>--BACKGROUND NOTIFICATION--' + '</li>');
            }
          }
          break;

        case 'error':
          //$("#app-status-ul").append('<li>ERROR -> MSG:' + e.msg + '</li>');
          break;

        default:
          //$("#app-status-ul").append('<li>EVENT -> Unknown, an event was received and we do not know what it is</li>');
          break;
      }
    }

    // result contains any message sent from the plugin call
    function successHandler(result) {
      console.log( 'result = '+result );
    }

    // result contains any error description text returned from the plugin call
    function errorHandler(error) {
      console.log( 'error = '+result );
    }

    function tokenHandler(result) {
      console.log( 'device token = '+result );
    }

    DB.init();

    $rootScope.xpush = new XPush($rootScope.host, $rootScope.app, function (type, data){

      if(type == 'LOGOUT'){
        window.location = $rootScope.rootPath + 'err.html?LOGOUT';
      }

    });

    // tootScope function
    $rootScope.logout = function(){

      Sign.logout();
      $rootScope.xpush.logout();
    };

    $rootScope.totalUnreadCount = 0;
    $rootScope.firstFlag = true;
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    .state('signin', {
      url: "/sign-in",
      templateUrl: "templates/sign-in.html",
      controller: 'SignInCtrl'
    })

    .state('signup', {
      url: "/sign-up",
      templateUrl: "templates/sign-up.html",
      controller: 'SignUpCtrl'
    })

    .state('chat', {
      url: '/chat',
      templateUrl: "templates/chat.html",
      controller: 'ChatCtrl'
    })

    // setup an abstract state for the tabs directive
    .state('tab', {
      url: "/tab",
      abstract: true,
      templateUrl: "templates/tabs.html"
    })

    // Each tab has its own nav history stack:
    .state('tab.channel', {
      url: '/channel',
      views: {
        'tab-channel': {
          templateUrl: 'templates/tab-channel.html',
          controller: 'ChannelCtrl'
        }
      }
    })

    .state('tab.friends', {
      url: '/friends',
      views: {
        'tab-friends': {
          templateUrl: 'templates/tab-friends.html',
          controller: 'FriendsCtrl'
        }
      }
    })

    .state('tab.account', {
      url: '/account',
      views: {
        'tab-account': {
          templateUrl: 'templates/tab-account.html',
          controller: 'AccountCtrl'
        }
      }
    })

    .state('tab.emoticon', {
      url: '/emoticon',
      views: {
        'tab-emoticon': {
          templateUrl: 'templates/tab-emoticon.html',
          controller: 'EmoticonCtrl'
        }
      }
    })

  $urlRouterProvider.otherwise('/sign-in');
});
