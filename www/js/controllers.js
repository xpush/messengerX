angular.module('starter.controllers', [])

.controller('ChannelCtrl', function($scope, $rootScope, $state, $stateParams, ChannelDao, Friends, Sign ) {
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
    });
  };
})
.controller('FriendsCtrl', function($scope, $rootScope, $state, $stateParams, $ionicPopup, $ionicModal, Friends, Users, UTIL, Manager) {
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

  $scope.showPopup = function() {
    $scope.modal.show();
  };

  $ionicModal.fromTemplateUrl('templates/modal-friends.html', function(modal) {
    $scope.modal = modal;
    $scope.modal.changed = false;
  }, {
    animation: 'slide-in-up'
  });
  $scope.$on('modal.hidden', function() {

    if($scope.modal.changed){
      Friends.list(function(friends){
        if( friends != undefined ){
          $scope.friends = [];
          $scope.friends = friends;
          $scope.friendCount = friends.length;
          //var current = $state.current;
          //$state.transitionTo(current, {}, { reload: true, inherit: true, notify: true });
          $scope.modal.changed = false;
        }
      });
    }
  });

})

.controller('FriendsModalCtrl', function($scope, Users, Friends) {
  $scope.selection = [];
  console.log('asdfasdfasdfasdf');

  Users.refresh(function(users){
    if( users != undefined ){
      $scope.datas = [];
      $scope.datas = users;
      $scope.selection = [];
    }
  });

  $scope.toggleSelection = function( friendId ){
    var inx = $scope.selection.indexOf( friendId );
    if( inx > -1 ){
      $scope.selection.splice(inx, 1);
    } else {
      $scope.selection.push( friendId );
    }
  };

  $scope.addFriends = function() {
    var res = $scope.selection;

    if(res.length > 0){
      var addUsers = [];

      //TO-DO : Only ID
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
.controller('SignInCtrl', function($scope, $rootScope, $state, $location, $stateParams, $http, $ionicPopup, Sign, Cache) {
  $scope.signIn = function(user) {
		var params = { 'A' : 'messengerx', 'U' : user.userId, 'PW' : user.password, 'D' : $rootScope.deviceId, 'N' : $rootScope.notiId };
    $rootScope.xpush.login( user.userId, user.password, $rootScope.deviceId, function(err, result){

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
        $state.go('tab.friends');
      }

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
  $scope.openFileDialog = function() {
    if( navigator.camera ){

      var opts = {
        quality: 50,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: 0,
        encodingType: 0
      }

      navigator.camera.getPicture(onSuccess, onFail, opts);

      function onSuccess(FILE_URI) {
        console.log(FILE_URI);

        inputObj.value = FILE_URI;

        console.log( inputObj) ;
        console.log( inputObj.value );
        $rootScope.xpush.uploadFile( channelId, {
          file: inputObj,
          type: 'image'
        }, function(data, idx){
          inputObj.value = "";
          console.log("progress  ["+idx+"]: "+data);
        }, function(data,idx){
          var tname = data.result.tname;

          inputObj.value = "";
          console.log("completed ["+idx+"]: "+JSON.stringify(data));

          var imageUrl = $rootScope.xpush.getFileUrl(channelId, tname );
          Chat.send( imageUrl, 'I' );
        });
      }

      function onFail(message) {
        console.log(message);
      }
    } else {
      ionic.trigger('click', { target: document.getElementById('file') });
    }
  };

  angular.element( inputObj ).on('change',function(event) {

    console.log( "onchanged" );

    $rootScope.xpush.uploadFile( channelId, {
      file: inputObj,
      type: 'image'
    }, function(data, idx){
      inputObj.value = "";
      console.log("progress  ["+idx+"]: "+data);
    }, function(data,idx){
      var tname = data.result.tname;

      inputObj.value = "";
      console.log("completed ["+idx+"]: "+JSON.stringify(data));

      var imageUrl = $rootScope.xpush.getFileUrl(channelId, tname );

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
