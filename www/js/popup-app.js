angular.module('popupchat', ['ionic', 'starter.controllers', 'starter.services', 'starter.constants', 'starter.directives', 'starter.dao', 'ionic.contrib.frostedGlass'])

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

    } else if ( $location.absUrl().indexOf( 'file' ) > -1 ) {
      $rootScope.rootImgPath = "img";
      $rootScope.rootPath = "../www/";
      $rootScope.deviceId = 'ionic';
    } else {
      $rootScope.rootImgPath = "../img";
      $rootScope.rootPath = "/";
      $rootScope.deviceId = 'ionic';
    }

    if( window.root ){
      var gui = require('nw.gui');

      $rootScope.nodeWebkit = true;

      var winmain = gui.Window.get();
      winmain.on('close', function(){
         winmain.close(true);
      });

      $rootScope.close = function(){
        winmain.close(true);
      };
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

    $rootScope.xpush = new XPush($rootScope.host, $rootScope.app, function(){
    }, false );
    DB.init();

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

    .state('chat', {
      url: '/chat',
      templateUrl: "templates/chat.html",
      controller: 'ChatCtrl'
    });

  $urlRouterProvider.otherwise('/chat');
});

angular.module('ionic.contrib.frostedGlass', ['ionic'])

.factory('$ionicFrostedDelegate', ['$rootScope', function($rootScope) {
  return {
    update: function() {
      $rootScope.$emit('ionicFrosted.update');
    }
  };
}]);
