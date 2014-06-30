angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, SocketManager, Channels, Sign, Chat) {

})
.controller('ChannelCtrl', function($scope, $state, SocketManager, Channels, Sign, Chat) {

  var channelIds = [];
  $scope.channels = [];

  Channels.list( $scope ).then(function(data) {
    $scope.channels = $scope.channels.concat(data);
  });
})
.controller('ChannelDtlCtrl', function($scope, $ionicFrostedDelegate, $ionicScrollDelegate, $state, $stateParams, SocketManager, Channels, Sign, Chat) {
  var messageOptions = [];
  var loginUser = Sign.getUser();
  var channelId = $stateParams.channelId;

  var param = {};
  param.app = loginUser.app;
  param.channel = channelId;
  param.userId = loginUser.userId;
  param.deviceId = loginUser.deviceId;

  $scope.messages = [];

  // Channel Init
  Chat.init( param, loginUser, $scope, function( messages ){
    if( messages != undefined ){
      $scope.messages = $scope.messages.concat(messages);;
      $scope.$apply();
    }
  });

  $scope.add = function( nextMessage ) {
    $scope.messages.push(angular.extend({}, nextMessage));

    $scope.$apply();

    // Update the scroll area and tell the frosted glass to redraw itself
    $ionicFrostedDelegate.update();
    $ionicScrollDelegate.scrollBottom(true);
  };

  $scope.send = function() {    
    var msg = $scope.inputMessage;
    $scope.inputMessage = '';
    Chat.send( msg );
  }; 

})
.controller('FriendsCtrl', function($scope, Friends) {
  //$scope.friends = Friends.all();
  Friends.list(function(friends){
    if( friends != undefined ){
      $scope.friends = friends;
      $scope.$apply();
    }
  });
})
.controller('AccountCtrl', function($scope) {

})
.controller('SignInCtrl', function($scope, $state, $stateParams, $http, Sign) {
  $scope.signIn = function(user) {
		var params = { 'app' : 'messengerx', 'userId' : user.userid, 'password' : user.password, 'deviceId' : 'ionic', 'name' : user.username,
                 'image':'https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/t1.0-1/p50x50/10462917_1503891336506883_4678783454533660696_t.jpg' };
		//var params = { 'app' : 'messengerx', 'userId' : 'F100002531861340', 'password' : '100002531861340', 'deviceId' : 'WEB' };
		//Sign.register( params, function(data){
      //console.log( 'register success : ' + data );

      Sign.login( params, function(data){
        var loginUser = params;
        loginUser.userToken = data.result.token;
        loginUser.sessionServer = data.result.serverUrl;

        Sign.setUser( loginUser );
        $state.go('tab.friends');
      });
    //});
  };
})
.controller('SignUpCtrl', function($scope, $state, $stateParams, $http, Sign) {
  $scope.signUp = function(user) {
    var params = { 'app' : 'messengerx', 'userId' : user.userid, 'password' : user.password, 'deviceId' : 'ionic', 'name' : user.username,
                 'image':'https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/t1.0-1/p50x50/10462917_1503891336506883_4678783454533660696_t.jpg' };
    //var params = { 'app' : 'messengerx', 'userId' : 'F100002531861340', 'password' : '100002531861340', 'deviceId' : 'WEB' };
    Sign.register( params, function(data){
      $state.go('signin');
    });
  };
})
.controller('ChatCtrl', function($scope, $ionicFrostedDelegate, $ionicScrollDelegate, $rootScope, $stateParams, Friends, Sign, Chat, SocketManager) {
  var messageOptions = [];
  var friend = Friends.get($stateParams.friendId);
  $scope.friend = friend;

  var loginUser = Sign.getUser();

  var param = {};
  param.app = loginUser.app;
  param.channel = loginUser.userId+'^'+friend.uid+'^'+'stalkio'+'^'+'ionic';
  param.userId = loginUser.userId;
  param.deviceId = loginUser.deviceId;

  var createObject = {};
  createObject.channel = param.channel;
  createObject.users = [ loginUser.userId, friend.uid ];

  $scope.messages = [];

  SocketManager.get( function(socket){
    socket.emit("channel-create", createObject, function(){
      console.log( "channel-create success" );

      // Channel Init
      Chat.init( param, loginUser, $scope, function( messages ){
        if( messages != undefined ){

          $scope.messages = $scope.messages.concat(messages);;
          $scope.$apply();
        }
      });
    });
  });
 
  //$scope.messages = messageOptions.slice(0, messageOptions.length);

  $scope.add = function( nextMessage ) {
    $scope.messages.push(angular.extend({}, nextMessage));

    $scope.$apply();

    // Update the scroll area and tell the frosted glass to redraw itself
    $ionicFrostedDelegate.update();
    $ionicScrollDelegate.scrollBottom(true);
  };

  $scope.send = function() {    
    var msg = $scope.inputMessage;
    $scope.inputMessage = '';
    Chat.send( msg );
  };  
});
