angular.module('starter.services', [])

/**
 * A simple example service that returns some data.
 */
.factory('Friends', function(SocketManager, Sign) {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var friends = [];
  var friendNames = [];
  var loginUserId = Sign.getUser().userId;

  return {
    all: function() {
      return friends;
    },
    add: function(userIds, callback) {
      SocketManager.get( function( socket ){
        socket.emit( 'group-add', {'userIds':userIds, 'groupId' : loginUserId}, function( data ){
          callback( data );
        });
      });      
    },    
    get: function(friendId) {
      // Simple index lookup
      return friends[friendId];
    },
    list : function(callback){
      
      SocketManager.get( function( socket ){        
        socket.emit( 'group-list', {'groupId':loginUserId}, function( data ){
          console.log( 'group-list' );
          if( data.status == 'ok' ){
            var users = data.result;
            var jnx = 0;
            for( var inx = 0 ; inx < users.length ; inx++ ){              
              if( users[inx].userId != loginUserId ){
                if( friendNames.indexOf( users[inx].userId ) < 0 ){
                  friendNames.push( users[inx].userId );
                  friends.push( { 'id' : jnx++, uid : users[inx].userId, name: users[inx].userId } );
                }
              }
            }

            console.log( "===friends====" );
            console.log( friends );
            callback( friends );
          }
        });
      });
    }
  }
})
.factory('Users', function(SocketManager, Sign) {
  // Might use a resource here that returns a JSON array
  var loginUserId = Sign.getUser().userId;

  // Some fake testing data
  var users = [];
  var userIds = [];

  return {
    all: function() {
      return users;
    },
    get: function(userId) {
      // Simple index lookup
      return users[userId];
    },
    list : function(callback){

      SocketManager.get( function( socket ){        
        socket.emit( 'user-list', {}, function( data ){
          console.log( 'user-list' );
          console.log( data );
          if( data.status == 'ok' ){
            var userArray = data.result;
            var jnx = 0;
            for( var inx = 0 ; inx < userArray.length ; inx++ ){              
              var tmpUserId = userArray[inx].userId;
              if( tmpUserId != loginUserId ){
                if( userIds.indexOf( tmpUserId ) < 0 ){
                  userIds.push( tmpUserId );
                  users.push( { 'id' : jnx++, uid : tmpUserId, name: tmpUserId } );
                }
              }
            }

            console.log( users );
            callback( users );
          }
        });
      });
    }
  }
})
.factory('Channels', function(DB, UTIL, APP_INFO) {
  // Might use a resource here that returns a JSON array
  var scope;

  return {
    get : function( channelId ){
      return DB.query(
        'SELECT channel_id, channel_name, channel_users, unread_count FROM TB_CHANNEL where channel_id = ? ', [channelId]
      ).then(function(result) {
          return DB.fetch(result);
        });
    },
    list : function( $scope ){
      scope = $scope;

      return DB.query(
        'SELECT channel_id, channel_name, channel_users, unread_count FROM TB_CHANNEL ORDER BY channel_updated DESC'
      ).then(function(result) {
          return DB.fetchAll(result);
        });
    },
    add : function(jsonObj){
      console.log( "add ");
      console.log( jsonObj );

      var channelId = '';

      var query =
        "INSERT OR REPLACE INTO TB_CHANNEL "+
        "(channel_id, channel_name, channel_users, unread_count, channel_updated) VALUES "+
        "(?, ?, ?, ?, ?)";

      var cond = [
        jsonObj.channel,
        jsonObj.name,
        jsonObj.channel_users,
        1,
        Date.now()
      ];

      if( scope != undefined ){
        var channel = {'channel_id':jsonObj.channel,'channel_name':jsonObj.name,'unread_count':1};

        var dupFlag = false;
        for( var inx = 0; !dupFlag && inx < scope.channels.length ; inx++){
          if( scope.channels[inx].channelId == channel.channelId ){
            dupFlag = true;
          }
        }

        if( !dupFlag ){
          console.log( channel );
          scope.channels.push(angular.extend({}, channel));
          scope.$apply();
        }
      }

      return DB.query(query, cond).then(function(result) {
        return result;
      });
    },
    generateId : function(jsonObj){
      var channelId;
      if( jsonObj.channel_users.length > 2 ){
        channelId = UTIL.getUniqueKey()+"^"+APP_INFO.appKey;;
      } else {
        jsonObj.channel_users.sort();
        channelId = jsonObj.channel_users.join( "$" )+"^"+APP_INFO.appKey;
      }
      return channelId;
    }
  }
})
.factory('Messages', function(DB) {
  // Might use a resource here that returns a JSON array
  var scope;

  return {
    list : function( $scope, channel ){
      scope = $scopeji
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

          var channel = {'channel': data.channel, 'name': data.user.id };
          if( data.channel.indexOf( "$" ) > -1 ){
            data.channel_users = data.channel.split( "^" )[0].split( "$" ).join( "," );
          }

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
            var unreadMessages = jsonObj.result;

            var messages = [];
            for( var inx = 0 ; inx < unreadMessages.length ; inx++ ){
              var data = JSON.parse( unreadMessages[inx].message.data );
              var content;
              content = '<div class="small">'+data.user.id+'</div>' ;
              content = content + '<img src="'+data.user.image+'" class="profile"/>';
              content = content + '<span class="from">'+decodeURIComponent( data.message )+'</span>' ;
              messages.push( { content : content, from : 'you' } );
            }

            //message received complete
            if( unreadMessages != undefined && unreadMessages.length > 0 ){
              channelSocket.emit("message-received");
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

          data.message = decodeURIComponent(data.message);          
          var from = data.user.id == loginUser.userId ? 'me': 'you' ;

          var content;
          if(from == 'you'){
            data.sender = data.user.id;
            data.picture = data.user.image;

            content = '<div class="small">'+data.sender+'</div>' ;
            content = content + '<img src="'+data.picture+'" class="profile"/>';
            content = content + '<span class="from">'+data.message+'</span>' ;
            
          } else {
            content = '<span>'+data.message+'</span>' 
          }

          var nextMessage = { content : content, from : from };
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
    },
    join : function( users, callback){
      channelSocket.emit('join', users, function (data) {
        callback( data );
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

      var query = 'DROP TABLE ' + table.name;
      self.query(query);

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
})
.factory('UTIL', function(){
  return {
    getUniqueKey : function () {
      var s = [], itoh = '0123456789ABCDEF';
      for (var i = 0; i < 36; i++) s[i] = Math.floor(Math.random()*0x10);
      s[14] = 4;
      s[19] = (s[19] & 0x3) | 0x8;

      for (var x = 0; x < 36; x++) s[x] = itoh[s[x]];
      s[8] = s[13] = s[18] = s[23] = '-';

      return s.join('');
    }
  }
});