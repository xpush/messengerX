angular.module('starter.controllers', [])

.controller('ChannelCtrl', function($scope, $rootScope, $rootElement, $window, $state, $stateParams, ChannelDao, Friends, Cache, Sign ) {
  $rootScope.currentChannel = '';
  var loginUserId = Sign.getUser().userId;

  ChannelDao.getAllCount().then( function ( result ){
    $rootScope.totalUnreadCount = result.total_count;
  });

  $scope.channelArray = [];

  ChannelDao.list( $scope ).then(function(channels) {
    $scope.channelArray = [];
    $scope.channelArray = channels;
  });

  $scope.goChat = function( channelId ) {
    ChannelDao.get( channelId ).then(function(data) {
      $stateParams.channelId = channelId;
      $stateParams.channelUsers = data.channel_users;
      $stateParams.channelName = data.channel_name;
      $rootScope.$stateParams = $stateParams;
      $state.go( 'chat' );

      /**
      $window.$scope = $scope;
      $rootScope.currentChannel = channelId;

      // center the popup window
      var left = screen.width/2 - 200
          , top = screen.height/2 - 250
          , popup = $window.open('popup-chat.html', '', "top=" + top + ",left=" + left + ",width=400,height=500")
          , interval = 1000;

      setTimeout( function(){
        var popObj = popup.document.getElementById( "popupchat" );
        var newWindowRootScope = popup.angular.element( popObj ).scope();

        var args = {};
        args.loginUser = Sign.getUser();
        args.stateParams = $stateParams;
        args.cache = Cache.all();
        args.xpush = $rootScope.xpush;

        newWindowRootScope.$broadcast("INTER_WINDOW_DATA_TRANSFER", args );
      }, interval);
      */
    });
  }
})
.controller('FriendsCtrl', function($scope, $ionicLoading, $rootScope, $state, $stateParams, $ionicPopup, $ionicModal, $ionicScrollDelegate, Friends, UTIL, Manager) {
  $rootScope.currentChannel = '';
  $scope.listFriend = function(){
    Friends.list(function(friends){
      if( friends != undefined ){
        $scope.friends = [];
        $scope.friends = friends;
        $scope.friendCount = $scope.friends.length;
      }
    });
  };

  $scope.syncFriends = function(){
    Friends.refresh(function(result){
      $rootScope.syncFlag = false;
      $scope.listFriend();
    });
  };

  $scope.friends = [];
  $scope.friendCount = 0;
  $scope.searchKey = "";

  // Init Socket
  if( $rootScope.syncFlag ) {
    $scope.syncFriends();
  } else if( $rootScope.firstFlag ){
    $scope.listFriend();
    Manager.init();
  } else {
    $scope.listFriend();
  }

  /**
   * @ngdoc function
   * @name postFriends
   * @module starter.controllers
   * @kind function
   *
   * @description Apply friends display.
   * @param {array} filtered friends by searchKey;
   */
  $scope.postFriends = function(friends){
    if( friends != undefined ){
      $scope.friends = [];
      $scope.friends = friends;
      $scope.friendCount = friends.length;
    }
  };

  /**
   * @ngdoc function
   * @name resetFriends
   * @module starter.controllers
   * @kind function
   *
   * @description Reset friends list
   */
  $scope.resetFriends = function(){
    Friends.list(function(friends){
      if( friends != undefined ){
        $scope.friends = [];
        $scope.friends = friends;
        $scope.friendCount = friends.length;
      }
    });
  };

  /**
   * @ngdoc function
   * @name gotoAccount
   * @module starter.controllers
   * @kind function
   *
   * @description Navigate to Account Menu.
   */
  $scope.gotoAccount = function(){
    $state.go( 'tab.account' );
  };

  /**
   * @ngdoc function
   * @name gotoChat
   * @module starter.controllers
   * @kind function
   *
   * @description Navigate to Chat screen.
   * @param {string} filtered friends by searchKey;
   */
  $scope.gotoChat = function( friendIds ) {
    $stateParams.friendIds = friendIds;
    $rootScope.$stateParams = $stateParams;
    $state.go( 'chat' );
  };

  $scope.showPopup = function() {
    $scope.modal.datas = [];
    $scope.modal.selection = [];
    $scope.modal.num = 1;
    $scope.modal.changed = false;
    $scope.modal.visible = true;
    $scope.modal.show();
  };

  $ionicModal.fromTemplateUrl('templates/modal-users.html', {
    scope: $scope,
    animation: 'slide-in-up',
    focusFirstInput: true
  }).then(function(modal) {
    $scope.modal = modal;
    $scope.modal.changed = false;
    $scope.modal.visible = false;
  });

  $scope.$on('modal.hidden', function() {
    $scope.modal.visible = false;

    if($scope.modal.changed){
      $scope.syncFriends();
      $scope.modal.changed = false;
    }
  });

  $scope.$on('modal.shown', function() {
    $ionicScrollDelegate.$getByHandle('modalContent').scrollTop(true);
  });
})

