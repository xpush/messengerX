angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'starter.constants', 'starter.directives', 'starter.dao', 'ionic', 'ionic.contrib.frostedGlass'])

.run(function($location, $ionicPlatform, $rootScope, DB, Sign, NAVI, $state ) {
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
      $rootScope.usePopupFlag = false;

      if( device.model.indexOf('x86') === 0){ // emulator or desktop pc
        console.log('emulator or desktop pc');
      }else{
        var pushNotification = window.plugins.pushNotification;

        if (device.platform == 'android' || device.platform == 'Android') {
          pushNotification.register(successHandler, errorHandler,{"senderID":"944977353393","ecb":"onNotification"});
        } else {
          pushNotification.register(tokenHandler, errorHandler,{"badge":"true","sound":"true","alert":"true","ecb":"onNotificationAPN"});
        }
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
      $rootScope.usePopupFlag = true;
    } else {
      $rootScope.rootImgPath = "../img";
      $rootScope.rootPath = "/";
      $rootScope.deviceId = 'ionic';
      $rootScope.usePopupFlag = true;
    }

    // node wekit ==  true
    if( window.root ){
      var gui = require('nw.gui');
      $rootScope.nodeWebkit = true;
      $rootScope.rootPath = "file://"+window.root+"/";

      var tray = new gui.Tray({ title: 'Tray', icon: 'icon.png' });
      var menu = new gui.Menu();
      menu.append(new gui.MenuItem({ label: 'close' }));

      menu.items[0].click = function() { 
        console.log('clicked');
        tray.remove();
        gui.App.quit();
      };

      tray.menu = menu;

      tray.click = function(){
        winmain.show();
      }

      var winmain = gui.Window.get();
      winmain.on('close', function(){
         winmain.minimize();
         winmain.setShowInTaskbar(false);
      });

      $rootScope.close = function(){
        winmain.minimize();
        winmain.hide();
      };

      winmain.show();  
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
    // For android notification
    onNotification = function(e) {
      switch( e.event ){
        case 'registered':
          if ( e.regid.length > 0 ){
            console.log("regID = " + e.regid);
            $rootScope.notiId = e.regid;
          }
          break;

        case 'message':
          if (e.foreground){
            window.plugin.notification.local.add({
              id: e.payload.TS,  // A unique id of the notifiction
              message: encodeURIComponent( e.payload.MG ),  // The message that is displayed
              title: encodeURIComponent( e.payload.UO.NM ),  // The title of the message
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
      console.log( 'result = ', result );
    }

    // result contains any error description text returned from the plugin call
    function errorHandler(result) {
      console.log( 'error = ', result );
    }

    function tokenHandler(result) {
      console.log( 'device token = ', result );
    }

    DB.init();

    $rootScope.xpush = new XPush($rootScope.host, $rootScope.app, function (type, data){

      if(type == 'LOGOUT'){
        $rootScope.logout(true);
        window.location = $rootScope.rootPath + 'err.html?LOGOUT';        
      }
    }, false );

    // tootScope function
    $rootScope.logout = function( skipLoginPageFlag ){
      Sign.logout();
      $rootScope.xpush.logout();

      var popups = NAVI.getPopups();
      for( var key in popups ){
        popups[key].close();
      }

      if( !skipLoginPageFlag ){
        $state.transitionTo('signin', {}, { reload: true, notify: true });
      }
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

angular.module('ionic.contrib.frostedGlass', ['ionic'])

.factory('$ionicFrostedDelegate', ['$rootScope', function($rootScope) {
  return {
    update: function() {
      $rootScope.$emit('ionicFrosted.update');
    }
  }
}])
.factory('NAVI', function($rootScope, $state, Cache, Sign){
  var popupCount = 0;
  var popups = {};

  return {
    getPopups : function(){
      return popups;
    },
    gotoChat : function( scope, popupKey, stateParams ){

      if( $rootScope.usePopupFlag ){
        if( popups[popupKey] != undefined ){
          console.log( popups[popupKey].window );
          popups[popupKey].window.focus();
        } else {

          var wkpopup;
          var popup;

          var left = screen.width - 520 + ( popupCount * 25 );
          var top = 0 + ( popupCount * 25 ) ;
          popupCount++;

          if( $rootScope.nodeWebkit ){
            var gui = require('nw.gui');
            wkpopup = gui.Window.open( $rootScope.rootPath + 'popup-chat.html', {
              "frame" : false,
              "toolbar" : false,
              width: 400,
              height: 600,
              x:left,
              y:top,
              title:'Chat'
            });
          } else {        
            popup = window.open( $rootScope.rootPath + 'popup-chat.html', popupKey, 'screenX='+ left + ',screenY=' + top +',width=400,height=600');
          }

          var interval = 1000;

          setTimeout( function(){
            if( $rootScope.nodeWebkit ){              
              popups[popupKey] = wkpopup;
              popup = wkpopup.window;

              wkpopup.on('close', function() {
                
                // Hide the window to give user the feeling of closing immediately
                this.hide();
                popupCount--;
                // If the new window is still open then close it.
                if (wkpopup != null){
                  wkpopup.close(true);
                  delete popups[popupKey];
                }

                // After closing the new window, close the main window.
                this.close(true);
              });
            } else {
              popups[popupKey] = popup;
              popup.onbeforeunload = function(){
                popupCount--;
                delete popups[popupKey];
              };
            }

            var popObj = popup.document.getElementById( "popupchat" );
            var newWindowRootScope = popup.angular.element( popObj ).scope();

            var args = {};
            args.loginUser = Sign.getUser();
            args.stateParams = stateParams;
            args.cache = Cache.all();
            args.sessionConnection = $rootScope.xpush._sessionConnection;

            newWindowRootScope.$broadcast("INTER_WINDOW_DATA_TRANSFER", args );
          }, interval);
        }
      } else {
        $rootScope.$stateParams = stateParams;
        $state.go( 'chat' );
      }
    }
  };
});