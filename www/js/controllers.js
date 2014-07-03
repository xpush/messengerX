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
    Channels.get( channelId ).then(function(data) {
      console.log( data );
      $stateParams.channelId = channelId;
      $stateParams.channelUsers = data.channel_users;
      $rootScope.$stateParams = $stateParams;
      $state.go( 'chat' );
    });
  };  
})
.controller('FriendsCtrl', function($scope, $rootScope, $state, $stateParams, $ionicPopup, Friends, Users) {
  $scope.friends = [];
  $scope.datas = [];
  
  Friends.list(function(friends){
    if( friends != undefined ){
      $scope.friends = friends;
      $scope.$apply();
    }
  });
  
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

    Users.list(function(users){
      if( users != undefined ){
        $scope.datas = users;
        $scope.$apply();
      }
    });     

    // An elaborate, custom popup
    var myPopup = $ionicPopup.show({
      //template: '<ul class="list"><li class="item item-checkbox" ng-repeat="friend in friends"><label class="checkbox"><input type="checkbox"></label>{{friend.name}}</li></ul>',
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
.controller('ChatCtrl', function($state, $scope, $ionicFrostedDelegate, $ionicScrollDelegate, $rootScope, $ionicPopup, Friends, Sign, Chat, SocketManager, Channels) {
  $scope.datas = [];

  Friends.list(function(friends){
    if( friends != undefined ){
      $scope.datas = friends;
      $scope.$apply();
    }
  });

  console.log( "initController" );

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
  var channelUsers = [];

  if( stateParams.channelId != undefined ) {
    channelId = stateParams.channelId;

    channelUsers = stateParams.channelUsers.split(",");
    channelUsers.sort();
    channelName = channelUsers.join(",");

    initChat();
  } else {
    var friendIds = stateParams.friendIds.split("$");
    
    channelUsers = channelUsers.concat( friendIds );
    if( channelUsers.indexOf( loginUser.userId ) < 0 ){
      channelUsers.push( loginUser.userId );
    }
    channelUsers.sort();

    var createObject = {};
    createObject.name = channelUsers.join(',');
    createObject.channel_users = channelUsers;

    channelName = createObject.name;

    var channelId = Channels.generateId(createObject);
    createObject.channel = channelId;

    SocketManager.get( function(socket){
      socket.emit("channel-create", createObject, function(){
        console.log( "channel-create success" );
        Channels.add( createObject );
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
    var msg = $scope.inputMessage;
    $scope.inputMessage = '';
    Chat.send( msg );
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
      //template: '<ul class="list"><li class="item item-checkbox" ng-repeat="friend in friends"><label class="checkbox"><input type="checkbox"></label>{{friend.name}}</li></ul>',
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
          var joinObject = {};
          joinObject.deviceId = 'ionic';
          joinObject.userId = res[key];
          joinUsers.push( joinObject );

          if( channelUsers.indexOf( res[key] ) < 0 ){
            channelUsers.push( res[key] );
          }
        }

        // channel with 2 people
        if( channelId.indexOf( "$" ) > -1 ){
          $rootScope.$stateParams.friendIds = channelUsers.join( "$" );

          var current = $state.current;
          $state.transitionTo(current, {}, { reload: true, inherit: true, notify: true });
          console.log( 'reload' );
        } else {
          Chat.join( joinUsers, function(data){
            console.log( data );
          });
        }
      }
    });
  };  
});
