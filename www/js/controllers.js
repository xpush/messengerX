angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, SocketManager, Channels, Sign, Chat) {

})
.controller('ChannelCtrl', function($scope, $rootScope, $state, $stateParams, Channels) {

  var channelIds = [];
  $scope.channels = [];

  Channels.list( $scope ).then(function(data) {
    $scope.channels = $scope.channels.concat(data);
  });

  $scope.goChat = function( channelId ) {
    $stateParams.channelId = channelId;

    $rootScope.$stateParams = $stateParams;
    $state.go( 'chat' );
  };  
})
.controller('FriendsCtrl', function($scope, $rootScope, $state, $stateParams, Friends) {
  //$scope.friends = Friends.all();
  Friends.list(function(friends){
    if( friends != undefined ){
      $scope.friends = friends;
      $scope.$apply();
    }
  });

  $scope.goChat = function( friendId ) {
    $stateParams.friendId = friendId;

    $rootScope.$stateParams = $stateParams;
    $state.go( 'chat' );
  };
})
.controller('AccountCtrl', function($scope) {

})
.controller('SignInCtrl', function($scope, $state, $stateParams, $http, Sign) {
  $scope.signIn = function(user) {
		var params = { 'app' : 'messengerx', 'userId' : user.userid, 'password' : user.password, 'deviceId' : 'ionic', 'name' : user.username,
                 'image':'https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/t1.0-1/p50x50/10462917_1503891336506883_4678783454533660696_t.jpg' };

    Sign.login( params, function(data){
      var loginUser = params;
      loginUser.userToken = data.result.token;
      loginUser.sessionServer = data.result.serverUrl;

      Sign.setUser( loginUser );
      $state.go('tab.friends');
    });
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
.controller('ChatCtrl', function($scope, $ionicFrostedDelegate, $ionicScrollDelegate, $rootScope, Friends, Sign, Chat, SocketManager) {

  initChat = function(){
    var param = {};
    param.app = loginUser.app;
    param.channel = channelId;
    param.userId = loginUser.userId;
    param.deviceId = loginUser.deviceId;  

    // Channel Init
    console.log( "initChat" );
    Chat.init( param, loginUser, $scope, function( messages ){
      if( messages != undefined ){
        $scope.messages = $scope.messages.concat(messages);;
        $scope.$apply();
      }
    });
  };  

  var loginUser = Sign.getUser();
  $scope.messages = [];

  var stateParams = $rootScope.$stateParams;

  var channelId;
  var channelName;

  if( stateParams.friendId != undefined ){
    var friend = Friends.get(stateParams.friendId);

    var channelUsers = [ loginUser.userId, friend.uid ];
    channelUsers.sort();
    var channelKey = channelUsers.join("$");

    channelId = channelKey+'^'+'stalkio'+'^'+'ionic';
    channelName = channelUsers.join(',');

    var createObject = {};
    createObject.channel = channelId;
    createObject.users = channelUsers;

    SocketManager.get( function(socket){
      socket.emit("channel-create", createObject, function(){
        console.log( "channel-create success" );
        initChat();
      });
    });

  } else if( stateParams.channelId != undefined ) {
    channelId = stateParams.channelId;

    var channelUsers = channelId.split('^')[0];
    channelName = channelUsers.split("$").join(",");

    initChat();
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
    var msg = $scope.inputMessage;
    $scope.inputMessage = '';
    Chat.send( msg );
  };  
});
