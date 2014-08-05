angular.module('starter.controllers', [])

.controller('ChannelCtrl', function($scope, $rootScope, $rootElement, $window, $state, $stateParams, ChannelDao, Friends, Cache, Sign, NAVI ) {
  $rootScope.currentChannel = '';

  ChannelDao.getAllCount().then( function ( result ){
    $rootScope.totalUnreadCount = result.total_count;
  });

  $scope.channelArray = [];

  ChannelDao.list( $scope ).then(function(channels) {
    $scope.channelArray = [];
    $scope.channelArray = channels;
  });

  $scope.gotoChat = function( channelId ) {

    ChannelDao.get( channelId ).then(function(data) {
      $stateParams.channelId = channelId;
      $stateParams.channelUsers = data.channel_users;
      $stateParams.channelName = data.channel_name;

      NAVI.gotoChat( $scope, $stateParams );
    });
  };
})
.controller('FriendsCtrl', function($scope, $ionicLoading, $rootScope, $state, $stateParams, $ionicPopup, $ionicModal, $ionicScrollDelegate, Friends, UTIL, Manager, NAVI) {
  $rootScope.currentChannel = '';

  /**
   * @ngdoc function
   * @name listFriend
   * @module starter.controllers
   * @kind function
   *
   * @description Retrieve friends in database
   */
  $scope.listFriend = function(){
    Friends.list(function(friends){
      if( friends != undefined ){
        $scope.friends = [];
        $scope.friends = friends;
        $scope.friendCount = $scope.friends.length;
      }
    });
  };

  /**
   * @ngdoc function
   * @name syncFriends
   * @module starter.controllers
   * @kind function
   *
   * @description Sync friends with server
   */
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
    NAVI.gotoChat( $scope, $stateParams );
  };

  /**
   * @ngdoc function
   * @name openUserModal
   * @module starter.controllers
   * @kind function
   *
   * @description Open User modal to friend management
   */
  $scope.openUserModal = function() {
    $scope.modal.datas = [];
    $scope.modal.selection = [];
    $scope.modal.num = 1;
    $scope.modal.changed = false;
    $scope.modal.visible = true;
    $scope.modal.search = '';
    $scope.modal.show();
  };

  /**
   * @description make template for modal-user
   */
  $ionicModal.fromTemplateUrl('templates/modal-users.html', {
    scope: $scope,
    animation: 'slide-in-up',
    focusFirstInput: true
  }).then(function(modal) {
    $scope.modal = modal;
    $scope.modal.changed = false;
    $scope.modal.visible = false;
  });

  /**
   * @ngdoc eventHandler
   * @name modal.hidden
   * @module starter.controllers
   * @kind eventHandler
   *
   * @description event called when modal closing
   */
  $scope.$on('modal.hidden', function() {
    $scope.modal.visible = false;

    if($scope.modal.changed){
      // Sync friends with Server
      $scope.syncFriends();
      $scope.modal.changed = false;
    }
  });

  /**
   * @ngdoc eventHandler
   * @name modal.shown
   * @module starter.controllers
   * @kind eventHandler
   *
   * @description event called when modal opening
   */
  $scope.$on('modal.shown', function() {
    $ionicScrollDelegate.$getByHandle('modalContent').scrollTop(true);
  });
})

