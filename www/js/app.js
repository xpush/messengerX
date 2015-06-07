angular.module('messengerx', ['ionic', 'messengerx.controllers', 'messengerx.services', 'messengerx.constants', 'messengerx.directives', 'messengerx.dao', 'ionic.contrib.frostedGlass', 'ngStorage'])

.run(function($location, $ionicPlatform, $rootScope, $state, $window, $localStorage, $sessionStorage, $templateCache, APP_INFO, DB, BASE_URL, Sign, ChatLauncher, NotificationManager, DEFAULT_IMAGE ) {
  $ionicPlatform.ready(function() {
  
    // cordova 에서 back button event 를 추가한다. 2초내에 2번 back button을 누르면 종료된다.
    $ionicPlatform.registerBackButtonAction(function(e){

      if ($rootScope.backButtonPressedOnceToExit) {
        ionic.Platform.exitApp();
      } else if('/tab/friends' === $location.path() ) {
        $rootScope.backButtonPressedOnceToExit = true;
        window.plugins.toast.showShortCenter(
          "'뒤로가기'버튼을 한번 더 누르시면, \n종료됩니다.",function(a){},function(b){}
        );
        setTimeout(function(){
          $rootScope.backButtonPressedOnceToExit = false;
        },2000);
      } else if ($rootScope.$viewHistory.backView) {
        $rootScope.$viewHistory.backView.go();
      }
      e.preventDefault();
      return false;
    },101);

    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    $rootScope.cameraFlag = false;

    NotificationManager.start();
    
    // cordova 를 활용한 mobile 빌드시
    if( window.device ){
      // device의 unique한 id를 가져온다.
      $rootScope.deviceId = device.uuid;
      $rootScope.rootImgPath = "img";
      $rootScope.rootPath = "";
 
      // 카메라 사용 여부는 true, 팝업 사용 여부는 false
      $rootScope.cameraFlag = true;
      $rootScope.usePopupFlag = false;

      if( device.model.indexOf('x86') === 0 ){ // emulator or desktop pc
        console.log('emulator or desktop pc');
      }else{

        var pushNotification = window.plugins.pushNotification;

        // socket 연결이 끊겼을시, GCM 을 받기 위한 key 를 등록한다.
        if( device.platform === 'android' || device.platform === 'Android') {
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
      }

      // local 에서 활용시 image path를 세팅한다.
    } else if ( $location.absUrl().indexOf( 'file' ) > -1 ) {
      $rootScope.rootImgPath = "img";
      $rootScope.rootPath = "../www/";
      $rootScope.deviceId = 'ionic';
      $rootScope.usePopupFlag = true;
      // web에서 직접 활용시
    } else {      
      $rootScope.deviceId = 'ionic';
      $rootScope.usePopupFlag = true;
      
      // http://messenger.stalk.io/ site에서 접속시
      if( $location.absUrl().indexOf( 'stalk' ) > -1 ||$location.absUrl().indexOf( 'localhost' ) > -1 ) {        
        $rootScope.rootPath = "/";
        $rootScope.rootImgPath = "../img";
      // http://messengerx.github.io/app/www/index.html#/splash에서 접속시
      } else {      
        $rootScope.rootPath = "../www/";
        $rootScope.rootImgPath = "../www/img";        
      }

      // mobile agent 인 경우는 popup을 사용하지 않는다.
      var mobileAgents = ["android","iphone","bb","symbian","nokia", "ipad","extension"];
      var agent = window.navigator.userAgent.toLowerCase();

      for( var inx = 0, until = mobileAgents.length ; $rootScope.usePopupFlag && inx < until ; inx++ ){
        if( agent.indexOf( mobileAgents[inx] ) > -1 ){
          $rootScope.usePopupFlag = false;
        }
      }
    }

    // node webkit ==  true
    if( window.root ){
      var gui = require('nw.gui');
      var winmain = gui.Window.get();
      $rootScope.nodeWebkit = true;
      $rootScope.rootPath = "file://"+window.root+"/";

      var tray = new gui.Tray({ title: 'Tray', icon: 'icon.png' });

      // window에서 nodewebkit을 사용중인 경우, tray에 Logout과 Quit 메뉴를 등록함
      if( process.platform == 'window' || process.platform == 'win32' || process.platform == 'win64' ){
        var menu = new gui.Menu();
        menu.append(new gui.MenuItem({ label: 'Logout' }));
        menu.append(new gui.MenuItem({ label: 'Quit' }));
        tray.menu = menu;

        menu.items[0].click = function() {
          $rootScope.logout();
        };

        menu.items[1].click = function() {
          tray.remove();
          gui.App.quit();
        };

      // linux나 MAC에서 nodewebkit을 사용중인 경우, menubar에 Logout과 Quit 메뉴를 등록함 
      } else if( process.platform == 'linux' || process.platform == 'darwin' ){
        var menubar = new gui.Menu({ type: "menubar" });
        var submenu = new gui.Menu();

        var fileMenuItem = new gui.MenuItem({
          label: 'File'
        });

        var logoutMenuItem = new gui.MenuItem({
          label: 'Logout',
          click: function() {
            $rootScope.logout();
          }
        });

        var closeMenuItem = new gui.MenuItem({
          label: 'Quit',
          click: function() {
            tray.remove();
            gui.App.quit();
          }
        });

        submenu.append( logoutMenuItem );
        submenu.append( closeMenuItem );
        fileMenuItem.submenu = submenu;
        menubar.append( fileMenuItem );
        
        winmain.menu = menubar;
      }

      // Tray click 시 창을 활성화 함
      tray.click = function(){
        winmain.show();
        winmain.focus();
      }
  
      // nodewebkit을 사용 중일때는, 창 종료버튼 누를 시 화면을 최소화한다.
      winmain.on('close', function(){
        winmain.minimize();

        if( process.platform == 'window' || process.platform == 'win32' || process.platform == 'win64' ){
          winmain.setShowInTaskbar(false);
        }
      });

      // nodewebkit을 사용 중일때는, 창 종료버튼 누를 시 화면을 최소화한다.
      $rootScope.close = function(){
        winmain.minimize();
        if( process.platform == 'window' || process.platform == 'win32' || process.platform == 'win64' ){
          winmain.hide();
        }
      };

      winmain.show();
    }

    $rootScope.host = BASE_URL;
    $rootScope.app  = APP_INFO.appKey;
    $rootScope.defaultImage = DEFAULT_IMAGE;

    // webrtc support ?
    if (
      (navigator.mozGetUserMedia && window.mozRTCPeerConnection) ||
      (navigator.webkitGetUserMedia && window.webkitRTCPeerConnection)
    ){
      $rootScope.supportWebRTC = true;
    }else{
      $rootScope.supportWebRTC = false;
    }

    // Use in cordova for local Notification
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

    // Brower's notification
    $rootScope.webNoti = function( message ) {

      // Let's check if the browser supports notifications
      if (!("Notification" in window)) {
        console.log("This browser does not support desktop notification");
      }

      // Let's check if the user is okay to get some notification
      else if (Notification.permission === "granted") {
        // If it's okay let's create a notification
        var notification = new Notification( message );
      }

      // Otherwise, we need to ask the user for permission
      // Note, Chrome does not implement the permission static property
      // So we have to check for NOT 'denied' instead of 'default'
      else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {

          // Whatever the user answers, we make sure we store the information
          if(!('permission' in Notification)) {
            Notification.permission = permission;
          }

          // If the user is okay, let's create a notification
          if (permission === "granted") {
            var notification = new Notification( message );
          }
        });
      }
    };

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

    // APN 토큰 등록시
    function tokenHandler(result) {
      console.log( 'device token = ', result );
    }

    // WEB SQL DB 를 생성 또는 생성 여부를 확인한다.
    DB.init();

    // Popup 사용하지 않을때는, autoInitFlag를 true 설정하여 메세지가 들어올 경우 채널을 자동으로 생성한다.
    var autoInitFlag = false;
    if( !$rootScope.usePopupFlag ){
      autoInitFlag = true;
    }

    // xpush 를 생성한다.
    $rootScope.xpush = new XPush($rootScope.host, $rootScope.app, function (type, data){

      // LOGOUT event 를 설정한다.
      if(type === 'LOGOUT'){
        if( !$sessionStorage.reloading ){
          $rootScope.logout( function(){
            $state.go( "error" );
          });
        }
      }
    }, autoInitFlag );

    // rootScope function
    $rootScope.logout = function( callback ){
      Sign.logout(function(){
        $rootScope.xpush.logout();

        // 열려 있는 팝업이 있다면 팝업을 close 한다.
        var popups = ChatLauncher.getPopups();
        for( var key in popups ){
          popups[key].close();
        }

        // broadcast for clear event
        $rootScope.$broadcast( "$logout" );

        if ( callback && typeof callback === 'function') {
          callback();
        } else {
          $templateCache.removeAll();

          // 로그인  창으로 이동한다.
          $state.transitionTo('signin', {}, { reload: true, notify: true });
        }
      });
    };

    $rootScope.totalUnreadCount = 0;
  });

  // reloading 중에는 logout 이벤트를 발생시키지 않기 위한 설정
  $rootScope.$on("$stateChangeSuccess", function (event, toState, toParams, fromState, fromParams) {
    if( toState.name === 'splash' ){
      $sessionStorage.reloading = true;
    } else {
      $sessionStorage.reloading = false;
    }
  });

  // siginin, signup, splash, error 페이지가 아닌 경우에는 로그인 되어 있지 않은 경우 splash 화면으로 이동한다.
  $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
    var ignoreStates = ["signin","signup","splash","error"];

    if ( ignoreStates.indexOf( toState.name ) < 0 && Sign.getUser() === undefined ) {
      event.preventDefault();
      $rootScope.error = null;
      $state.go('splash');
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // UrlProvier 를 세팅한다.
  $stateProvider   
    .state('splash', {
      url: "/splash",
      templateUrl: "templates/splash.html",
      controller: 'SplashCtrl'
    })

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

    .state('error', {
      url: "/error",
      templateUrl: "templates/error.html",
      controller: 'ErrorCtrl'
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

    // Tab의 첫 화면
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

    .state('tab.messages', {
      url: '/messages',
      views: {
        'tab-messages': {
          templateUrl: 'templates/tab-messages.html',
          controller: 'MessageCtrl'
        }
      }
    })

    .state('view', {
      url: "/view",
      templateUrl: "templates/view.html",
      controller: 'ViewCtrl'
    });

  // default로 splash screen start
  $urlRouterProvider.otherwise('/splash');
});