.controller('UsersModalCtrl', function($scope, Users, Friends) {

  $scope.toggleSelection = function( friendId ){
    var inx = $scope.modal.selection.indexOf( friendId );
    if( inx > -1 ){
      $scope.modal.selection.splice(inx, 1);
    } else {
      $scope.modal.selection.push( friendId );
    }
  };

  $scope.addFriends = function() {
    var res = $scope.modal.selection;

    if(res.length > 0){
      var addUsers = [];
      for( var key in res ){
        if( addUsers.indexOf( res[key] ) < 0 ){
          addUsers.push( res[key] );
        }
      }

      Friends.add( addUsers, function( data ){
        $scope.modal.changed = true;
        $scope.modal.hide();
      });
    }
  };

  $scope.retrieveUsers = function() {

    console.log('$scope.modal.visible : ',$scope.modal.visible, $scope.modal.num);
    if($scope.modal.visible){

      Users.search([], [], $scope.modal.num, function(users){

        if( users != undefined ){
          if($scope.modal.num > 1) {
            $scope.modal.datas = $scope.modal.datas.concat(users);
          }else{
            $scope.modal.datas = [];
            $scope.modal.datas = users;
            $scope.$apply();
          }

          $scope.modal.num = $scope.modal.num + 1;
        }

        $scope.$broadcast('scroll.infiniteScrollComplete');

        if( !users || users.length < 50) {
          $scope.modal.visible = false;
        }
      });
    }
  };
})

.controller('FriendsModalCtrl', function($scope, $rootScope, $state, Users, Friends, Chat, UTIL, ChannelDao, Sign) {
  var loginUser = Sign.getUser();

  $scope.toggleSelection = function( friendId ){
    var inx = $scope.modal.selection.indexOf( friendId );
    if( inx > -1 ){
      $scope.modal.selection.splice(inx, 1);
    } else {
      $scope.modal.selection.push( friendId );
    }
  };

  $scope.inviteFriends = function() {
    var res = $scope.modal.selection;
    var channelUsers = $scope.modal.channelUsers;
    var channelId = $scope.modal.channelId;
    var channelName = $scope.modal.channelName;

    if(res.length > 0){

      var joinUsers = [];

      //TO-DO : Only ID
      for( var key in res ){
        joinUsers.push( res[key] );

        if( channelUsers.indexOf( res[key] ) < 0 ){
          channelUsers.push( res[key] );
        }
      }

      $scope.modal.channelUsers = channelUsers;

      // channel with 2 people
      if( channelId.indexOf( "$" ) > -1 ){
        // Init Controller ToCreate New Channel
        $rootScope.$stateParams.friendIds = channelUsers.join( "$" );

        var current = $state.current;
        $state.transitionTo('chat', {}, { reload: true, inherit: true, notify: true });
      } else {
        channelName = channelName + ","+UTIL.getNames( joinUsers );
        $scope.modal.channelName = channelName;

        var joinObject = { 'U' : joinUsers, 'DT' : { 'NM' : channelName,'US' : channelUsers, 'F' : loginUser.userName, 'UC': channelUsers.length } };
        Chat.join( channelId, joinObject, function(data){
          if( data.status == 'ok' ){
            var iMsg = UTIL.getInviteMessage( joinUsers );

            Chat.send( iMsg, 'J' );
            ChannelDao.updateUsers( { 'channel': channelId, 'name' : channelName, 'users': channelUsers } );
          }
        });
      }

      $scope.modal.changed = true;
      $scope.modal.hide();
    }
  };

  $scope.retrieveFriends = function() {

    console.log('$scope.modal.visible : ',$scope.modal.visible, $scope.modal.num);
    if($scope.modal.visible){

      Friends.list(function(friends){

        if( friends != undefined ){
          $scope.modal.datas =  [];
          $scope.modal.datas = friends;
        }

        $scope.$broadcast('scroll.infiniteScrollComplete');

        if( !friends || friends.length < 1) {
          $scope.modal.visible = false;
        }
      });
    }
  };

  $scope.postFriends = function(friends){
    if( friends != undefined ){
      $scope.modal.datas = [];
      $scope.modal.datas = friends;
    }
  };

  $scope.resetFriends = function(){
    Friends.list(function(friends){
      if( friends != undefined ){
        $scope.modal.datas = [];
        $scope.modal.datas= friends;
      }
    });
  };
})

