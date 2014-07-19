// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'starter.constants', 'starter.directives', 'ionic', 'ionic.contrib.frostedGlass'])

.run(function($ionicPlatform, $rootScope, DB, Sign ) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    console.log( "==========device==========" );
    if( window.device ){
      $rootScope.deviceId = device.uuid;

      var pushNotification = window.plugins.pushNotification;

      if (device.platform == 'android' || device.platform == 'Android') {
          pushNotification.register(successHandler, errorHandler,{"senderID":"944977353393","ecb":"onNotification"});
      } else {
          pushNotification.register(tokenHandler, errorHandler,{"badge":"true","sound":"true","alert":"true","ecb":"onNotificationAPN"});
      }
    } else {
      $rootScope.deviceId = 'ionic';
    }

    $rootScope.localNoti = function(param, callback){
      if( window.plugin.notification.local ){
        console.log( '========= local noti =========');
        window.plugin.notification.local.add({
            id: param.id,  // A unique id of the notifiction
            //date:,    // This expects a date object
            message: param.message,  // The message that is displayed
            title: param.title  // The title of the message
            //repeat:     String,  // Either 'secondly', 'minutely', 'hourly', 'daily', 'weekly', 'monthly' or 'yearly'
            //badge:      Number,  // Displays number badge to notification
            //sound:      String,  // A sound to be played
            //json:       String,  // Data to be passed through the notification
            //autoCancel: true // Setting this flag and the notification is automatically canceled when the user clicks it
            //ongoing:    Boolean, // Prevent clearing of notification (Android only)
        });
      }
    }

    // Android
    onNotification = function(e) {
      //$("#app-status-ul").append('<li>EVENT -> RECEIVED:' + e.event + '</li>');

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
            //$("#app-status-ul").append('<li>--INLINE NOTIFICATION--' + '</li>');
          }else{   // otherwise we were launched because the user touched a notification in the notification tray.
            if (e.coldstart){
              //$("#app-status-ul").append('<li>--COLDSTART NOTIFICATION--' + '</li>');
            }else{
              //$("#app-status-ul").append('<li>--BACKGROUND NOTIFICATION--' + '</li>');
            }
          }

          console.log( e.payload.message );
          console.log( e.payload.msgcnt );
          //$("#app-status-ul").append('<li>MESSAGE -> MSG: ' + e.payload.message + '</li>');
          //$("#app-status-ul").append('<li>MESSAGE -> MSGCNT: ' + e.payload.msgcnt + '</li>');
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

    var HOST = "http://stalk-front-s01.cloudapp.net:8000";
    var APPID = 'messengerx';

    $rootScope.xpush = new XPush(HOST, APPID);

    // tootScope function
    $rootScope.logout = function(){
      $rootScope.totalUnreadCount = 0;
      Sign.logout();

      $rootScope.firstFlag = true;
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
    .state('tab.dash', {
      url: '/dash',
      views: {
        'tab-dash': {
          templateUrl: 'templates/tab-dash.html',
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

  // if none of the above states are matched, use this as the fallback
  //$urlRouterProvider.otherwise('/tab/dash');
  $urlRouterProvider.otherwise('/sign-in');
});