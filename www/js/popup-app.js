angular.module('popupchat', ['ionic', 'starter.controllers', 'starter.services', 'starter.constants', 'starter.directives', 'starter.dao', 'ionic.contrib.frostedGlass', 'ngStorage'])
.run(function($location, $ionicPlatform, $window, $rootScope, APP_INFO, DB, BASE_URL, Sign ) {
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

      $rootScope.close = function(){
        winmain.close();
      };
    }

    var win = angular.element($window), prevEvent;

    // We'll let jQuery/jqLite handle cross-browser compatibility with window blur/focus
    // Blur events can be double-fired, so we'll filter those out with prevEvent tracking
    win.on('blur', function(event) {
      if (prevEvent !== 'blur'){
        $rootScope.$broadcast('$windowBlur', event);
      }
      prevEvent = 'blur';
    });

    win.on('focus', function(event) {
      if (prevEvent !== 'focus'){
        $rootScope.$broadcast('$windowFocus', event);
      }
      prevEvent = 'focus';
    });

    $rootScope.host = BASE_URL;
    $rootScope.app  = APP_INFO.appKey;

    // webrtc support ?
    if (
      (navigator.mozGetUserMedia && window.mozRTCPeerConnection) ||
      (navigator.webkitGetUserMedia && window.webkitRTCPeerConnection)
    ){
      $rootScope.supportWebRTC = true;
    }else{
      $rootScope.supportWebRTC = false;
    }

    $rootScope.usePopupFlag = true;

    $rootScope.xpush = new XPush($rootScope.host, $rootScope.app, function(){
    }, false );
    DB.init();

    // tootScope function
    $rootScope.logout = function(){
      Sign.logout();
      $rootScope.xpush.logout();
    };

    $rootScope.totalUnreadCount = 0;
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
    })

    .state('view', {
      url: "/view",
      templateUrl: "templates/view.html",
      controller: 'ViewCtrl'
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