.controller('UsersModalCtrl', function($scope, Users, Sign, Friends) {

  /**
   * @ngdoc function
   * @name toggleSelection
   * @module starter.controllers
   * @kind function
   *
   * @description Push selected userId into selection array
   * @param {string} selected userId in user modal
   */
  $scope.toggleSelection = function( friendId ){
    var inx = $scope.modal.selection.indexOf( friendId );
    if( inx > -1 ){
      $scope.modal.selection.splice(inx, 1);
    } else {
      $scope.modal.selection.push( friendId );
    }
  };

  /**
   * @ngdoc function
   * @name addFriends
   * @module starter.controllers
   * @kind function
   *
   * @description Save selected friends into server
   */
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

  $scope.searchUsers = function() {

    $scope.modal.visible = true;
    $scope.modal.num = 1;

    $scope.retrieveUsers();
  };

  /**
   * @ngdoc function
   * @name retrieveUsers
   * @module starter.controllers
   * @kind function
   *
   * @description Search user from server
   */
  $scope.retrieveUsers = function() {

    console.log('$scope.modal.visible : ',$scope.modal.visible, $scope.modal.num);
    if($scope.modal.visible){

      var loginUserId = Sign.getUser().userId;

      var query = {
        GR: {'$ne': loginUserId}
      };

      if($scope.modal.search) query['DT.NM'] = '%'+$scope.modal.search+'%';

      Users.search(query, $scope.modal.num, function(users){

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

  /**
   * @ngdoc function
   * @name toggleSelection
   * @module starter.controllers
   * @kind function
   *
   * @description Push selected userId into selection array
   */
  $scope.toggleSelection = function( friendId ){
    var inx = $scope.modal.selection.indexOf( friendId );
    if( inx > -1 ){
      $scope.modal.selection.splice(inx, 1);
    } else {
      $scope.modal.selection.push( friendId );
    }
  };

  /**
   * @ngdoc function
   * @name inviteFriends
   * @module starter.controllers
   * @kind function
   *
   * @description Invite friend to current channel
   *  1:1 channel : create new channel for multiple channel
   *  multiple channel : Add selected friends into current channel and change channel name
   */
  $scope.inviteFriends = function() {
    var res = $scope.modal.selection;
    var channelId = $scope.modal.channelId;
    var channelName = $scope.modal.channelName;
    var channelUsers = $scope.modal.channelUsers;

    if(res.length > 0){

      var joinUsers = [];

      // selection -> join users
      for( var key in res ){
        joinUsers.push( res[key] );

        if( channelUsers.indexOf( res[key] ) < 0 ){
          channelUsers.push( res[key] );
        }
      }

      $scope.modal.channelUsers = channelUsers;

      // 1:1 channel
      if( channelId.indexOf( "$" ) > -1 ){

        // create new channel for multiple user
        $rootScope.$stateParams.friendIds = channelUsers.join( "$" );
        $state.transitionTo('chat', {}, { reload: true, inherit: true, notify: true });
      } else {
        // Add selected friends into current channel and change channel name
        channelName = channelName + ","+UTIL.getNames( joinUsers );
        $scope.modal.channelName = channelName;

        // Update channel info server with current channel info
        var joinObject = { 'U' : joinUsers, 'DT' : { 'NM' : channelName,'US' : channelUsers, 'F' : loginUser.userName, 'UC': channelUsers.length } };
        Chat.join( channelId, joinObject, function(data){
          if( data.status == 'ok' ){
            var iMsg = UTIL.getInviteMessage( joinUsers );

            // Send channel join message and update channel info in local db
            Chat.send( iMsg, 'J' );
            ChannelDao.updateUsers( { 'channel': channelId, 'name' : channelName, 'users': channelUsers } );
          }
        });
      }

      $scope.modal.changed = true;
      $scope.modal.hide();
    }
  };

  /**
   * @ngdoc function
   * @name retrieveFriends
   * @module starter.controllers
   * @kind function
   *
   * @description Push selected userId into selection array
   */
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
      $scope.modal.datas = [];
      $scope.modal.datas = friends;
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

  /**
   * @ngdoc function
   * @name changeImage
   * @module starter.controllers
   * @kind function
   *
   * @description Reset friends list
   * @param {string} new image url;
   */
  $scope.updateUserInfo = function(newImage){
    if( newImage != '' ){
      $scope.loginUser.image = newImage;
    }

    var params = { 'A' : 'messengerx', 'U' : $scope.loginUser.userId, 'PW' : $scope.loginUser.password, 'D' : $rootScope.deviceId, 'N' : $rootScope.notiId,
               DT : { 'NM' : $scope.loginUser.userName, 'I': $scope.loginUser.image, 'MG' : $scope.loginUser.message } };

    // update userInfo in server
    Sign.update( params, function(data){
      if( data.status == 'ok' ){
        // set updated user info current session
        Sign.setUser( $scope.loginUser );
      }
    });
  };
})
.controller('EmoticonCtrl', function($scope, $rootScope, Sign, ChannelDao, Chat, Emoticons) {
  $rootScope.currentChannel = '';
  var loginUser = Sign.getUser();
  var channelId = '';

  $scope.emoticon = {};
  Emoticons.list( { group : 'custom' }, function(emoticons){
    if( emoticons.length > 0 ){
      $scope.emoticon = emoticons[0];
    }
  });

  /**
   * @ngdoc function
   * @name openFileDialog
   * @module starter.controllers
   * @kind function
   *
   * @description open file dialog
   */
  $scope.openFileDialog = function() {
    ionic.trigger('click', { target: document.getElementById('file') });
  };

  /**
   * @ngdoc function
   * @name initSelfChannel
   * @module starter.controllers
   * @kind function
   *
   * @description make self channel for emoticon file upload
   */
  var initSelfChannel = function(){

    // channel for loginUser
    var channelUsers = [loginUser.userId];

    var createObject = {};
    createObject.U = channelUsers;    
    channelId = ChannelDao.generateId(createObject);    
    createObject.DT = { 'US' : channelUsers, 'UC': channelUsers.length };
    createObject.C = channelId;

    $rootScope.xpush.createChannel(channelUsers, channelId, createObject.DT, function(data){

      var param = {};
      param.app = loginUser.app;
      param.channel = channelId;
      param.userId = loginUser.userId;
      param.deviceId = loginUser.deviceId;

      // Channel Init
      Chat.init( param, '', $scope, function( messages ){
      });
    });
  };

  // Initialize this controller
  initSelfChannel();

  /**
   * @ngdoc eventHandler
   * @name inputObj
   * @module starter.controllers
   * @kind eventHandler
   *
   * @description make self channel for emoticon file upload
   */
  var inputObj = document.getElementById('file');
  angular.element( inputObj ).on('change',function(event) {

    // upload file stream
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

      // Save emoticon to local db
      Emoticons.add( param, $scope.emoticon );
    });
  });
})
.controller('SignInCtrl', function($scope, $rootScope, $state, $location, $stateParams, $ionicPopup, Friends, Sign, Cache) {

  if( window.root ){
    $scope.hideNavbar = "false";
  } else {
    $scope.hideNavbar = "true";
  }

  /**
   * @ngdoc function
   * @name signIn
   * @module starter.controllers
   * @kind function
   *
   * @description Authorization
   * @param {jsonObject} Json object that is mapped to the screen
   */
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

        $ionicPopup.alert(alertMessage);

      }else{

        // Create current session Info
        var loginUser = {};
        loginUser.app = params.A;
        loginUser.userId = user.userId;
        loginUser.password = params.PW;
        loginUser.deviceId = $rootScope.deviceId;

        loginUser.image = result.user.DT.I;
        loginUser.userName = result.user.DT.NM;
        loginUser.message = result.user.DT.MG;

        $rootScope.loginUser = loginUser;

        // Save session Info
        Sign.setUser( loginUser );

        // Push userImage and userName into local cache oject
        Cache.add(user.userId, {'NM':loginUser.userName, 'I':loginUser.image});

        // Retrieve refresh history for sync friends
        Friends.getRefreshHistory(function(history){

          // Do not update within an hour( 3600s )
          if( history != undefined && ( history.time - Date.now() ) < 60000 ){
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
  /**
   * @ngdoc function
   * @name signUp
   * @module starter.controllers
   * @kind function
   *
   * @description Create user into server
   * @param {jsonObject} Json object that is mapped to the screen
   */
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

  /**
   * @ngdoc eventHandler
   * @name INTER_WINDOW_DATA_TRANSFER
   * @module starter.controllers
   * @kind eventHandler
   *
   * @description Generate a pop-up screen from th parent screen
   * @param {jsonObject}
   * @param {jsonObject} Json object from the parent screen
   */
  $rootScope.$on("INTER_WINDOW_DATA_TRANSFER", function (data, args) {
    // Copy session object and cache object
    Sign.setUser( args.loginUser );
    Cache.set( args.cache );
    loginUser = Sign.getUser();

    $rootScope.xpush.setSessionInfo( loginUser.userId, loginUser.deviceId, function(){


      $rootScope.xpush._sessionConnection = args.sessionConnection;
      channelId = args.stateParams.channelId;
      $rootScope.xpush.isExistUnread = false;

      // Initialize chat controller
      init( args.stateParams );
      Manager.addEvent();        
    });
  });

  /**
   * @ngdoc function
   * @name initChat
   * @module starter.controllers
   * @kind function
   *
   * @description Initialize Chat service
   * @param {jsonObject}
   * @param {String} Invite Message
   */
  var initChat = function( inviteMsg ){

    $rootScope.currentChannel = channelId;
    $rootScope.currentScope = $scope;

    var param = {};
    param.app = loginUser.app;
    param.channel = channelId;
    param.userId = loginUser.userId;
    param.deviceId = loginUser.deviceId;

    // Channel Init
    Chat.init( param, inviteMsg, $scope, function( messages ){
      if( messages != undefined ){

        // Message in local database
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

  /**
   * @ngdoc function
   * @name init
   * @module starter.controllers
   * @kind function
   *
   * @description Initialize current controller
   * @param {jsonObject} channelId, channelName, channelUsers
   */
  var init = function( stateParams ){

    // If channelId is exist, use the channel
    if( stateParams.channelId != undefined ) {
      channelId = stateParams.channelId;

      channelUsers = stateParams.channelUsers.split(",");
      channelUsers.sort();
      channelName = stateParams.channelName;

      initChat( '' );
    } else {
      // make friend string to array
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

      // Generate channel id
      channelId = ChannelDao.generateId(createObject);
      createObject.C = channelId;

      // Create channel with channel info and save into local db
      $rootScope.xpush.createChannel(channelUsers, channelId, createObject.DT, function(data){
        createObject.unreadCount = 0;
        ChannelDao.insert( createObject );

        var inviteMsg = "";
        if( channelUsers.length > 2 ){
          inviteMsg = UTIL.getInviteMessage( channelUsers );
        }

        initChat( inviteMsg );
      });
    }

    // Reset $stateParams
    $rootScope.$stateParams = {};
    $scope.channelName = channelName;
    $scope.channelId = channelId;
    $scope.channelUsers = channelUsers;

    // Retrieve emoticon list from local db.
    Emoticons.list( {}, function(emoticons){
      $scope.emoticons.push( { group : 's2', tag : 'ion-happy', 'CN' : 'tab-item tab-item-active', items : {
          "01" : [rootImgPath+'/emo/s2/anger.PNG', rootImgPath+'/emo/s2/burn.PNG', rootImgPath+'/emo/s2/cool.PNG', rootImgPath+'/emo/s2/love.PNG'],
          "02" : [rootImgPath+'/emo/s2/shout.PNG', rootImgPath+'/emo/s2/smile.PNG']}}
      );
      $scope.emoticons = $scope.emoticons.concat( emoticons );
      //$scope.emoticons['b2'] = [rootImgPath+'/emo/b2/anger.png', rootImgPath+'/emo/b2/cry.png',  rootImgPath+'/emo/b2/haha.png', rootImgPath+'/emo/b2/money.png'];
    });
  };

  // Not
  if( stateParams != undefined ){
    channelId = stateParams.channelId;
    init( stateParams );
  }

  /**
   * @ngdoc function
   * @name add
   * @module starter.controllers
   * @kind function
   *
   * @description Add message to screen and Update scroll
   * @param {jsonObject} channelId, channelName, channelUsers
   */
  $scope.add = function( nextMessage ) {
    $scope.messages.push(angular.extend({}, nextMessage));

    $scope.$apply();

    // Update the scroll area and tell the frosted glass to redraw itself
    if( nextMessage.from != 'RI' && nextMessage.from != 'SI' ){
      $ionicFrostedDelegate.update();
      $ionicScrollDelegate.scrollBottom(true);
    }
  };

  /**
   * @ngdoc function
   * @name send
   * @module starter.controllers
   * @kind function
   *
   * @description Send Message and reset input text
   * @param {jsonObject} channelId, channelName, channelUsers
   */
  $scope.send = function() {
    if( $scope.inputMessage != '' ){
      var msg = $scope.inputMessage;
      $scope.inputMessage = '';
      Chat.send( msg );
    }
  };

  $scope.selection = [];

  /**
   * @ngdoc function
   * @name openFriendModal
   * @module starter.controllers
   * @kind function
   *
   * @description Open User modal to friend management
   */
  $scope.openFriendModal = function() {
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
  });

  $scope.$on('$destroy', function() {
     window.onbeforeunload = undefined;
  });

  /**
   * @ngdoc eventHandler
   * @name openFriendModal
   * @module starter.controllers
   * @kind eventHandler
   *
   * @description Open User modal to friend management
   * @param {object} event
   * @param {object} next state
   * @param {object} currnet state
   */
  $scope.$on('$locationChangeStart', function(event, next, current) {

    // called when chat screen out
    if( current.indexOf('/chat') > -1 ){
      if(!confirm("Are you sure you want to leave this page?")) {
        event.preventDefault();
      } else {
        $rootScope.currentChannel = '';
      }
    }
  });

  /**
   * @ngdoc function
   * @name openWebRTC
   * @module starter.controllers
   * @kind function
   *
   * @description Open webRTC for video chatting
   * @param {string} webRTC key
   */
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

    // Send video call
    if( newFlag ){
      Chat.send( chKey, 'VI' );
    }
  };

  $scope.emoticons = [];

  $scope.curEmoTabId = "0";
  $scope.showEmo = "false";
  $scope.showExt = "false";

  /**
   * @ngdoc function
   * @name toggleEmoticons
   * @module starter.controllers
   * @kind function
   *
   * @description show or hide emoticon div
   * @param {string}
   */
  $scope.toggleEmoticons = function( flag ){
    $scope.showEmo = flag;
    if( $scope.showEmo == "true" ){
      document.getElementById( 'tabbody'+$scope.curEmoTabId ).style.display = "block";
      document.getElementById( 'chat-emoticons' ).style.display = "block";
      document.getElementById( "chat-extends" ).style.display = "none";
      $scope.showExt = "false";
    } else {
      document.getElementById( 'chat-emoticons' ).style.display = "none";
    }
  };

  /**
   * @ngdoc function
   * @name toggleExt
   * @module starter.controllers
   * @kind function
   *
   * @description show or hide extension div
   * @param {string}
   */
  $scope.toggleExt = function( flag ) {
    $scope.showExt = flag;
    if( $scope.showExt == "true" ){
      document.getElementById( "chat-extends" ).style.display = "block";
      document.getElementById( 'chat-emoticons' ).style.display = "none";
      $scope.showEmo = "false";
    } else {
      document.getElementById( "chat-extends" ).style.display = "none";
    }
  };

  /**
   * @ngdoc function
   * @name sendEmoticon
   * @module starter.controllers
   * @kind function
   *
   * @description Send selected emoticon url
   * @param {string} url
   */
  $scope.sendEmoticon = function(url){
    $scope.toggleEmoticons( "false" );
    document.getElementById( 'chat-emoticons' ).style.display = "none";
    Chat.send( url, 'E' );
  };

  /**
   * @ngdoc function
   * @name tabActive
   * @module starter.controllers
   * @kind function
   *
   * @description Active selected tab and deactive another tab
   * @param {string} selected tabId
   */
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


  /**
   * @ngdoc eventHandler
   * @name openFileDialog
   * @module starter.controllers
   * @kind eventHandler
   *
   * @description make self channel for emoticon file upload
   */
  var inputObj = document.getElementById('file');
  $scope.openFileDialog = function( sourceType ) {

    // If android or IOS, use native plugin
    if( navigator.camera ){

      var opts = {
        quality: 50,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: sourceType,
        encodingType: 0
      };

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

      // If using browser, use file dialog
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

    // if video, add vido progress bar. Otherwise show progress bar.
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

    setTimeout( function(){
      $ionicFrostedDelegate.update();
      $ionicScrollDelegate.scrollBottom(true);
      uploadStream( options, type, thisInx );
    }, 100 );
  });

  /**
   * @ngdoc function
   * @name uploadStream
   * @module starter.controllers
   * @kind function
   *
   * @description upload file using socket stream.
   */
  var uploadStream = function( options, type, itemJnx ){
    var progressbar = document.getElementById( "progress_bar"+itemJnx );
    var tempDiv = document.getElementById( "progress_div"+itemJnx );

    $rootScope.xpush.uploadStream( channelId, options, function(data, idx){
      inputObj.value = "";

      // Update progress bar
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

      // remove progress bar
      angular.element( tempDiv ).remove();
      inputObj.value = "";
      console.log("completed ["+idx+"]: "+JSON.stringify(data));

      Chat.send( msg, msgType );
    });
  };
});
