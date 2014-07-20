angular.module('starter.controllers', [])

.controller('ChannelCtrl', function($scope, $rootScope, $state, $stateParams, ChannelDao, Friends, Sign ) {
  
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
    });
  };
})
.controller('FriendsCtrl', function($scope, $rootScope, $state, $stateParams, $ionicPopup, Friends, Users, UTIL, Manager) {

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
    Friends.refresh( function(result){
      $scope.listFriend();
    });
  };

  $scope.friends = [];
  $scope.datas = [];
  $scope.friendCount = 0;
  $scope.searchKey = "";

  // Init Socket
  if( $rootScope.firstFlag ){
    $scope.syncFriends();
    Manager.init();
    $rootScope.firstFlag = false;
  } else {
    $scope.listFriend();
  }

  $scope.goProfile = function(){
    $state.go( 'tab.account' );
  };

  $scope.postFriends = function(friends){
    if( friends != undefined ){
      $scope.friends = [];
      $scope.friends = friends;
      $scope.friendCount = friends.length;
    }
  };

  $scope.resetFriends = function(){
    Friends.list(function(friends){
      if( friends != undefined ){
        $scope.friends = [];
        $scope.friends = friends;
        $scope.friendCount = friends.length;
      }
    });
  };

  $scope.postDatas = function(users){
    if( users != undefined ){
      $scope.datas = [];
      $scope.datas = users;
    }
  };

  $scope.resetDatas = function(){
    Users.list(function(users){
      if( users != undefined ){
        $scope.datas = [];
        $scope.datas = users;
      }
    });
  };

  $scope.goChat = function( friendIds ) {
    $stateParams.friendIds = friendIds;

    $rootScope.$stateParams = $stateParams;
    $state.go( 'chat' );
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

    $scope.selection = [];

    Users.refresh(function(users){
      if( users != undefined ){
        $scope.datas = [];
        $scope.datas = users;
      }
    });

    // An elaborate, custom popup
    var myPopup = $ionicPopup.show({
      templateUrl: "templates/popup-friends.html",
      title: 'Add Friends',
      //subTitle: 'Please use normal things',
      scope: $scope,
      buttons: [
        { text: 'Cancel' },
        {
          text: '<b>Save</b>',
          type: 'button-positive',
          onTap: function(e) {
            return $scope.selection;
          }
        },
      ]
    });

    myPopup.then(function(res) {
      if( res != undefined ){

        var addUsers = [];

        //TO-DO : Only ID
        for( var key in res ){
          if( addUsers.indexOf( res[key] ) < 0 ){
            addUsers.push( res[key] );
          }
        }

        Friends.add( addUsers, function( data ){
          Friends.list(function(friends){
            if( friends != undefined ){
              $scope.friends = [];
              $scope.friends = friends;
              $scope.friendCount = friends.length;
              //var current = $state.current;
              //$state.transitionTo(current, {}, { reload: true, inherit: true, notify: true });
            }
          });
        });
      }
    });
  };
})
.controller('AccountCtrl', function($scope, $rootScope, Sign) {

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
.controller('SignInCtrl', function($scope, $rootScope, $state, $location, $stateParams, $http, Sign, Cache) {
  $scope.signIn = function(user) {
		var params = { 'A' : 'messengerx', 'U' : user.userId, 'PW' : user.password, 'D' : $rootScope.deviceId, 'N' : $rootScope.notiId };
    $rootScope.xpush.login( user.userId, user.password, $rootScope.deviceId, function(message, result){

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
      $state.go('tab.friends');
    });
  };
})
.controller('SignUpCtrl', function($scope, $rootScope, $state, $stateParams, $http, Sign) {
  $scope.signUp = function(user) {
    var params = { 'A' : 'messengerx', 'U' : user.userId, 'PW' : user.password, 'D' : $rootScope.deviceId, 'N' : $rootScope.notiId,
     'DT' : {'NM' : user.userName, 'I':'../img/default_image.jpg', 'MG':'' } };
    Sign.register( params, function(data){
      $state.go('signin');
    });
  };
})
.controller('ChatCtrl', function($state, $scope, $ionicFrostedDelegate, $ionicScrollDelegate, $rootScope, $ionicPopup, Friends, Sign, Chat, ChannelDao, UTIL) {
  $rootScope.currentScope = $scope;

  var loginUser = Sign.getUser();

  initChat = function( inviteMsg ){

    var param = {};
    param.app = loginUser.app;
    param.channel = channelId;
    param.userId = loginUser.userId;
    param.deviceId = loginUser.deviceId;

    // Channel Init
    Chat.init( param, loginUser, inviteMsg, $scope, function( messages ){
      if( messages != undefined ){
        $scope.messages = $scope.messages.concat(messages);
        $ionicScrollDelegate.scrollBottom(true);
      }
    });
  };

  $scope.messages = [];

  var stateParams = $rootScope.$stateParams;

  var channelId;
  var channelName;
  var channelUsers = [];

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

    var channelId = ChannelDao.generateId(createObject);
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
  }

  $rootScope.$stateParams = {};
  $scope.channelName = channelName;

  $scope.add = function( nextMessage ) {
    $scope.messages.push(angular.extend({}, nextMessage));

    $scope.$apply();

    // Update the scroll area and tell the frosted glass to redraw itself
    $ionicFrostedDelegate.update();
    $ionicScrollDelegate.scrollBottom(true);
  };

  $scope.send = function() {    
    if( $scope.inputMessage != '' ){
      var msg = $scope.inputMessage;
      $scope.inputMessage = '';
      Chat.send( msg );
    }
  };

  // Triggered on a button click, or some other target
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
    $scope.datas = [];
    $scope.selection = [];
    $scope.channelUsers = channelUsers;

    Friends.list(function(friends){
      if( friends != undefined ){
        $scope.datas = friends;
      }
    });    

    // An elaborate, custom popup
    var myPopup = $ionicPopup.show({
      templateUrl: "templates/popup-friends.html",
      title: 'Select Friends',
      //subTitle: 'Please use normal things',
      scope: $scope,
      buttons: [
        { text: 'Cancel' },
        {
          text: '<b>Save</b>',
          type: 'button-positive',
          onTap: function(e) {
            return $scope.selection;
          }
        },
      ]
    });

    myPopup.then(function(res) {
      if( res != undefined ){

        var joinUsers = [];

        //TO-DO : Only ID
        for( var key in res ){
          joinUsers.push( res[key] );

          if( channelUsers.indexOf( res[key] ) < 0 ){
            channelUsers.push( res[key] );
          }
        }

        // channel with 2 people
        if( channelId.indexOf( "$" ) > -1 ){

          // Init Controller To Create New Channel
          $rootScope.$stateParams.friendIds = channelUsers.join( "$" );

          var current = $state.current;
          $state.transitionTo(current, {}, { reload: true, inherit: true, notify: true });
        } else {
          channelName = $scope.channelName + ","+UTIL.getNames( joinUsers );
          $scope.channelName = channelName;

          var joinObject = { 'U' : joinUsers, 'DT' : { 'NM' : channelName,'US' : channelUsers, 'F' : loginUser.userName, 'UC': channelUsers.length } };
          Chat.join( joinObject, function(data){
            if( data.status == 'ok' ){
              var iMsg = UTIL.getInviteMessage( joinUsers );

              Chat.send( iMsg, 'I' );
              ChannelDao.updateUsers( { 'channel': channelId, 'name' : channelName, 'users': channelUsers } );
            }
          });
        }
      }
    });
  };

  $scope.openFileDialog = function() {
    console.log('fire! $scope.openFileDialog()');
    ionic.trigger('click', { target: document.getElementById('file') });
  };

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

  var inputObj = document.getElementById('file');
  angular.element( inputObj ).on('change',function(event) {
    console.log('fire! angular#element change event');

    $rootScope.xpush.uploadFile( channelId, {
      file: inputObj,
      //overwrite: true,
      type: 'image'
    }, function(data, idx){
      inputObj.value = "";
      console.log("progress  ["+idx+"]: "+data);
    }, function(data,idx){
      imageId = data.result.name;

      inputObj.value = "";
      console.log("completed ["+idx+"]: "+JSON.stringify(data));
      
      var imageUrl = $rootScope.xpush.getFileUrl(channelId, imageId );
      Chat.send( imageUrl, 'I' );
    });
  });

  $scope.postDatas = function(users){
    if( users != undefined ){
      $scope.datas = [];
      $scope.datas = users;
    }
  };

  $scope.resetDatas = function(){
    Friends.list(function(users){
      if( users != undefined ){
        $scope.datas = [];
        $scope.datas = users;
      }
    });
  };
});