.controller('AccountCtrl', function($scope, $rootScope, Sign) {
  $rootScope.currentChannel = '';
  $scope.loginUser = Sign.getUser();

  $scope.newImage = '';

  $scope.changeImage = function(newImage){
    if( newImage != '' ){
      $scope.loginUser.image = newImage;
    }

    var params = { 'A' : 'messengerx', 'U' : $scope.loginUser.userId, 'PW' : $scope.loginUser.password, 'D' : $rootScope.deviceId, 'N' : $rootScope.notiId,
               DT : { 'NM' : $scope.loginUser.userName, 'I': $scope.loginUser.image, 'MG' : $scope.loginUser.message } };

    Sign.update( params, function(data){
      if( data.status == 'ok' ){
        Sign.setUser( $scope.loginUser );
      }
    });
  };

  $scope.syncFriends = function(){
    Friends.refresh( function(result){
      console.log( result );
    });
  }
})
.controller('EmoticonCtrl', function($scope, $rootScope, Sign, ChannelDao, Chat, Emoticons) {
  $rootScope.currentChannel = '';
  var loginUser = Sign.getUser();

  $scope.emoticon = {};
  Emoticons.list( { group : 'custom' }, function(emoticons){
    if( emoticons.length > 0 ){
      $scope.emoticon = emoticons[0];
    }
  });

  $scope.openFileDialog = function() {
    ionic.trigger('click', { target: document.getElementById('file') });
  };

  var createObject = {};
  var channelUsers = [loginUser.userId];
  createObject.U = channelUsers;
  createObject.DT = { 'US' : channelUsers, 'UC': channelUsers.length };

  var channelId = ChannelDao.generateId(createObject);
  createObject.C = channelId;

  $rootScope.xpush.createChannel(channelUsers, channelId, createObject.DT, function(data){

    var param = {};
    param.app = loginUser.app;
    param.channel = channelId;
    param.userId = loginUser.userId;
    param.deviceId = loginUser.deviceId;

    // Channel Init
    Chat.init( param, loginUser, '', $scope, function( messages ){
    });
  });

  var inputObj = document.getElementById('file');
  angular.element( inputObj ).on('change',function(event) {

    $rootScope.xpush.uploadStream( channelId, {
      file: inputObj
    }, function(data, idx){
      inputObj.value = "";
      console.log("progress  ["+idx+"]: "+data);
    }, function(data,idx){
      var name = data.result.name;

      inputObj.value = "";
      console.log("completed ["+idx+"]: "+JSON.stringify(data));

      var imageUrl = $rootScope.xpush.getFileUrl(channelId, name );

      var param = {group:'custom', tag :'', image : imageUrl};
      Emoticons.add( param, $scope.emoticon );
    });
  });
})
.controller('SignInCtrl', function($scope, $rootScope, $state, $location, $stateParams, $ionicPopup, Friends, Sign, Cache) {

  $scope.signIn = function(user) {
		var params = { 'A' : 'messengerx', 'U' : user.userId, 'PW' : user.password, 'D' : $rootScope.deviceId, 'N' : $rootScope.notiId };
    $rootScope.xpush.login( user.userId, user.password, $rootScope.deviceId, 'ADD_DEVICE', function(err, result){

      if(err){
        var alertMessage = {title: 'Login Failed'};
        if(err == 'ERR-NOTEXIST'){
          alertMessage.subTitle = 'User is not existed. Please try again.';
        }else if(err == 'ERR-PASSWORD'){
          alertMessage.subTitle ='Password is wrong. Please try again.'; // Forgot your password?
        }else {
          alertMessage.subTitle = 'Invalid log in or server error. Please try again.';
        }

        $ionicPopup.alert(alertMessage)/*.then(function(res) {
        })*/;

      }else{
        var loginUser = {};
        loginUser.app = params.A;
        loginUser.userId = user.userId;
        loginUser.password = params.PW;
        loginUser.deviceId = $rootScope.deviceId;

        loginUser.image = result.user.DT.I;
        loginUser.userName = result.user.DT.NM;
        loginUser.message = result.user.DT.MG;

        $rootScope.loginUser = loginUser;
        Sign.setUser( loginUser );

        Cache.add(user.userId, {'NM':loginUser.userName, 'I':loginUser.image});

        Friends.getRefreshHistory(function(history){
          if( history != undefined && ( history.time - Date.now() ) < 3600 ){
            $rootScope.syncFlag = false;
          } else {
            $rootScope.syncFlag = true;
          }

          $state.go('tab.friends');
        });
      }
    });
  };
})
.controller('SignUpCtrl', function($scope, $rootScope, $state, $stateParams, $http, Sign) {
  $scope.signUp = function(user) {
    var params = { 'A' : 'messengerx', 'U' : user.userId, 'PW' : user.password, 'D' : $rootScope.deviceId, 'N' : $rootScope.notiId,
     'DT' : {'NM' : user.userName, 'I':'img/default_image.jpg', 'MG':'' } };
    Sign.register( params, function(data){
      $state.go('signin');
    });
  };
})
.controller('ChatCtrl', function($state, $scope, $rootScope, $ionicFrostedDelegate, Manager, $ionicScrollDelegate,  $ionicModal, $window, Friends, Sign, Chat, Cache, ChannelDao, UTIL, Emoticons) {

  var loginUser = Sign.getUser();

  var channelId;
  var channelName;
  var channelUsers = [];

  $rootScope.$on("INTER_WINDOW_DATA_TRANSFER", function (data, args) {

    $rootScope.xpush = args.xpush;

    Sign.setUser( args.loginUser );
    Cache.set( args.cache );

    loginUser = Sign.getUser();
    channelId = args.stateParams.channelId;

    $rootScope.xpush.isExistUnread = false;
    init( args.stateParams );
    Manager.init();
  });

  $rootScope.currentScope = $scope;

  initChat = function( inviteMsg ){

    var param = {};
    param.app = loginUser.app;
    param.channel = channelId;
    param.userId = loginUser.userId;
    param.deviceId = loginUser.deviceId;

    console.log( channelId );

    // Channel Init
    Chat.init( param, loginUser, inviteMsg, $scope, function( messages ){
      if( messages != undefined ){
        $scope.messages = $scope.messages.concat(messages);
        setTimeout( function(){
          $ionicFrostedDelegate.update();
          $ionicScrollDelegate.scrollBottom(true);
        }, 300 );
      }
    });
  };

  $scope.messages = [];

  var stateParams = $rootScope.$stateParams;
  var rootImgPath = $rootScope.rootImgPath;

  init = function( stateParams ){
    if( stateParams.channelId != undefined ) {
      channelId = stateParams.channelId;

      channelUsers = stateParams.channelUsers.split(",");
      channelUsers.sort();
      channelName = stateParams.channelName;

      initChat( '' );
    } else {
      var friendIds = stateParams.friendIds.split("$");

      channelUsers = channelUsers.concat( friendIds );

      if( channelUsers.indexOf( loginUser.userId ) < 0 ){
        channelUsers.push( loginUser.userId );
      }

      channelName = UTIL.getNames( channelUsers );

      var createObject = {};
      createObject.U = channelUsers;
      createObject.NM = channelName;
      createObject.DT = { 'NM' : channelName, 'US' : channelUsers, 'F' : loginUser.userName, 'UC': channelUsers.length };

      channelId = ChannelDao.generateId(createObject);
      createObject.C = channelId;

      $rootScope.xpush.createChannel(channelUsers, channelId, createObject.DT, function(data){
        createObject.unreadCount = 0;
        ChannelDao.insert( createObject );

        var inviteMsg = "";
        if( channelUsers.length > 2 ){
          inviteMsg = UTIL.getInviteMessage( channelUsers );
        }

        initChat( inviteMsg );
      });
    };

    $rootScope.$stateParams = {};
    $scope.channelName = channelName;
    $scope.channelId = channelId;
    $scope.channelUsers = channelUsers;

    Emoticons.list( {}, function(emoticons){
      $scope.emoticons.push( { group : 's2', tag : 'ion-happy', 'CN' : 'tab-item tab-item-active', items : {
          "01" : [rootImgPath+'/emo/s2/anger.PNG', rootImgPath+'/emo/s2/burn.PNG', rootImgPath+'/emo/s2/cool.PNG', rootImgPath+'/emo/s2/love.PNG'],
          "02" : [rootImgPath+'/emo/s2/shout.PNG', rootImgPath+'/emo/s2/smile.PNG']}}
      );
      $scope.emoticons = $scope.emoticons.concat( emoticons );
      //$scope.emoticons['b2'] = [rootImgPath+'/emo/b2/anger.png', rootImgPath+'/emo/b2/cry.png',  rootImgPath+'/emo/b2/haha.png', rootImgPath+'/emo/b2/money.png'];
    });
  };

  if( stateParams != undefined ){
    channelId = stateParams.channelId;
    init( stateParams );
  }

  $scope.add = function( nextMessage ) {
    $scope.messages.push(angular.extend({}, nextMessage));

    $scope.$apply();

    // Update the scroll area and tell the frosted glass to redraw itself
    if( nextMessage.from != 'RI' && nextMessage.from != 'SI' ){
      $ionicFrostedDelegate.update();
      $ionicScrollDelegate.scrollBottom(true);
    }
  };

  $scope.send = function() {
    if( $scope.inputMessage != '' ){
      var msg = $scope.inputMessage;
      $scope.inputMessage = '';
      Chat.send( msg );
    }
  };

  $scope.selection = [];

  $scope.toggleSelection = function( friendId ){
    var inx = $scope.selection.indexOf( friendId );
    if( inx > -1 ){
      $scope.selection.splice(inx, 1);
    } else {
      $scope.selection.push( friendId );
    }
  };

  $scope.showPopup = function() {
    $scope.modal.datas = [];
    $scope.modal.selection = [];
    $scope.modal.num = 1;
    $scope.modal.changed = false;
    $scope.modal.visible = true;
    $scope.modal.show();
    $scope.modal.channelUsers = $scope.channelUsers;
    $scope.modal.channelName = $scope.channelName;
    $scope.modal.channelId = $scope.channelId;
  };

  $ionicModal.fromTemplateUrl('templates/modal-friends.html', function(modal) {
    $scope.modal = modal;
    $scope.modal.changed = false;
    $scope.modal.visible = false;
  }, {
    animation: 'slide-in-up',
    focusFirstInput: true
  });
  $scope.$on('modal.hidden', function() {
    $scope.modal.visible = false;

    if($scope.modal.changed){
      $scope.modal.changed = false;
      $scope.channelName = $scope.modal.channelName;
      $scope.channelUsers = $scope.modal.channelUsers;
    }
  });
  $scope.$on('modal.shown', function() {
    // do nothing...
  });

  $scope.$on('$destroy', function() {
     window.onbeforeunload = undefined;
  });

  $scope.$on('$locationChangeStart', function(event, next, current) {
    if( current.indexOf('/chat') > -1 ){
      if(!confirm("Are you sure you want to leave this page?")) {
        event.preventDefault();
      } else {
        $rootScope.currentChannel = '';
      }
    }
  });

  $scope.openWebRTC = function( key ){
    $scope.toggleExt( "false" );

    var newFlag = false;
    if( key === undefined ){
      newFlag = true;
    }

    var chKey = newFlag ? UTIL.getUniqueKey() : key;

    var params = {
      S: $rootScope.host,
      A: $rootScope.app,
      C: chKey,
      U: {
        U: loginUser.userId,
        A: loginUser.deviceId
      }
    };

    var url = $rootScope.rootPath+'videoChat.html?'+encodeURIComponent(JSON.stringify(params));

    var popup = $window.open(url, chKey, "width=800,height=600");
    popup.onbeforeunload = function(){
      Chat.send( chKey, 'VO' );
    };

    if( newFlag ){
      Chat.send( chKey, 'VI' );
    }
  };

  $scope.emoticons = [];

    //, '05' : rootImgPath+'/emo/b2/shocked.png', '06' : rootImgPath+'/emo/b2/victory.png' } );

  $scope.curEmoTabId = "0";
  $scope.showEmo = "false";
  $scope.showExt = "false";

  $scope.toggleEmoticons = function( flag ){
    $scope.showEmo = flag;
    if( $scope.showEmo == "true" ){
      document.getElementById( 'tabbody'+$scope.curEmoTabId ).style.display = "block";
      document.getElementById( 'chat-emoticons' ).style.display = "block";
      document.getElementById( "chat-extends" ).className = "chat-extends row hide";
      $scope.showExt = "false";
    } else {
      document.getElementById( 'chat-emoticons' ).style.display = "none";
    }
  };

  $scope.toggleExt = function( flag ) {
    $scope.showExt = flag;
    if( $scope.showExt == "true" ){
      document.getElementById( "chat-extends" ).className= "chat-extends row flex";
      document.getElementById( 'chat-emoticons' ).style.display = "none";
      $scope.showEmo = "false";
    } else {
      document.getElementById( "chat-extends" ).className = "chat-extends row hide";
    }
  };

  $scope.sendEmoticon = function(url){
    $scope.toggleEmoticons( "false" );
    document.getElementById( 'chat-emoticons' ).style.display = "none";
    Chat.send( url, 'E' );
  };

  $scope.tabActive = function( tabId ){
    $scope.curEmoTabId = tabId;
    var tabs = document.getElementById( 'emoticon-tabs' ).getElementsByTagName( "a" );

    for( var inx = 0 ; inx < tabs.length;inx++ ){
      if( tabs[inx].id == "tab"+tabId ){
        tabs[inx].className = "tab-item tab-item-active";
        document.getElementById( "tabbody"+inx ).style.display = "block";
      } else {
        tabs[inx].className = "tab-item";
        document.getElementById( "tabbody"+inx ).style.display = "none";
      }
    }
  };

  var inputObj = document.getElementById('file');
  $scope.openFileDialog = function( sourceType ) {
    if( navigator.camera ){

      var opts = {
        quality: 50,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: sourceType,
        encodingType: 0
      }

      navigator.camera.getPicture(onSuccess, onFail, opts);

      function onSuccess(FILE_URI) {
        $scope.toggleExt( "false" );
        $rootScope.xpush.uploadFile(channelId, FILE_URI, {
          type: 'image'
        }, function (data){
          var imageUrl = $rootScope.xpush.getFileUrl(channelId, JSON.parse(data.response).result.tname );
          Chat.send( imageUrl, 'I' );
        });

      }

      function onFail(message) {
        $scope.toggleExt( "false" );
        console.log(message);
      }
    } else {
      $scope.toggleExt( "false" );
      ionic.trigger('click', { target: document.getElementById('file') });
    }
  };

  var itemInx = 0;
  angular.element( inputObj ).on('change',function(event) {

    var type = UTIL.getType( inputObj );

    var options = {
      file: inputObj
    };

    if( type == 'image' ){
      options.type = "image";
    }

    var tp = "";
    if( type == 'video' ){
      tp = "SVP";
    } else {
      tp = "SFP";
    }

    var nextMessage = { type : tp, inx : itemInx, message : inputObj.value };
    var thisInx = itemInx;

    $scope.messages.push(angular.extend({}, nextMessage));
    $scope.$apply();
    itemInx++;

    $ionicFrostedDelegate.update();
    $ionicScrollDelegate.scrollBottom(true);

    setTimeout( function(){
      $ionicFrostedDelegate.update();
      $ionicScrollDelegate.scrollBottom(true);
      uploadStream( options, type, thisInx );
    }, 100 );
  });

  uploadStream = function( options, type, itemJnx ){
    var progressbar = document.getElementById( "progress_bar"+itemJnx );
    var tempDiv = document.getElementById( "progress_div"+itemJnx );

    $rootScope.xpush.uploadStream( channelId, options, function(data, idx){
      inputObj.value = "";
      console.log("progress  ["+idx+"]: "+data);

      progressbar.value = data;
    }, function(data,idx){
      var msg;
      var msgType;

      if( type == 'image' ){
        msg = $rootScope.xpush.getFileUrl(channelId, data.result.tname );
        msgType = 'I';
      } else if ( type == 'video' ) {
        msg = data.result.name;
        msgType = 'V';
      } else {
        msg = $rootScope.xpush.getFileUrl(channelId, data.result.name );
        msgType = 'I';
      }

      angular.element( tempDiv ).remove();
      inputObj.value = "";
      console.log("completed ["+idx+"]: "+JSON.stringify(data));

      Chat.send( msg, msgType );
    });
  }
});
