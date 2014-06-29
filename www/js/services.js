angular.module('starter.services', [])

/**
 * A simple example service that returns some data.
 */
.factory('Friends', function(SocketManager, Sign) {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var friends = [];
  var friendNames = [];

  return {
    all: function() {
      return friends;
    },
    get: function(friendId) {
      // Simple index lookup
      return friends[friendId];
    },
    list : function(callback){
      SocketManager.get( function( socket ){
        socket.emit( 'user-list', {}, function( data ){
          if( data.status == 'ok' ){
            var users = data.result;
            var jnx = 0;
            for( var inx = 0 ; inx < users.length ; inx++ ){              
              if( users[inx].userId != Sign.getUser().userId ){
                if( friendNames.indexOf( users[inx].userId ) < 0 ){
                  friendNames.push( users[inx].userId );
                  friends.push( { 'id' : jnx++, uid : users[inx].userId, name: users[inx].userId } );
                }
              }
            }

            callback( friends );
          }
        });
      });
    }
  }
})
.factory('Channels', function(DB) {
  // Might use a resource here that returns a JSON array
  var scope;

  return {
    list : function( $scope ){
      scope = $scope;

      return DB.query(
        'SELECT channel as id, channel_name as name, unread_count FROM TB_CHANNEL ORDER BY channel_updated DESC'
      ).then(function(result) {
          return DB.fetchAll(result);
        });
    },
    add : function(jsonObj){

      var query =
        "INSERT OR REPLACE INTO TB_CHANNEL "+
        "(channel, channel_name, channel_user_id, unread_count) VALUES "+
        "(?, ?, ?, ?)";

      var cond = [
        jsonObj.id,
        jsonObj.name,
        jsonObj.name,
        1
      ];

      if( scope != undefined ){
        var channel = {'id':jsonObj.id,'name':jsonObj.name,'unread_count':1};
        var dupFlag = false;
        for( var inx = 0; !dupFlag && inx < scope.channels.length ; inx++){
          if( scope.channels[inx].id == channel.id ){
            dupFlag = true;
          }
        }

        if( !dupFlag ){
          scope.channels.push(angular.extend({}, channel));
          scope.$apply();
        }
      }

      return DB.query(query, cond).then(function(result) {
        return result;
      });
    }
  }
})
.factory('Messages', function(DB) {
  // Might use a resource here that returns a JSON array
  var scope;

  return {
    list : function( $scope, channel ){
      scope = $scope;

      return DB.query(
        'SELECT message, time FROM TB_MESSAGE ORDER BY time ASC WHERE channel = ?', [channel]
      ).then(function(result) {
          return DB.fetchAll(result);
        });
    },
    add : function(jsonObj){

      var query =
        "INSERT INTO TB_MESSAGE "+
        "(channel, sender, message, type, time) VALUES "+
        "(?, ?, ?, ?, ?)";

      var cond = [
        jsonObj.channel,
        jsonObj.sender,
        jsonObj.message,
        '1',
        Date.now()
      ];

      if( scope != undefined ){
        var message = {'id':jsonObj.id,'name':jsonObj.name,'unread_count':1};

        scope.messages.push(angular.extend({}, message));
        scope.$apply();
      }

      return DB.query(query, cond).then(function(result) {
        return result;
      });
    }
  }
})
.factory('SocketManager', function($http, Sign, Channels) {
  var sessionSocket;
  var initFlag = false;
  return {
    get : function(callback){
      if( !initFlag ){
        this.init( function( socket ) {
          sessionSocket = socket;
          callback( sessionSocket );
        });
      } else {
        callback( sessionSocket );
      }
    },
    init : function(callback){

     var loginUser = Sign.getUser();

      var socketOptions ={
        transports: ['websocket'],
        'force new connection': true
      };      

      var query =
        'app='+loginUser.app+'&'+
        'userId='+encodeURIComponent(loginUser.userId)+'&'+
        'deviceId='+loginUser.deviceId+'&'+
        'token='+loginUser.userToken;
        
      // Session Socket
      var socket = io.connect(loginUser.sessionServer+'/session?'+query, socketOptions);
      socket.on('connect', function() {
        console.log( 'session socket connect');
        initFlag = true;
        callback( socket );
      });

      socket.on('_event', function (messageObject) {
        if( messageObject.event == 'NOTIFICATION' ){
          var data = messageObject.data;
          console.log( data );
          var channel = {'id': data.channel, 'name': data.user.id };
          Channels.add( channel );
        }
      });

      socket.on('disconnect', function (data) {
        console.info('session socket disconnect');
      });    
    }
  }
})
.factory('Sign', function($http, BASE_URL) {
  var loginUser;
  return {
    login : function( params, callback ){
      $http.post("http://"+BASE_URL+":8000/auth", params)
      .success(function(data) {
        callback( data );
      })
      .error(function(data, status, headers, config) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
      });
    },
    register : function( params, callback ){
      $http.post("http://"+BASE_URL+":8000/user/register", params)
      .success(function(data) {
        callback( data );
      })
      .error(function(data, status, headers, config) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
      });
    },    

    setUser : function( user ){
      loginUser = user;
    },
    getUser : function(){
      return loginUser;
    }
  }
})
.factory('Chat', function($http, BASE_URL) {
  var channelSocket;
  var CONF = {};

  return {
    init : function( params, loginUser, $scope, callback ){
      $http.get("http://"+BASE_URL+":8000/node/"+ encodeURIComponent( params.app ) + "/"+ encodeURIComponent( params.channel )+'?1=1' )
      .success(function( data ) {

        var socketServerUrl = data.result.server.url;

        CONF._app = params.app;
        CONF._channel = params.channel;
        CONF._user = { id : loginUser.userId, name : loginUser.name, url :'', image : loginUser.image};

        var query = "app=" + params.app + "&channel=" + params.channel + "&userId=" + params.userId + "&deviceId=" + params.deviceId
         + "&server=" + data.result.server.name;
         
        var socketOptions ={
          'force new connection': true
        };

        channelSocket = io.connect(socketServerUrl+'/channel?'+query, socketOptions);

        channelSocket.on('connect', function() {
          console.log( 'channel connect' );
          channelSocket.emit( 'message-unread', function(jsonObj){
            console.log( 'message-unreads');
            var unreadMessages = jsonObj.result;

            var messages = [];
            for( var inx = 0 ; inx < unreadMessages.length ; inx++ ){
              try {
                messages.push( { content : '<p>'+decodeURIComponent( JSON.parse( unreadMessages[inx].message.data ).message )+'</p>', from : 'you' } );
              } catch( e ){
                console.log( e );
              }
            }
            callback(messages);
          });
        }); 

        channelSocket.on('connect_error', function(data) {
          console.log( data );
        });         

        channelSocket.on('message', function (data) {
          //console.info('\t MESSAGE : '+JSON.stringify(data));
          data.timestamp = Date.now()
          //var chatText = '<div class="timestamp">'+getTimeStamp()+':'+data.sender+'</div>';
          // var msgClass = data.sender==_userId?'from-op':'from-visitor';
          //chatText +='<div class="message '+msgClass+'">'+decodeURIComponent(data.message)+'</div>';

          if(data.msgClass == 'from-op'){
            data.picture = CONF._user.image;
          }else{
            data.sender = data.user.name;
            data.picture = data.user.image;
          }

          data.message = decodeURIComponent(data.message);
          var from = data.user.id == loginUser.userId ? 'me': 'you' ;
          var nextMessage = { content : '<p>'+data.message+'</p>', from : from };
          $scope.add( nextMessage );
        });
      })
      .error(function(data, status, headers, config) {
        console.log( status );
        // called asynchronously if an error occurs
        // or server returns response with an error status.
      });
    },
    send : function(msg){
      var param = {
        app:      CONF._app,
        channel:  CONF._channel,
        name:     'message',
        data:     {
          user:     CONF._user,
          message:  msg,
          sender : 'operator'
        }
      };

      channelSocket.emit('send', param, function (data) {
      });
    }
  }
})
.factory('DB', function($q, DB_CONFIG) {
  var self = this;
  self.db = null;

  self.init = function() {
    // Use self.db = window.sqlitePlugin.openDatabase({name: DB_CONFIG.name}); in production


    try {
      if (!window.openDatabase) {
        window.plugins.toast.showShortCenter(
          "죄송합니다. DB를 지원하지 않습니다. \n북마크 기능을 사용하실 수 없습니다.",function(a){},function(b){}
        );
      } else {
        var shortName = DB_CONFIG.name;
        var version = '1.0';
        var displayName = 'news database';
        var maxSize = 5 * 1024 * 1024; // in bytes
        self.db = openDatabase(shortName, version, displayName, maxSize);
      }
    } catch(e) {
      // Error handling code goes here.
      if (e == INVALID_STATE_ERR) {
        // Version number mismatch.
        window.plugins.toast.showShortCenter(
          "죄송합니다. DB 버젼을 지원하지 않습니다.\n북마크 기능을 사용하실 수 없습니다.",function(a){},function(b){}
        );
      } else {

        window.plugins.toast.showShortCenter(
          "죄송합니다. "+e+"\n북마크 기능을 사용하실 수 없습니다.",function(a){},function(b){}
        );

      }
      return;
    }

    angular.forEach(DB_CONFIG.tables, function(table) {
      var columns = [];

      angular.forEach(table.columns, function(column) {
        columns.push(column.name + ' ' + column.type);
      });

      var query = 'CREATE TABLE IF NOT EXISTS ' + table.name + ' (' + columns.join(',') + ')';
      self.query(query);
    });
  };

  self.query = function(query, bindings) {
    bindings = typeof bindings !== 'undefined' ? bindings : [];
    var deferred = $q.defer();

    self.db.transaction(function(transaction) {
      transaction.executeSql(query, bindings, function(transaction, result) {
        deferred.resolve(result);
      }, function(transaction, error) {
        deferred.reject(error);
      });
    });

    return deferred.promise;
  };

  self.fetchAll = function(result) {
    var output = [];

    for (var i = 0; i < result.rows.length; i++) {
      output.push(result.rows.item(i));
    }

    return output;
  };

  self.fetch = function(result) {
    return result.rows.item(0);
  };

  return self;
});