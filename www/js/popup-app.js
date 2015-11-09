angular.module('popupchat', ['ionic', 'messengerx.controllers', 'messengerx.services', 'messengerx.constants', 'messengerx.directives', 'messengerx.dao', 'ionic.contrib.frostedGlass', 'ngStorage'])
.run(function($location, $ionicPlatform, $window, $rootScope, APP_INFO, DB, BASE_URL, DEFAULT_IMAGE, Sign ) {
  $ionicPlatform.ready(function() {

    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    $rootScope.cameraFlag = false;
    $rootScope.defaultImage = DEFAULT_IMAGE;

    // cordova 를 활용한 mobile 빌드시
    if( window.device ){
      $rootScope.deviceId = device.uuid;
      $rootScope.rootImgPath = "img";
      $rootScope.rootPath = "";

      // 카메라 사용 여부는 true, 팝업 사용 여부는 false
      $rootScope.cameraFlag = true;

      // local 에서 활용시 image path를 세팅한다.
    } else if ( $location.absUrl().indexOf( 'file' ) > -1 ) {
      $rootScope.rootImgPath = "img";
      $rootScope.rootPath = "../www/";
      $rootScope.deviceId = 'ionic';
    } else {

      // web에서 직접 활용시
      $rootScope.rootImgPath = "../img";
      $rootScope.rootPath = "/";
      $rootScope.deviceId = 'ionic';

      // http://messenger.stalk.io/ site에서 접속시
      if( $location.absUrl().indexOf( 'stalk' ) > -1 ||$location.absUrl().indexOf( 'localhost' ) > -1 ) {        
        $rootScope.rootPath = "/";
        $rootScope.rootImgPath = "../img";
      // http://messengerx.github.io/app/www/index.html#/splash에서 접속시
      } else {      
        $rootScope.rootPath = "../www/";
        $rootScope.rootImgPath = "../www/img";        
      }
    }

    // node webkit ==  true
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

    $rootScope.xpush.enableDebug();

    // rootScope function
    $rootScope.logout = function(){
      Sign.logout();
      $rootScope.xpush.logout();
    };

    $rootScope.totalUnreadCount = 0;
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // UrlProvier 를 세팅한다.
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

    // default는 chat provider
  $urlRouterProvider.otherwise('/chat');
});