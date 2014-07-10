angular.module('starter.controllers', [])

.controller('ChannelCtrl', function($scope, $rootScope, $state, $stateParams, Channels, Friends, Sign ) {

  var loginUserId = Sign.getUser().userId;

  Channels.getAllCount().then( function ( result ){
    $rootScope.totalUnreadCount = result.total_count;
  });  

  $scope.channelArray = [];

  Channels.list( $scope ).then(function(channels) {
    $scope.channelArray = [];
    $scope.channelArray = channels;
    //$scope.$apply();
  });

  $scope.goChat = function( channelId ) {
    Channels.get( channelId ).then(function(data) {
      $stateParams.channelId = channelId;
      $stateParams.channelUsers = data.channel_users;
      $stateParams.channelName = data.channel_name;
      $rootScope.$stateParams = $stateParams;
      $state.go( 'chat' );
    });
  };

  $scope.getImage = function( channelId ){

    var image = "../www/img/default_image.jpg";
    if( channelId.indexOf( "$" ) > -1  ){
      var friendId = channelId.split( "^" )[0].replace("$").replace( loginUserId );
      console.log( friendId );
      if( Friends.get[friendId] != undefined ){
        console.log( Friends.get[friendId] );
        image = Friends.get[friendId].datas.image;
      }
    }

    return image;
  }
})
.controller('FriendsCtrl', function($scope, $rootScope, $state, $stateParams, $ionicPopup, Friends, Users, Channels) {

  Channels.getAllCount().then( function ( result ){
    $rootScope.totalUnreadCount = result.total_count;
  });

  $scope.friends = {};
  $scope.datas = [];
  $scope.friendCount = 0;
  $scope.searchKey = "";

  Friends.list(function(friends, friendCount){
    if( friends != undefined ){
      $scope.friends = angular.copy( friends );
      $scope.friendCount = friendCount;
      $scope.$apply();
    }
  });

  $scope.goProfile = function(){
    $state.go( 'tab.account' );
  };

  $scope.searchByKey = function( searchKey ){
    var friends = angular.copy(  Friends.all() ) ;

    if( searchKey != '' ){     
      for( var key in friends ){
        if( friends[key].chosung.indexOf( searchKey ) < 0 ){
          delete friends[key]
        }
      }

      $scope.friends = friends;
    } else {
      $scope.friends = Friends.all();
    }
  }

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
    $scope.data = {};
    $scope.selection = [];

    Users.list($scope.friends, function(users){
      if( users != undefined ){
        $scope.datas = users;
        $scope.$apply();
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
      console.log('Tapped!', res);
      if( res != undefined ){

        var addUsers = [];

        //TO-DO : Only ID
        for( var key in res ){
          if( addUsers.indexOf( res[key] ) < 0 ){
            addUsers.push( res[key] );
          }
        }

        Friends.add( addUsers, function( data ){
          if( data.status == 'ok' ){
            Friends.list(function(friends){
              if( friends != undefined ){
                $scope.friends = friends;
                var current = $state.current;
                $state.transitionTo(current, {}, { reload: true, inherit: true, notify: true });
              }
            });
          }
        });
      }
    });
  };
})
.controller('AccountCtrl', function($scope, Sign) {

  $scope.loginUser = Sign.getUser();

  $scope.newImage = '';

  $scope.changeImage = function(newImage){
    if( newImage != '' ){
      $scope.loginUser.datas.image = newImage;
    }

    var params = { 'app' : 'messengerx', 'userId' : $scope.loginUser.userId, 'password' : $scope.loginUser.password, 'deviceId' : 'ionic',  datas : { 'name' : $scope.loginUser.datas.name,
                 'image': $scope.loginUser.datas.image, 'message' : $scope.loginUser.datas.message } };
    Sign.update( params, function(data){
      if( data.status == 'ok' ){
        Sign.setUser( $scope.loginUser );
      }
    });
  };

})
.controller('SignInCtrl', function($scope, $rootScope, $state, $location, $stateParams, $http, Sign) {
  $scope.signIn = function(user) {
		var params = { 'app' : 'messengerx', 'userId' : user.userid, 'password' : user.password, 'deviceId' : 'ionic' };

    Sign.login( params, function(data){
      var loginUser = data.result.user;
      loginUser.userToken = data.result.token;
      loginUser.sessionServer = data.result.serverUrl;
      loginUser.password = user.password;
      loginUser.deviceId = 'ionic';

      $rootScope.loginUser = loginUser;
      Sign.setUser( loginUser );

      $state.go('tab.friends');
    });
  };
})
.controller('SignUpCtrl', function($scope, $state, $stateParams, $http, Sign) {
  $scope.signUp = function(user) {
    var params = { 'app' : 'messengerx', 'userId' : user.userid, 'password' : user.password, 'deviceId' : 'ionic', datas : {'name' : user.username,
                 'image':'../img/default_image.jpg', 'message':'' } };
    //var params = { 'app' : 'messengerx', 'userId' : 'F100002531861340', 'password' : '100002531861340', 'deviceId' : 'WEB' };
    Sign.register( params, function(data){
      $state.go('signin');
    });
  };
})
.controller('ChatCtrl', function($state, $scope, $ionicFrostedDelegate, $ionicScrollDelegate, $rootScope, $ionicPopup, Friends, Sign, Chat, SocketManager, Channels) {
  $scope.datas = [];

  Friends.list(function(friends){
    if( friends != undefined ){
      $scope.datas = friends;
      $scope.$apply();
    }
  });

  initChat = function(){
    var param = {};
    param.app = loginUser.app;
    param.channel = channelId;
    param.userId = loginUser.userId;
    param.deviceId = loginUser.deviceId;  

    // Channel Init
    Chat.init( param, loginUser, $scope, function( messages ){
      if( messages != undefined ){
        $scope.messages = $scope.messages.concat(messages);
        $ionicScrollDelegate.scrollBottom(true);
      }
    });
  };  

  var loginUser = Sign.getUser();
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

    initChat();
  } else {
    var friendIds = stateParams.friendIds.split("$");
    
    channelUsers = channelUsers.concat( friendIds );
    if( channelUsers.length == 1 ){
      channelName = channelUsers.join(',');
      channelUsers.push( loginUser.userId );
    } else {
      if( channelUsers.indexOf( loginUser.userId ) < 0 ){
        channelUsers.push( loginUser.userId );
      }
      channelUsers.sort();
      channelName = channelUsers.join(',');
    }

    var createObject = {};
    createObject.users = channelUsers;
    createObject.name = channelName;
    createObject.datas = { 'name' : channelName, 'users' : channelUsers, 'from' : loginUser.datas.name, 'users_cnt': channelUsers.length };

    var channelId = Channels.generateId(createObject);
    createObject.channel = channelId;

    SocketManager.get( function(socket){
      socket.emit("channel-create", createObject, function(data){
        console.log( "channel-create success" );

        createObject.unreadCount = 0;
        Channels.insert( createObject );
        initChat();
      });
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
    $scope.data = {};
    $scope.selection = [];
    $scope.channelUsers = channelUsers;

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
          $rootScope.$stateParams.friendIds = channelUsers.join( "$" );

          var current = $state.current;
          $state.transitionTo(current, {}, { reload: true, inherit: true, notify: true });
        } else {
          channelName = channelUsers.sort().join(",");
          $scope.channelName = channelName;
          var joinObject = { 'users' : joinUsers, 'datas' : { 'name' : channelName,'users' : channelUsers,  'from' : loginUser.datas.name, 'users_cnt': channelUsers.length } };
          Chat.join( joinObject, function(data){
            console.log( data );
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
        Chat.exit();
      }
    }
  });

});
