angular.module('starter.services', [])

.factory('Cache', function(){
  var cache = {};

  return {
    all : function(){
      return cache;
    },
    add : function(key, value){
      cache[key] = value;
    },
    remove : function(key){
      delete cache[key];
    },
    get : function(key){
      return cache[key];
    }
  }
})
.factory('Friends', function($rootScope, Sign, UTIL, UserDao, Cache) {
  // Might use a resource here that returns a JSON array
  var loginUserId;
  var scope;

  return {
    add: function(userIds, callback) {
      loginUserId = Sign.getUser().userId;
      $rootScope.xpush.addUserToGroup( loginUserId, userIds, function( err, data ){
        // Multi Add Friend
        UserDao.addFriend( userIds );
        callback( data );
      }); 
    },
    list : function(callback){
      UserDao.list( { 'friendFlag' : 'Y'} ).then( function ( result ){
        friends = {};
        for( var key in result ){
          Cache.add( result[key].user_id, { 'NM' : result[key].user_name, 'I': result[key].image });
        }

        callback( result );
      });
    },
    refresh : function(callback){
      var loginUserId = Sign.getUser().userId;

      $rootScope.xpush.getGroupUsers( loginUserId, function( err, users ){
        for( var inx = 0 ; inx < users.length ; inx++ ){              
          if( users[inx].userId != loginUserId ){
            var user = { 'userId' : users[inx].U, 'userName': users[inx].DT.NM, 
              'message' : users[inx].DT.MG, 'image': users[inx].DT.I, 'chosung' : UTIL.getChosung( users[inx].DT.NM ), 'friendFlag' : 'Y' };
            UserDao.add( user, true );
          }
        }
        callback( {'status':'ok'} );
      });
    }
  }
})
.factory('Users', function($rootScope, Sign, UserDao, UTIL, Cache) {
  var loginUserId;

  return {
    refresh : function(callback){

      loginUserId = Sign.getUser().userId;
     
      $rootScope.xpush.getUserList({}, function( err, userArray ){

        for( var inx = 0 ; inx < userArray.length ; inx++ ){
          var cUserId = userArray[inx].U;

          if( cUserId != loginUserId ){
            var user = { 'userId' : userArray[inx].U, 'userName': userArray[inx].DT.NM, 'image': userArray[inx].DT.I,
              'message' : userArray[inx].DT.MG, 'chosung' : UTIL.getChosung( userArray[inx].DT.NM ) };
            UserDao.add( user );
            Cache.add( userArray[inx].U, { 'NM' : userArray[inx].DT.NM, 'I': userArray[inx].DT.I } );
          }
        }

        UserDao.list( { 'friendFlag' : 'N'} ).then( function ( result ){
          callback( result );
        });
      });
    },
    list : function(callback){
      UserDao.list( { 'friendFlag' : 'N'} ).then( function ( result ){
        callback( result );
      });
    }
  }
})
.factory('Manager', function($http, $sce, $rootScope, Sign, ChannelDao, MessageDao, UTIL ) {
  var initFlag = false;
  return {
    init : function(callback){
      self = this;

      if( !initFlag ){
        self.channelList(function( channels ){
          self.unreadMessage( channels, function(result){

            ChannelDao.getAllCount().then( function ( result ){
              var loginUser = Sign.getUser();

              $rootScope.totalUnreadCount = result.total_count;

              $rootScope.xpush.on('message', function (ch,name,data) {
                data.MG = decodeURIComponent(data.MG);

                var sr = data.UO.U == loginUser.userId ? 'S':'R' ;
                if( data.T != undefined ){
                  data.type = data.T;
                  if( data.T == "I" ){
                    data.type = sr + data.T;
                  }
                } else {
                  data.type = sr;
                }

                if( ch == $rootScope.currentChannel ){
                  var latestDate = $rootScope.currentChannelLatestDate;
                  var dateStrs = UTIL.timeToString( data.TS );

                  if( latestDate != dateStrs[3] ){
                    var dateMessage = dateStrs[1]+" "+dateStrs[2];
                    $rootScope.currentScope.add( { content : content, type : 'T', date : dateStrs[1], message : dateMessage } );
                    latestDate = dateStrs[3];
                    $rootScope.currentChannelLatestDate = latestDate;
                  }

                  var nextMessage = { type : data.type, date : dateStrs[1], message : data.MG, name : data.UO.NM, image : data.UO.I, afterLoad : "true" };

                  // Add to DB
                  MessageDao.add( data );

                  // 2 people Channel

                  var param = { 'channel':data.C, 'reset' : true };
                  if( data.type.indexOf( 'I' ) > -1 ){
                    param.message = "@image@";
                  } else {
                    param.message = data.MG;
                  }

                  if( data.type == 'R' && data.C.indexOf( "$" ) > -1 ){
                    param.image = data.UO.I;
                  }

                  if( data.type != 'J' ){
                    ChannelDao.update( param );
                  }

                  $rootScope.currentScope.add( nextMessage );

                } else {
                  
                  $rootScope.xpush.getChannelData( data.C, function( err, channelJson ){
                    var channel = {'channel': data.C, 'users' : channelJson.DT.US};

                    if( data.T != undefined && data.T == 'I' ){
                      channel.message = "@image@";
                    } else {
                      channel.message = data.MG;
                    }

                    if( channelJson.DT.UC > 2 ){
                      channel.name = channelJson.DT.NM;
                      channel.image = '';
                    } else {
                      channel.name = data.UO.NM;
                      channel.image = data.UO.I;
                    }

                    // Add to DB
                    MessageDao.add( data );

                    $rootScope.totalUnreadCount++;

                    if( data.T != 'J' ){
                      ChannelDao.add( channel );
                    }

                    $rootScope.localNoti( { id : data.TS, message : data.MG, title : channel.name}, function(){
                      console.log( '========= local noti callback =========');
                    });   
                  });         
                }
              });

              initFlag = true;                       
            });
          });
        });
      }
    },
    channelList : function(callback){
      $rootScope.xpush.getChannels( function(err, channelArray){        
        var channels = {};
        for( var inx = 0 ; inx < channelArray.length ; inx++ ){
          var data = channelArray[inx];
          var channel = {'channel': data.channel };

          if( data.DT != undefined ){
            channel.users = data.DT.US;

            if( data.DT.UC > 2 ){
              channel.name = data.DT.NM;
            } else {
              channel.name = data.DT.F;
            }
          } else {
            channel.users = "";
            channel.name = "";
          }

          channels[ data.channel ] =  channel;
        }

        callback(channels);
      });
    },
    unreadMessage : function(channels, callback){
      var loginUser = Sign.getUser();

      $rootScope.xpush.getUnreadMessage( function(err, messageArray) {

        for( var inx = 0 ; inx < messageArray.length ; inx++ ){
          var data = messageArray[inx].MG.DT;
          data = JSON.parse(data);

          data.MG = decodeURIComponent( data.MG );
          var sr = data.UO.U == loginUser.userId ? 'S':'R';

          if( data.T != undefined ){
            data.type = data.T;
            if( data.T == "I" ){
              data.type = sr + data.T;
            }
          } else {
            data.type = sr;
          }

          var channel = channels[data.C];
          channel.message = data.MG;

          if( channel.users.length > 2 ){
            channel.name = channel.name;
            channel.image = '';
          } else {
            channel.name = data.UO.NM;
            channel.image = data.UO.I;
          }

          if( data.type != 'J' ){
            ChannelDao.add( channel );
          }
          MessageDao.add( data );
        }

        $rootScope.xpush.isExistUnread = false;
        callback({'status':'ok'});
      });
    }
  }
})
.factory('Sign', function($http, $state, $rootScope, BASE_URL) {
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
    logout : function(){

      // Clear login
      loginUser = {};
      $rootScope.loginUser = {};
      //$state.go('signin');
      $state.transitionTo('signin', {}, { reload: true, notify: true });
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
    update : function( params, callback ){
      $http.post("http://"+BASE_URL+":8000/user/update", params)
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
.factory('Chat', function($http, $compile, $rootScope, BASE_URL, ChannelDao, MessageDao, UTIL, Cache ) {
  var channelSocket;
  var CONF = {};
  var self;

  return {
   init : function( params, loginUser, inviteMessage, $scope, callback ){
      self = this;

      var latestDate;

      CONF._app = params.app;
      CONF._channel = params.channel;
      CONF._user = { U : loginUser.userId, NM : loginUser.userName, I : loginUser.image };

      $rootScope.currentChannel = params.channel;

      if( inviteMessage == '' ){
        var latestMessage = '';

        /*
        *Reset Count Start
        */      
        var param = { 'channel' :  params.channel, 'reset' : true, 'message': latestMessage };
        ChannelDao.update( param );

        /*
        *Reset Count End
        */
        var messages = [];
        MessageDao.list( params.channel ).then(function(messageArray) {

          for( var inx = 0 ; inx < messageArray.length ; inx++ ){
            var data = messageArray[inx];
            var dateStrs = UTIL.timeToString( data.time );

            if( inx > 0 ){
              latestDate =  UTIL.timeToString( messageArray[inx-1].time )[3];
            }

            if( latestDate != dateStrs[3] ){
              var dateMessage = dateStrs[1]+" "+dateStrs[2];
              messages.push( { content : content, type : 'T', date : dateStrs[1], message : dateMessage } );
              latestDate = dateStrs[3];
            }

            messages.push( { type : data.type, date : dateStrs[1], message : data.message, name : data.sender_name, image : Cache.get( data.sender_id ).I } );
          }

          $rootScope.currentChannelLatestDate = latestDate;

          callback(messages);
        });
      } else {
        self.send( inviteMessage, 'J' );
      }
    },
    send : function(msg, type){
      var DT = {UO:CONF._user,MG:encodeURIComponent(msg),S : CONF._user.U};

      if( type !=undefined ){
        DT.T = type;
      }

      $rootScope.xpush.send(CONF._channel, 'message', DT );
    },
    join : function(param, callback){
      channelSocket.emit('join', param, function (data) {
        callback( data );
      });
    },
    exit : function(){
      channelSocket.disconnect();
    }
  }
})
.factory('UTIL', function(Cache, Sign){
  var cho = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  return {          
    getUniqueKey : function () {
      var s = [], itoh = '0123456789ABCDEF';
      for (var i = 0; i < 36; i++) s[i] = Math.floor(Math.random()*0x10);
      s[14] = 4;
      s[19] = (s[19] & 0x3) | 0x8;

      for (var x = 0; x < 36; x++) s[x] = itoh[s[x]];
      s[8] = s[13] = s[18] = s[23] = '-';

      return s.join('');
    },
    timeToString : function( timestamp ){
      var cDate = new Date();

      var cYyyymmdd = cDate.getFullYear()+""+(cDate.getMonth()+1)+""+cDate.getDate();
      var date = new Date( timestamp );

      var yyyy = date.getFullYear();
      var mm = date.getMonth()+1;
      var dd = date.getDate();

      var hour = date.getHours();
      hour = hour >= 10 ? hour : "0"+hour;

      var minute = date.getMinutes();
      minute = minute >= 10 ? ""+minute : "0"+minute;

      var yyyymmdd = yyyy + "" + mm + ""+ dd;

      var result = [];
      if ( cYyyymmdd != yyyymmdd  ) {
        result.push( yyyy + "." + mm + "."+ dd );
      } else {
        result.push( hour + ":" + minute );
      }

      result.push( yyyy + "." + mm + "."+ dd );
      result.push( hour + ":" + minute );
      result.push( yyyy+mm+dd+hour+minute.charAt(0) );

      return result;
    },
    getChosung : function(str) {
      result = "";
      for(i=0;i<str.length;i++) {
        code = str.charCodeAt(i)-44032;
        if(code>-1 && code<11172) result += cho[Math.floor(code/588)];
      }
      return result;      
    },
    getMorphemes : function(str){

      var choArray = Array(
      'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ',
      'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ',
      'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ' );

      var jungArray = Array(
      'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ',
      'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ',
      'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ',
      'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ' );

      var jongArray = Array(
      '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ',
      'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ',
      'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ' );

      var result = "";
      for( var inx =0 ; inx < str.length ; inx++ ){
        var ch = str.charAt(inx);
        
        if (ch.search(/[^a-zA-Z]+/) === -1) {
          result += ch;
          continue;
        } else if( choArray.indexOf( ch ) > -1 ){
          result += ch;
          continue;
        }

        var code = str.charCodeAt(inx);
        var uniValue = code - 0xAC00;

        var jong = uniValue % 28;
        var jung = ( ( uniValue - jong ) / 28 ) % 21;
        var cho = parseInt (( ( uniValue - jong ) / 28 ) / 21);

        result += choArray[cho]+jungArray[jung]+jongArray[jong];
      }

      return result;
    },
    getInviteMessage: function(userArray){
      var loginUser = Sign.getUser();
      var result = '';

      var users = angular.copy( userArray );

      if( users.indexOf(loginUser.userId) > -1 ){
        users.splice( users.indexOf(loginUser.userId), 1 );
      }

      result = loginUser.userName+" invite ";
      for( var jnx = 0 ; jnx < users.length ; jnx++ ){
        result += Cache.get( users[jnx] ).NM;

        if( jnx != users.length - 1 ){
          result += ",";
        }
      }

      return result;
    },
    getNames : function( userIds ){
      var loginUserId = Sign.getUser().userId;
      var loginUserName = Sign.getUser().userName;
      var result;      
      var userNames = [];

      var userArray = angular.copy( userIds );

      var friends = Cache.all();

      // Room with 2 people
      if( userArray.length == 2 && userArray.indexOf( loginUserId ) > -1 ){
        userArray.splice( userArray.indexOf( loginUserId ), 1 );

        var name = userArray[0];
        if( friends[ userArray[0] ] != undefined ){
          name = friends[ userArray[0] ].NM;
        }

        userNames.push( name );
      } else {

        for( var inx = 0 ; inx < userArray.length ; inx++ ){
          var name = userArray[inx];
          if( userArray[inx] == loginUserId ){
            name = loginUserName;
          }else if( friends[ userArray[inx] ] != undefined ){
            name = friends[ userArray[inx] ].NM;
          }

          userNames.push( name );
        }
      }

      return userNames.join(",");
    }       
  }
});