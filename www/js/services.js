angular.module('starter.services', [])

/**
 * @ngdoc factory
 * @name Cache
 * @module starter.services
 * @kind factory
 *
 * @description Manage cache for image and userName
 */
.factory('Cache', function(){
  var cache = {};

  return {
    /**update
     * @ngdoc function
     * @name all
     * @module starter.services
     * @kind function
     *
     * @description return cache object
     * @returns {Object} cache object
     */
    all : function(){
      return cache;
    },

    /**
     * @ngdoc function
     * @name add
     * @module starter.services
     * @kind function
     *
     * @description add cache object
     * @param {string} HashKey userId
     * @param {Object} JSON Object. image and user name {'I' : image, 'NM' : userName }
     */
    add : function(key, value){
      cache[key] = value;
    },

    /**
     * @ngdoc function
     * @name remove
     * @module starter.services
     * @kind function
     *
     * @description remove cache object
     * @param {string} HashKey userId
     */
    remove : function(key){
      delete cache[key];
    },

    /**
     * @ngdoc function
     * @name remove
     * @module starter.services
     * @kind function
     *
     * @description get cache object by userId
     * @param {string} HashKey userId
     * @return {Object} JSON Object. image and user name {'I' : image, 'NM' : userName }
     */
    get : function(key){
      if( cache[key] ){
        return cache[key];
      } else {
        return {'I' : '', 'NM' : key };
      }
    },

    /**
     * @ngdoc function
     * @name set
     * @module starter.services
     * @kind function
     *
     * @description set entire cache object
     * @param {Object} cache object
     */
    set : function( map ){
      cache = map;
    },

    /**
     * @ngdoc function
     * @name has
     * @module starter.services
     * @kind function
     *
     * @description set entire cache object
     * @param {boolean}
     */
    has : function( key ){
      if( cache[key] ){
        return true;
      } else {
        return false;
      }
    }
  };
})
.factory('Friends', function($rootScope, Sign, UTIL, UserDao, Cache) {
  var loginUserId;

  return {
    /**
     * @ngdoc function
     * @name add
     * @module starter.services
     * @kind function
     *
     * @description Save friends into server
     * @param {array} JSONArray that is consist of a number of userId
     * @param {function} callback function that be called after save success
     */
    add: function(userIds, callback) {
      loginUserId = Sign.getUser().userId;
      $rootScope.xpush.addUserToGroup( loginUserId, userIds, function( err, data ){
        callback( data );
      });
    },

    /**
     * @ngdoc function
     * @name remove
     * @module starter.services
     * @kind function
     *
     * @description Remove a friend from buddy list
     * @param {string} userId
     * @param {function} callback function that be called after save success
     */
    remove: function(userId, callback) {
      loginUserId = Sign.getUser().userId;
      $rootScope.xpush.removeUserFromGroup( loginUserId, userId, function( err, data ){
        UserDao.remove(userId);
        callback( data );
      });
    },

    /**
     * @ngdoc function
     * @name getRefreshHistory
     * @module starter.services
     * @kind function
     *
     * @description Retrieve refresh history from local DB
     * @param {function} callback function that be called after retrieve
     */
    getRefreshHistory : function(callback){
      UserDao.getRefreshHistory().then( function ( result ){
        callback( result );
      });
    },

    /**
     * @ngdoc function
     * @name list
     * @module starter.services
     * @kind function
     *
     * @description Retrieve friend list from local DB and save info Cache
     * @param {function} callback function that be called after success
     */
    list : function(callback){
      UserDao.list().then( function ( result ){

        // foreach
        for( var key in result ){
          if( result[key].user_id != undefined ){

            // Save info cache
            Cache.add( result[key].user_id, { 'NM' : result[key].user_name, 'I': result[key].image });
          }
        }

        callback( result );
      });
    },

    /**
     * @ngdoc function
     * @name refresh
     * @module starter.services
     * @kind function
     *
     * @description Retrieve friends from server and save into local DB
     * @param {function} callback function that be called after success
     */
    refresh : function(callback){
      var loginUserId = Sign.getUser().userId;
      $rootScope.xpush.getGroupUsers( loginUserId, function( err, users ){

        // Users : JSONArray from server
        UserDao.addAll( users, function( result ){
          UserDao.updateRefreshHistory();
          callback( {'status':'ok'} );
        });
      });
    }
  };
})
.factory('Users', function($rootScope, Sign, UserDao, UTIL, Cache) {

  return {

    /**
     * @ngdoc function
     * @name lish
     * @module starter.services
     * @kind function
     *
     * @description Retrieve users from server
     * @param {function} callback function that be called after retrieve
     */
    list : function(callback){
      UserDao.list().then( function ( result ){
        callback( result );
      });
    },

    /**
     * @ngdoc function
     * @name search
     * @module starter.services
     * @kind function
     *
     * @description Retrieve friend list from server
     * @param {string}
     * @param {integer}
     * @param {function} callback function that be called after success
     */
    search : function(_q, pageNumber, callback){

      var params = {
        query : _q,
        column: { U: 1, DT: 1, _id: 0 },
        options: {
          skipCount : true,
          sortBy : { 'DT.NM': 1}
        }
      };

      if( pageNumber > -1 ){
        angular.extend( params.options, { pageNum : 1,pageSize: 50 } );
      }

      if(pageNumber > 0) {
        params.options['pageNum'] = pageNumber;
      }

      $rootScope.xpush.queryUser(params, function( err, userArray, count){
        callback( userArray );
      });
    }
  };
})
.factory('Manager', function($http, $sce, $rootScope, Sign, ChannelDao, MessageDao, NoticeDao, UTIL ) {
  var _initFlag = false;
  return {

    /**
     * @ngdoc function
     * @name init
     * @module starter.services
     * @kind function
     *
     * @description Initialize this application's singleton object
     * @param {function} callback function that be called after success
     */
    init : function(callback){
      var self = this;
      if( !_initFlag ){
        // Get channel list from server
        self.channelList(function( channels ){

          // Get unread message list from server
          self.unreadMessage( channels, function(result){

            // get unread message count form local DB
            ChannelDao.getAllCount().then( function ( result ){
              // Set unread message count into rootScope
              $rootScope.totalUnreadCount = result.total_count;

              //Add Event
              self.addEvent();
              _initFlag = true;
            });
          });
        });
      }
    },
    addEvent : function(){
      var self = this;

      $rootScope.$on("ON_POPUP_OPEN", function (data, args) {
        if( $rootScope.refreshChannel ){
          $rootScope.refreshChannel();
        }
      });

      $rootScope.$on("ON_LOGOUT", function (data, args) {
        _initFlag = false;
        $rootScope.xpush.clearEvent();
      });

      var loginUser = Sign.getUser();
      var startTime = 0;
      var endTime = 0;

      $rootScope.xpush.on('system', function (ch,name,data) {

        // compare sender's userId to logined UserId. send or receive
        var sr = data.UO.U == loginUser.userId ? 'S':'R' ;

        // compare current channel id to received message's channel id
        var currentChannel = $rootScope.xpush.getChannel( ch );
        if( currentChannel != undefined && currentChannel._connected && sr == 'R') {

          if( $rootScope.currentScope ){
            $rootScope.currentScope.setOnlineStatus( data.MG );
          }
        }
      });

      $rootScope.xpush.on('message', function (ch,name,data) {
        data.MG = decodeURIComponent(data.MG);

        // compare sender's userId to logined UserId. send or receive
        var sr = data.UO.U == loginUser.userId ? 'S':'R' ;

        // Join message not need to compare send or receive
        if( data.T == 'J' ){
          data.type = data.T;
        } else if( data.T != undefined){
          data.type = sr + data.T;
        } else {
          data.type = sr;
        }

        if( sr == 'R' ){
          try {
            var element = angular.element( window.document.getElementById( 'navBar' ) );

            element.addClass( "blink_me" );
            startTime = Date.now();

            var clearBlink = setInterval( function(){
              endTime = Date.now();
              if( endTime - startTime > 5000 ){
                element.removeClass( "blink_me" );
                clearInterval( clearBlink );
              }
            }, 5000 );
          } catch( err ){
            console.log( err );
          }
        }

        // compare current channel id to received message's channel id
        var currentChannel = $rootScope.xpush.getChannel( ch );
        if( ( $rootScope.usePopupFlag && currentChannel != undefined && currentChannel._connected )
          || ( !$rootScope.usePopupFlag && ch === $rootScope.currentChannel ) ) {

          if( data.T == 'N' ){



            var MG = data.MG.split('^')[0];
            var LC = data.MG.split('^')[1];
            data.MG = MG;
            data.LC = LC;


            NoticeDao.add( data );
            if( $rootScope.currentScope ){
              var dateStrs = UTIL.timeToString( data.TS );
              var dateMessage = dateStrs[1]+" "+dateStrs[2];
              var noticeMessage = { date : dateMessage, message : data.MG, location : data.LC, name : data.UO.NM, image : data.UO.I, useFlag : 'Y', foldFlag : 'N',
                Y_US : [], N_US : [] };
              $rootScope.currentScope.setNotice( noticeMessage, true );
            }
            return;
          }

          var latestDate = $rootScope.currentChannelLatestDate;

          /**
          * time stamp to date array
          * dateStrs[0] : message's time( yyyy.mm.dd )
          * dateStrs[1] : message's time( hh:min )
          * dateStrs[2] : message's time( yyyy.mm.dd hh:min )
          * dateStrs[3] : message's time( yyyymmddhhm )
          */
          var dateStrs = UTIL.timeToString( data.TS );

          // if lastest date differ 10 minute and current channel's chatting is activated, show time message
          if( latestDate != dateStrs[3] && $rootScope.currentScope ){
            var dateMessage = dateStrs[1]+" "+dateStrs[2];
            $rootScope.currentScope.add( { type : 'T', date : dateStrs[1], message : dateMessage } );
            latestDate = dateStrs[3];
            $rootScope.currentChannelLatestDate = latestDate;
          }

          var nextMessage = { type : data.type, date : dateStrs[1], message : data.MG, name : data.UO.NM, image : data.UO.I, senderId : data.UO.U, timestamp : data.TS, active : "true", bookmarkFlag : 'N' };

          // Add to local DB
          MessageDao.add( data );

          //  Update channel info
          var param = { 'channel':data.C, 'reset' : true };
          if( data.T == 'I' ){
            param.message = "@image@";
          } else if( data.T == 'E' ){
            param.message = "@emoticon@";
          } else if ( data.T == 'VI' || data.T == 'V' ) {
            param.message = "@video@";
          } else {
            param.message = data.MG;

            // Use TTS
            if( $rootScope.currentScope && $rootScope.currentScope.toggles.useTTS && window.speechSynthesis ){
              var u = new SpeechSynthesisUtterance();
              u.text = data.MG;
              u.lang = 'ko-KR';
              window.speechSynthesis.speak(u);
            }
          }

          // 1:1 Channel, update image
          if( data.type == 'R' && data.C.indexOf( "$" ) > -1 ){
            param.image = data.UO.I;
          }

          // Join message is not need to update channel info
          if( data.type != 'J' ){
            ChannelDao.update( param );
          }

          // If current channel's chatting is activated, show received message
          if( $rootScope.currentScope ){
            $rootScope.currentScope.add( nextMessage );
          }

        } else {

          if( data.T == 'N' ){
            NoticeDao.add( data );
            return;
          }

          // differ from current channel, get channel data
          $rootScope.xpush.getChannelData( data.C, function( err, channelJson ){
            var channel = {'channel': data.C, 'users' : channelJson.DT.US};

            //  Update channel info
            if( data.T == 'I' ){
              channel.message = "@image@";
            } else if( data.T == 'E' ){
              channel.message = "@emoticon@";
            } else if ( data.T == 'VI' || data.T == 'V' ) {
              channel.message = "@video@";
            } else {
              channel.message = data.MG;
            }

            // multi user channel : not need to update channel info
            if( channelJson.DT.UC > 2 ){
              channel.name = channelJson.DT.NM;
              channel.image = '';

            // 1:1 channel : update channel image and channel name
            } else if( channelJson.DT.UC == 2 ){
              channel.name = data.UO.NM;
              channel.image = data.UO.I;
            }

            // Add to local DB
            MessageDao.add( data );

            // Increase rootScope's unread count
            $rootScope.totalUnreadCount++;

            if( data.T != 'J' && channelJson.DT.UC >= 2 ){
              ChannelDao.add( channel );
            }
          });
        }
      });
    },

    /**
     * @ngdoc function
     * @name channelList
     * @module starter.services
     * @kind function
     *
     * @description Retrieve channel list from server
     * @param {function} callback function that be called after success
     */
    channelList : function(callback){
      $rootScope.xpush.getChannels( function(err, channelArray){
        var channels = {};

        // foreach channelArray channelInfo
        for( var inx = 0, until = channelArray.length ; inx < until ; inx++ ){
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

          // Pass self channel
          if( data.DT != undefined && data.DT.UC > 1 ){
            channels[ data.channel ] =  channel;
          }
        }

        callback(channels);
      });
    },

    /**
     * @ngdoc function
     * @name unreadMessage
     * @module starter.services
     * @kind function
     *
     * @description Retrieve unread message list from server
     * @param {Array} JSONArray of channel info JSONObject
     * @param {function} callback function that be called after success
     */
    unreadMessage : function(channels, callback){
      var loginUser = Sign.getUser();

      $rootScope.xpush.getUnreadMessage( function(err, messageArray) {

        for( var inx = 0 ; inx < messageArray.length ; inx++ ){

          var messageObject = messageArray[inx];

          if( messageObject.NM != 'message' ){
            continue;
          }

          var data = messageObject.MG.DT;
          data = JSON.parse(data);
          data.MG = decodeURIComponent( data.MG );

          // Save notice
          if( data.T == 'N' ){
            if( data.MG.indexOf( "^" ) > -1 ){
              var MG = data.MG.split('^')[0];
              var LC = data.MG.split('^')[1];
              data.MG = MG;
              data.LC = LC;
            }          
            NoticeDao.add( data );
            continue;
          }  

          var sr = data.UO.U == loginUser.userId ? 'S':'R';

          if( data.T == 'J' ){
            data.type = data.T;
          } else if( data.T != undefined){
            data.type = sr + data.T;
          } else {
            data.type = sr;
          }

          var channel = channels[data.C];

          if( data.T == 'I' ){
            channel.message = "@image@";
          } else if( data.T == 'E' ){
            channel.message = "@emoticon@";
          } else if ( data.T == 'VI' || data.T == 'V' ) {
            channel.message = "@video@";
          } else {
            channel.message = data.MG;
          }

          if( channel.users.length > 2 ){
            channel.name = channel.name;
            channel.image = '';
          } else {
            channel.name = data.UO.NM;
            channel.image = data.UO.I;
          }

          channel.updated = data.TS;

          if( data.type != 'J' ){
            ChannelDao.add( channel );
          }
          MessageDao.add( data );
        }

        callback({'status':'ok'});
      });
    }
  };
})
.factory('Sign', function($http, $state, $rootScope, $localStorage, BASE_URL) {
  var loginUser;

  return {
    /**
     * @ngdoc function
     * @name logout
     * @module starter.services
     * @kind function
     *
     * @description Clear login info and go to login page
     */
    logout : function( callback ){
      loginUser = undefined;
      delete $localStorage.loginUser;
      $rootScope.loginUser = {};
      $rootScope.currentChannel = '';
      $rootScope.totalUnreadCount = 0;

      if ( callback && typeof callback === 'function') {
        callback();
      }
    },
    /**
     * @ngdoc functionf
     * @name register
     * @module starter.services
     * @kind function
     *
     * @description Call REST API for register user
     * @param {Object} userInfo for register
     * @param {function} callback function that be called after success
     */
    register : function( params, callback ){
      $http.post(BASE_URL+"/user/register", params)
      .success(function(data) {
        callback( data );
      })
      .error(function(data, status, headers, config) {
      });
    },
    /**
     * @ngdoc function
     * @name update
     * @module starter.services
     * @kind function
     *
     * @description Call REST API for update user
     * @param {Object} userInfo for update
     * @param {function} callback function that be called after success
     */
    update : function( params, callback ){
      $http.post(BASE_URL+"/user/update", params)
      .success(function(data) {
        callback( data );
      })
      .error(function(data, status, headers, config) {
      });
    },
    /**
     * @ngdoc function
     * @name setUser
     * @module starter.services
     * @kind function
     *
     * @description ser userInfo into session
     * @param {Object} userInfo
     */
    setUser : function( user ){
      loginUser = user;
      $localStorage.loginUser = user;
    },
    /**
     * @ngdoc function
     * @name getUser
     * @module starter.services
     * @kind function
     *
     * @description return logined user
     * @return {Object} userInfo
     */
    getUser : function(){
      return loginUser;
    }
  }
})
.factory('Chat', function($http, $compile, $rootScope, BASE_URL, ChannelDao, MessageDao, UTIL, Cache, Sign ) {

  var CONF = {};
  var self;

  return {

    /**
     * @ngdoc function
     * @name init
     * @module starter.services
     * @kind function
     *
     * @description return logined user
     * @param {Object} userInfo
     * @param {string} invite message
     * @param {Object} current scope
     * @param {function} callback function that be called after success
     */
    init : function( params, inviteMessage, $scope, callback ){
      self = this;

      var loginUser = Sign.getUser();

      CONF._app = params.app;
      CONF._channel = params.channel;
      CONF._user = { U : loginUser.userId, NM : loginUser.userName, I : loginUser.image };

      $rootScope.currentChannel = params.channel;

      if( inviteMessage == '' ){
        var latestMessage = '';

        // Reset channel's  unread count to zero and lastest message.
        var param = { 'channel' :  params.channel, 'reset' : true, 'message': latestMessage };
        ChannelDao.update( param );

        self.list( params, function( messages ){
          callback( messages );
        });

      } else {
        self.send( inviteMessage, 'J' );
        callback();
      }
    },

    list : function( params, callback ){
      var messages = [];

      var latestDate;

      // Get message list from local DB
      MessageDao.list( params ).then(function(messageArray) {

        for( var inx = 0 ; inx < messageArray.length ; inx++ ){
          var data = messageArray[inx];
          var dateStrs = UTIL.timeToString( data.time );

          // Get previous message's time yyyyMMddhhm
          if( inx > 0 ){
            latestDate =  UTIL.timeToString( messageArray[inx-1].time )[3];
          }

          // 10 minute
          if( latestDate !== dateStrs[3] ){
            var dateMessage = dateStrs[1]+" "+dateStrs[2];
            messages.push( { type : 'T', date : dateStrs[1], message : dateMessage } );
            latestDate = dateStrs[3];
          }
          messages.push( { type : data.type, date : dateStrs[1], message : data.message, name : data.sender_name,image : Cache.get( data.sender_id ).I,
                        senderId : data.sender_id, timestamp : data.time, active : "false", bookmarkFlag : data.bookmark_flag } );
        }

        $rootScope.currentChannelLatestDate = latestDate;
        callback(messages);
      });
    },

    /**
     * @ngdoc function
     * @name send
     * @module starter.services
     * @kind function
     *
     * @description Send message
     * @param {string} message
     * @param {string} messageType
     */
    send : function(msg, type){
      var DT = { UO : CONF._user, MG : encodeURIComponent(msg),  S : CONF._user.U };

      if( type !== undefined ){
        DT.T = type;
      }

      $rootScope.xpush.send(CONF._channel, 'message', DT );
    },

    /**
     * @ngdoc function
     * @name join
     * @module starter.services
     * @kind function
     *
     * @description Join channel
     * @param {string} channel id
     * @param {Object} channel info, US : channel users
     * @param {function} callback function that be called after success
     */
    join : function(channelId, param, callback){
      $rootScope.xpush.joinChannel( channelId, param, function (data) {
        callback( data );
      });
    },
    /**
     * @ngdoc function
     * @name send
     * @module starter.services
     * @kind function
     *
     * @description Send System Message
     * @param {string} message
     */
    sendSys : function(msg){
      if( CONF._user ) {
        var DT = { UO : CONF._user, MG : msg, S : CONF._user.U, 'T' : 'S' };
        $rootScope.xpush.send(CONF._channel, 'system', DT );      
      }
    },
    /**
     * @ngdoc function
     * @name send
     * @module starter.services
     * @kind function
     *
     * @description Send System Message
     * @param {string} message
     */
    updateMessage : function( param ){
      MessageDao.update( param );
    },
    /**
     * @ngdoc function
     * @name send
     * @module starter.services
     * @kind function
     *
     * @description Send System Message
     * @param {string} message
     */
    exitChannel : function( channel, callback){
      MessageDao.removeAll( channel ).then( function(){
        ChannelDao.remove( channel ).then( function(){
          callback();
        });
      });
    }
  };
})
.factory('Emoticons', function(EmoticonDao){
  var emoticons = {};

  return {
    /**
     * @ngdoc function
     * @name list
     * @module starter.services
     * @kind function
     *
     * @description Retreive emoticon from local DB
     * @param {Object} Search param
     * @param {function} callback function that be called after success
     */
    list : function( param, callback){
      EmoticonDao.list(param).then(function(emoticonArray) {
        var result = {};

        angular.forEach( emoticonArray, function( emoticon ){
          var group = emoticon.group_id;
          var tag = emoticon.tag;

          if( result[group] === undefined ){
            result[group] = { group : group, tag : tag, items : [] };
          }

          result[group].items.push( emoticon.image );
        });

        var superResult = [];
        for( var key in result ){
          var groups = result[key];
          var group = groups.group;
          var tag = groups.tag;

          var rr = { group : group, items : {}, metas : 0, tag : 'ion-android-hand', 'CN' : 'tab-item' };

          var jnx = 0;

          // Divide result by 4
          if( groups.items.length > 4 ){
            var newKey;
            while( groups.items.length > 4 ){
              var temp = groups.items.slice(0,4);
              newKey = key+jnx;

              rr.items[newKey] = temp;
              groups.items.splice( 0,4 );
              jnx++;
            }

            newKey = key+jnx;
            rr.items[newKey] = groups.items;
            rr.metas = jnx;
          } else {
            rr.items[key] = groups.items;
            rr.metas = 0;
          }

          superResult.push( rr );
        }

        emoticons = superResult;
        callback( superResult );
      });
    },

    /**
     * @ngdoc function
     * @name add
     * @module starter.services
     * @kind function
     *
     * @description Add emoticon into local DB and current Emoticon object
     * @param {Object} param
     * @param {Object} Search param
     */
    add : function (param,jsonObject) {

      // Add emoticon into local DB
      EmoticonDao.add( param );

      var k;
      var groupKey = param.group;

      if( jsonObject === undefined ){
        jsonObject.group = groupKey;
        jsonObject.metas = 0;
        jsonObject.items = {};
      }

      if( jsonObject.metas  === undefined ){
        jsonObject.metas = 0;
      }

      if( jsonObject.items === undefined ){
        jsonObject.items = {};
      }

      var groupInx = jsonObject.metas;

      if( groupInx !== 0 ){
        groupKey = groupKey + groupInx;
      }

      if( jsonObject.items[groupKey] === undefined ){
        jsonObject.items[groupKey] = [];
      }

      if( jsonObject.items[groupKey].length < 4 ){
        k = groupKey;
      } else {

        // Item count larger than 4. make new group key
        k = groupKey + (++groupInx);
        jsonObject.items[k] = [];
        jsonObject.metas = groupInx;
      }

      jsonObject.items[k].push( param.image );
    },
    all : function () {
      return emoticons;
    }
  };
})
.factory('UTIL', function(Cache, Sign){
  var cho = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  return {

    /**
     * @ngdoc function
     * @name getUniqueKey
     * @module starter.services
     * @kind function
     *
     * @description Generate uuid
     * @return {string} uuid that generated
     */
    getUniqueKey : function () {
      var s = [], itoh = '0123456789ABCDEF';
      for (var i = 0; i < 36; i++) s[i] = Math.floor(Math.random()*0x10);
      s[14] = 4;
      s[19] = (s[19] & 0x3) | 0x8;

      for (var x = 0; x < 36; x++) s[x] = itoh[s[x]];
      s[8] = s[13] = s[18] = s[23] = '-';

      return s.join('');
    },

    /**
     * @ngdoc function
     * @name timeToString
     * @module starter.services
     * @kind function
     *
     * @description Generate uuid
     * @return {long} timestamp
     * @return {Array} [ yyyy.mm.dd | hh:min, yyyy.mm.dd, hh:min, yyyymmddhhm]
     */
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

    /**
     * @ngdoc function
     * @name getChosung
     * @module starter.services
     * @kind function
     *
     * @description Get chosung for Korean character
     * @param {string} userName
     * @return {string} chosung
     */
    getChosung : function(str) {
      var result = "";
      for(var i=0,n=str.length;i<n;i++) {
        var code = str.charCodeAt(i)-44032;
        if(code>-1 && code<11172) result += cho[Math.floor(code/588)];
      }
      return result;
    },

    /**
     * @ngdoc function
     * @name getChosung
     * @module starter.services
     * @kind function
     *
     * @description Get morphemes for Korean character
     * @param {string} userName
     * @return {string} chosung
     */
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
      for( var inx =0, until = str.length ; inx < until ; inx++ ){
        var ch = str.charAt(inx);

        // if Alphabet, set the character
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

    /**
     * @ngdoc function
     * @name getChosung
     * @module starter.services
     * @kind function
     *
     * @description Get morphemes for Korean character
     * @param {string} userName
     * @return {string} chosung
     */
    getInviteMessage: function(userArray){
      var loginUser = Sign.getUser();
      var result = '';

      var users = angular.copy( userArray );

      if( users.indexOf(loginUser.userId) > -1 ){
        users.splice( users.indexOf(loginUser.userId), 1 );
      }

      result = loginUser.userName+" invite ";
      for( var jnx = 0, until = users.length ; jnx < until ; jnx++ ){
        result += Cache.get( users[jnx] ).NM;

        if( jnx != users.length - 1 ){
          result += ",";
        }
      }

      return result;
    },

    /**
     * @ngdoc function
     * @name getNames
     * @module starter.services
     * @kind function
     *
     * @description Get channelName by channelUser
     * @param {string} userName
     * @return {string} chosung
     */
    getNames : function( userIds ){
      var loginUserId = Sign.getUser().userId;
      var loginUserName = Sign.getUser().userName;
      var userNames = [];

      var userArray = angular.copy( userIds );

      // Get friends cache
      var friends = Cache.all();

      // Room with 2 people
      if( userArray.length === 2 && userArray.indexOf( loginUserId ) > -1 ){

        // Remove loginUserId from userArray
        userArray.splice( userArray.indexOf( loginUserId ), 1 );

        var name = userArray[0];
        if( friends[ userArray[0] ] !== undefined ){
          name = friends[ userArray[0] ].NM;
        }

        userNames.push( name );
      } else {

        for( var inx = 0, until = userArray.length ; inx < until ; inx++ ){
          var name = userArray[inx];
          if( userArray[inx] === loginUserId ){
            name = loginUserName;
          }else if( friends[ userArray[inx] ] !== undefined ){
            name = friends[ userArray[inx] ].NM;
          }

          userNames.push( name );
        }
      }

      return userNames.join(",");
    },

    /**
     * @ngdoc function
     * @name getType
     * @module starter.services
     * @kind function
     *
     * @description Get file type from DOM object
     * @param {Object} file DOM object
     * @return {string} file type
     */
    getType : function( fileUrl ){
      var images = ['bmp','jpeg','jpg','png'];
      var movies = ['mp4','avi','asf','mov'];
      var filename = fileUrl;
      var ext = filename.substr( filename.lastIndexOf('.')+1 );

      var result = "";
      if( images.indexOf( ext.toLowerCase() ) > -1 ){
        result = "image";
      } else if( movies.indexOf( ext.toLowerCase() ) > -1){
        result = "video";
      }

      return result;
    }
  };
});
