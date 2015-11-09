angular.module('messengerx.services', [])

/**
 * @ngdoc factory
 * @name Cache
 * @module messengerx.services
 * @kind factory
 *
 * @description Manage cache for image and userName
 * user image 와 user name을 userId 로 관리한다.
 */
.factory('Cache', function(){
  var cache = {};

  return {
    /**update
     * @ngdoc function
     * @name all
     * @module messengerx.services
     * @kind function
     *
     * @description return cache object
     * @returns {object} cache object
     */
    all : function(){
      return cache;
    },

    /**
     * @ngdoc function
     * @name add
     * @module messengerx.services
     * @kind function
     *
     * @description add cache object
     * @param {string} HashKey userId
     * @param {object} JSON Object. image and user name {'I' : image, 'NM' : userName }
     */
    add : function(key, value){
      cache[key] = value;
    },

    /**
     * @ngdoc function
     * @name remove
     * @module messengerx.services
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
     * @module messengerx.services
     * @kind function
     *
     * @description get cache object by userId
     * @param {string} HashKey userId
     * @return {object} JSON Object. image and user name {'I' : image, 'NM' : userName }
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
     * @module messengerx.services
     * @kind function
     *
     * @description set entire cache object
     * @param {object} cache object
     */
    set : function( map ){
      cache = map;
    },

    /**
     * @ngdoc function
     * @name has
     * @module messengerx.services
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
     * @module messengerx.services
     * @kind function
     *
     * @description Save friends into server
     * userId array를 인자로 받아서 친구로 등록한다.
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
     * @module messengerx.services
     * @kind function
     *
     * @description Remove a friend from buddy list
     * userId를 인자로 받아서 친구에서 삭제한다.
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
     * @module messengerx.services
     * @kind function
     *
     * @description Retrieve refresh history from local DB
     * 최근에 동기화를 한 history를 조회한다.
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
     * @module messengerx.services
     * @kind function
     *
     * @description Retrieve friend list from local DB and save info Cache
     * 친구 list 를 조회하고, cache에 name 과 image를 담는다.
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
     * @module messengerx.services
     * @kind function
     *
     * @description Retrieve friends from server and save into local DB
     * 친구 list 를 조회하고, cache에 name 과 image를 담는다.
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
     * @module messengerx.services
     * @kind function
     *
     * @description Retrieve users from server
     * user list 를 server에서 조회한다.
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
     * @module messengerx.services
     * @kind function
     *
     * @description Retrieve friend list from server
     * 조건을 활용해서 user를 조회한다.
     * @param {string}
     * @param {integer}
     * @param {function} callback function that be called after success
     */
    search : function(key, pageNumber, callback){

      var params = {
        query : key,
        options : { pageNum : 1,pageSize: 50 }
      };

      if(pageNumber > 0) {
        params.options['pageNum'] = pageNumber;
      }

      $rootScope.xpush.queryUser(params, function( err, userArray, count){
        callback( userArray );
      });
    }
  };
})
.factory('EventManager', function($http, $sce, $rootScope, Sign, ChannelDao, MessageDao, NoticeDao, UTIL, NotificationManager ) {
  var _initFlag = false;
  return {

    /**
     * @ngdoc function
     * @name init
     * @module messengerx.services
     * @kind function
     *
     * @description Initialize this application's singleton object
     * Application에서 singleton에서 사용하는 Manager로, channel list를 조회한 후 unread message를 가져온다.
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

      $rootScope.$on("$popupOpen", function (data, args) {
        if( $rootScope.refreshChannel ){
          $rootScope.refreshChannel();
        }
      });

      $rootScope.$on("$logout", function (data, args) {
        _initFlag = false;
        $rootScope.xpush.clearEvent();
      });

      var loginUser = Sign.getUser();
      var startTime = 0;
      var endTime = 0;

      // system 으로 넘어오는 event를 처리함.
      $rootScope.xpush.on('system', function (ch,name,data) {

        // compare sender's userId to logined UserId. send or receive
        var sr = data.UO.U == loginUser.userId ? 'S':'R' ;

        // compare current channel id to received message's channel id
        // 현재 focus 된 channel 이 현재 channel 과 같을 때, onlineStatus 를 변경한다. 
        if( $rootScope.focusedChannel === ch ){
          var currentChannel = $rootScope.xpush.getChannel( ch );
          if( currentChannel != undefined && currentChannel._connected && sr == 'R') {
            if( $rootScope.currentScope ){
              $rootScope.currentScope.setOnlineStatus( data.MG );
            }
          }
        }
      });

      // message 으로 넘어오는 event를 처리한다.
      $rootScope.xpush.on('message', function (ch,name,data) {
        data.MG = decodeURIComponent(data.MG);

        // compare sender's userId to logined UserId. send or receive
        var sr = data.UO.U == loginUser.userId ? 'S':'R' ;

        // set snapFlag;
        var snapFlag = data.F;

        // Join message not need to compare send or receive
        if( data.T == 'J' ){
          data.type = data.T;
        } else if( data.T != undefined){
          data.type = sr + data.T;
        } else {
          data.type = sr;
        }

        // message를 받은 경우, navbar를 5초간 blink 처리한다.
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

          // 받은 message의 Type이 notification일 때
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

          var id = data.UO.U+ "_" + data.TS;
          var nextMessage = { type : data.type, date : dateStrs[1], message : data.MG, name : data.UO.NM, image : data.UO.I, senderId : data.UO.U, timestamp : data.TS, active : "true", bookmarkFlag : 'N', id : id };

          // Add to local DB
          if( !snapFlag ){
            MessageDao.add( data );
          }

          //  Update channel info
          var param = { 'channel':data.C, 'reset' : true };

          // image 일때
          if( data.T == 'I' ){
            param.message = "@image@";

            // emoticon 일때
          } else if( data.T == 'E' ){
            param.message = "@emoticon@";
            // video 일때
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

          // Join message is not need to update channel info, snapFlag false
          if( !snapFlag && data.type != 'J' ){
            ChannelDao.update( param );
          }

          // If current channel's chatting is activated, show received message
          if( $rootScope.currentScope ){
            $rootScope.currentScope.add( nextMessage, snapFlag );
          }

        } else {
          // 비활성화된 channel로 message가 오는 경우는 channel 정보에 최신 message를 update한다.
          // notice 인 경우는 update하진 않는다.
          if( data.T == 'N' ){
            NoticeDao.add( data );
            return;
          }

          // differ from current channel, get channel data
          $rootScope.xpush.getChannelData( data.C, function( err, channelJson ){
            var channel = {'channel': data.C, 'users' : channelJson.US};

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
            if( channelJson.US.length > 2 ){
              if( channelJson.DT ){
                channel.name = channelJson.DT.NM;
              }
              channel.image = '';

            // 1:1 channel : update channel image and channel name
            } else if( channelJson.US.length == 2 ){
              channel.name = data.UO.NM;
              channel.image = data.UO.I;
            }

            // Add to local DB
            MessageDao.add( data );

            // Increase rootScope's unread count
            $rootScope.totalUnreadCount++;

            if( data.T != 'J' && channelJson.US.length >= 2 ){
              ChannelDao.add( channel );
            }

            NotificationManager.notify( channel );
          });
        }
      });
    },

    /**
     * @ngdoc function
     * @name channelList
     * @module messengerx.services
     * @kind function
     *
     * @description Retrieve channel list from server
     * channel list를 server에서 가져온다.
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
            channel.name = data.DT.NM;
          } else {
            channel.users = "";
            channel.name = "";
          }

          // self channel 인 경우는 채널리스트에 추가하지 않는다.
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
     * @module messengerx.services
     * @kind function
     *
     * @description Retrieve unread message list from server
     * channel array 를 인자로 받아, unread message 가 있는 경우에만 channel로 추가한다.
     * @param {array} JSONArray of channel info JSONObject
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

          var data = messageObject.DT;
          data = JSON.parse(data);
          data.MG = decodeURIComponent( data.MG );

          // Save notice
          // unread message 가 notice 인 경우는 notic DB에 저장한다.
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

          var sr= 'R';
          if( data.UO ){
            sr = data.UO.U == loginUser.userId ? 'S':'R';
          }

          // 초대 message 인 경우
          if( data.T == 'J' ){
            data.type = data.T;

          // 특정 type이 있는 경우
          } else if( data.T != undefined){
            data.type = sr + data.T;
          } else {
            data.type = sr;
          }

          var channel = channels[data.C];

          if( channel ){

            if( data.T == 'I' ){
              channel.message = "@image@";
            } else if( data.T == 'E' ){
              channel.message = "@emoticon@";
            } else if ( data.T == 'VI' || data.T == 'V' ) {
              channel.message = "@video@";
            } else {
              channel.message = data.MG;
            }

            // 2명이상인 경우는 channel name 을 그대로 사용하고, 그렇지 않을 때는 메세지를 보낸 사용자의 이름을 보여준다.
            if( channel.users.length > 2 ){
              channel.name = channel.name;
              channel.image = '';
            } else {
              channel.name = data.UO.NM;
              channel.image = data.UO.I;
            }

            channel.updated = data.TS;

            // Join Message가 아닌 경우에만 channel DB에 저장한다. Join Message 이후 unread message가 있을때만 channel을 보여주기 위함.
            if( data.type != 'J' ){
              ChannelDao.add( channel );
            }

            MessageDao.add( data );
          }
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
     * @module messengerx.services
     * @kind function
     *
     * @description Clear login info and go to login page
     * localStorage 의 user 정보를 삭제하고, session 정보를 삭제한다.
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
     * @module messengerx.services
     * @kind function
     *
     * @description Call REST API for register user
     * /user/regiser api 를 호출하여 새로운 user를 생성한다.
     * @param {object} userInfo for register
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
     * @module messengerx.services
     * @kind function
     *
     * @description Call REST API for update user
     * /user/update api 를 호출하여 user 정보를 수정한다.
     * @param {object} userInfo for update
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
     * @module messengerx.services
     * @kind function
     *
     * @description ser userInfo into session
     * user를 localStorage와 current session에 등록한다.
     * @param {object} userInfo
     */
    setUser : function( user ){
      loginUser = user;
      $localStorage.loginUser = user;
    },
    /**
     * @ngdoc function
     * @name getUser
     * @module messengerx.services
     * @kind function
     *
     * @description return logined user
     * @return {object} userInfo
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
     * @module messengerx.services
     * @kind function
     *
     * @description initilize chat service
     * @param {object} params
     * @param {string} invite message
     * @param {scope} current scope
     * @param {function} callback function that be called after success
     */
    init : function( params, inviteMessage, $scope, callback ){
      self = this;

      var loginUser = Sign.getUser();

      CONF._app = params.app;
      CONF._channel = params.channel;
      CONF._user = { U : loginUser.userId, NM : loginUser.userName, I : loginUser.image };

      // 현재 channel 정보를 update하고
      $rootScope.currentChannel = params.channel;

      // 초대 message가 없다면, 기존 channel 이기 때문에 channel 이력을 조회한다.
      if( inviteMessage == '' ){
        var latestMessage = '';

        // Reset channel's  unread count to zero and lastest message.
        var param = { 'channel' :  params.channel, 'reset' : true, 'message': latestMessage };
        ChannelDao.update( param );

        self.list( params, function( messages ){
          callback( messages );
        });

      } else {
        // 초대 message가 있다면 신규 channel 이라는 의미이기에 초대 메세지를 바로 전송한다. 
        self.send( inviteMessage, false, 'J' );
        callback();
      }
    },

    /**
     * @ngdoc function
     * @name init
     * @module messengerx.services
     * @kind function
     *
     * @description Get message list from local DB
     * @param {object} params
     * @param {function} callback function that be called after success
     */
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

          // 10 minute. 10분 이상 차이가 나는 경우 time 영역을 추가한다.
          if( latestDate !== dateStrs[3] ){
            var dateMessage = dateStrs[1]+" "+dateStrs[2];
            messages.push( { type : 'T', date : dateStrs[1], message : dateMessage } );
            latestDate = dateStrs[3];
          }
          var id = data.sender_id + "_" + data.time;
          messages.push( { type : data.type, date : dateStrs[1], message : data.message, name : data.sender_name,image : Cache.get( data.sender_id ).I,
                        senderId : data.sender_id, timestamp : data.time, active : "false", bookmarkFlag : data.bookmark_flag, id:id } );
        }

        $rootScope.currentChannelLatestDate = latestDate;
        callback(messages);
      });
    },

    /**
     * @ngdoc function
     * @name send
     * @module messengerx.services
     * @kind function
     *
     * @description Send message
     * @param {string} message
     * @param {boolean} useSnap
     * @param {string} messageType
     */
    send : function(msg, useSnap, type){      
      var DT = { UO : CONF._user, MG : encodeURIComponent(msg) };
      DT.F = useSnap;      
      if( type !== undefined ){
        DT.T = type;
      }

      $rootScope.xpush.send(CONF._channel, 'message', DT );
    },

    /**
     * @ngdoc function
     * @name join
     * @module messengerx.services
     * @kind function
     *
     * @description Join channel
     * channel 에 사용자를 추가한다.
     * @param {string} channel id
     * @param {object} channel info, US : channel users
     * @param {function} callback function that be called after success
     */
    join : function(channelId, param, callback){
      $rootScope.xpush.joinChannel( channelId, param, function (data) {
        callback( data );
      });
    },
    /**
     * @ngdoc function
     * @name sendSys
     * @module messengerx.services
     * @kind function
     *
     * @description Send System Message
     * system message를 전송한다.
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
     * @name message를 update한다.
     * @module messengerx.services
     * @kind function
     *
     * @description Send System Message
     * @param {object} param
     */
    updateMessage : function( param ){
      MessageDao.update( param );
    },
    /**
     * @ngdoc function
     * @name exitChannel
     * @module messengerx.services
     * @kind function
     *
     * @description channel에서 나간다.
     * @param {string} channel
     * @param {function} callback function that be called after success
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
     * @module messengerx.services
     * @kind function
     *
     * @description Retreive emoticon from local DB
     * DB에서 emoticon을 조회한다.
     * @param {object} Search param
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

        // 조회한 결과를 group 에 맡게 4개씩 분할하여 보여주기 위한 로직
        for( var key in result ){
          var groups = result[key];
          var group = groups.group;
          var tag = groups.tag;

          var rr = { group : group, items : {}, metas : 0, tag : 'ion-android-hand', 'CN' : 'tab-item' };

          var jnx = 0;

          // Divide result by 4. 4개가 넘을때는 4개씩 잘라내면서 새로운 key를 만든다.
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
     * @module messengerx.services
     * @kind function
     *
     * @description Add emoticon into local DB and current Emoticon object
     * @param {object} param
     * @param {object} emoticon info
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

      // 4개 이하일떄는 같은 group에 추가
      if( jsonObject.items[groupKey].length < 4 ){
        k = groupKey;
      } else {

        // Item count larger than 4. make new group key
        // 4개 이상일 때는 새로운 group에 등록
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
.factory('UTIL', function(Cache, Sign, APP_INFO){
  var cho = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  return {

    /**
     * @ngdoc function
     * @name generateChannelId
     * @module messengerx.dao
     * @kind function
     *
     * @description Generate channel Id
     * channelId를 생성한다. 1:1 channel 일때는 userId와 friendId를 조합하고, multi channel 일때는 uuid로 생성한다. 
     * @return {object} jsonObj
     */
    generateChannelId : function(jsonObj){

      // multi user channel = generate uuid
      if( jsonObj.U.length > 2 ){
        return this.getUniqueKey()+"^"+APP_INFO.appKey;;
      } else {
        // 1:1 channel = userId concat friendId
        return jsonObj.U.sort().join( "$" )+"^"+APP_INFO.appKey;
      }
    },

    /**
     * @ngdoc function
     * @name getUniqueKey
     * @module messengerx.services
     * @kind function
     *
     * @description Generate uuid
     * uuid를 생성한다.
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
     * @module messengerx.services
     * @kind function
     *
     * @description Generate uuid
     * @return {long} timestamp
     * timestamp 를 여러 형태로 return한다.
     * @return {array} [ yyyy.mm.dd | hh:min, yyyy.mm.dd, hh:min, yyyymmddhhm]
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
     * @module messengerx.services
     * @kind function
     *
     * @description Get chosung for Korean character
     * 한글을 받아서 초성을 추출한다.
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
     * @name getMorphemes
     * @module messengerx.services
     * @kind function
     *
     * @description Get morphemes for Korean character
     * 한글을 받아서 초성, 중성, 종성의 형태소로 return 한다. 홍길동 -> ㅎㅗㅇㄱㅣㄹㄷㅗㅇ
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
     * @name getInviteMessage
     * @module messengerx.services
     * @kind function
     *
     * @description userId의 array를 받아 초대를 위한 message를 만든다.
     * @param {string} userID array
     * @return {string} invite message
     */
    getInviteMessage: function(userIds){
      var loginUser = Sign.getUser();
      var result = '';

      var users = angular.copy( userIds );

      if( users.indexOf(loginUser.userId) > -1 ){
        users.splice( users.indexOf(loginUser.userId), 1 );
      }

      // login user invite A, B, C 형태로 message를 생성한다.
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
     * @module messengerx.services
     * @kind function
     *
     * @description Get channelName by channelUser
     * userID array를 입력받아 channel name을 생성한다.
     * @param {string} userID array
     * @return {string} channel name
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
        // 2명 방이기 때문에, 현재 user의 이름을 제외하여 channel message를 만든다.
        userArray.splice( userArray.indexOf( loginUserId ), 1 );

        var name = userArray[0];
        if( friends[ userArray[0] ] !== undefined ){
          name = friends[ userArray[0] ].NM;
        }

        userNames.push( name );
      } else {

        // multi channel 인 경우, Cache에서 userId를 이용하여 NM을 추출한다.
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
     * @module messengerx.services
     * @kind function
     *
     * @description Get file type from DOM object
     * file element의 type을 추출한다.
     * @param {object} file DOM object
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
})
.factory('ChatLauncher', function($rootScope, $state, Cache, Sign){
  // Main Window를 위한 ChatLauncher
  var popupCount = 0;
  var popups = {};
  var self;

  // popupClose 이벤트를 받을 경우 popup map에서 제거
  $rootScope.$on("$popupClose", function ( data, key ){
    delete popups[key];
    popupCount--;
  });  

  return {
    getPopups : function(){
      return popups;
    },
    gotoChat : function( popupKey, stateParams, callback ){
      self = this;

      // popup 사용여부가 true일 때는 chat window를 팝업으로 띠우고, 그렇지 않을땐  현재 창에서 이동한다.
      if( $rootScope.usePopupFlag ){
        if( popups[popupKey] !== undefined ){
          if( popups[popupKey].window ){
            popups[popupKey].window.focus();
          } else {
            popups[popupKey].focus();
          }

          if ( callback && typeof callback === 'function') {
            callback();
          }
        } else {

          var popup;

          var left = screen.width - 620 + ( popupCount * 50 );
          var top = 0 + ( popupCount * 50 ) ;
          popupCount++;

          if( $rootScope.nodeWebkit ){ 
            popup = window.open( $rootScope.rootPath + 'popup-chat.html', popupKey, 'screenX='+ left + ',screenY=' + top +',width=400,height=600');
            // nodewebkit에서 채팅창이 option위치에서 열리지 않아, 채팅창을 정해진 위치로 이동시킨다.
            popup.moveTo(left,top);
          } else {
            popup = window.open( $rootScope.rootPath + 'popup-chat.html', popupKey, 'screenX='+ left + ',screenY=' + top +',width=400,height=600');
          }

          var startTime = Date.now();
          var popupInterval = setInterval( function(){
            var endTime = Date.now();

            // 팝업이 뜨는데 걸리는 시간이 10초를 넘어가면 팝업을 오픈한다.
            if( endTime - startTime > 10000 ){
              clearInterval( popupInterval );
            }

            // popup의 angular socpe 및 popupOpened 이벤트가 발생할때가지 팝업 생성을 기다린다. 
            if( popup !== undefined ) {
              var popObj = popup.window.document.getElementById( "popupchat" );
              if( popObj !== undefined && popup.window.angular !== undefined ){
                var newWindowRootScope = popup.window.angular.element( popObj ).scope();
                if( newWindowRootScope !== undefined && newWindowRootScope.xpush !== undefined ){
                  if( newWindowRootScope.$$listeners.$popupOpened !== undefined ){
                    clearInterval( popupInterval );
                    self.openPopup( popup, popupKey, newWindowRootScope, stateParams );
                    if ( callback && typeof callback === 'function') {
                      callback();
                    }
                  }
                }
              }
            }
          }, 200 );
        }
      } else {
        $rootScope.$stateParams = stateParams;
        $state.go( 'chat' );
      }
    },
    openPopup : function( popupWin, popupKey, scope, stateParams ){

      if( $rootScope.nodeWebkit ) {
        popups[popupKey] = popupWin;
      } else {
        popups[popupKey] = popupWin;

        // broswer 사용시 chat window를 종료할때 이벤트 처리를 위함
        popupWin.onbeforeunload = function(){
          scope.$broadcast("$windowClose" );
          popupCount--;
          delete popups[popupKey];
        };
      }

      // 채팅 창으로 로그인 정보와 세션 커넥션을 넘김.
      var args = {};
      args.loginUser = Sign.getUser();
      args.stateParams = stateParams;
      args.cache = Cache.all();
      args.popupKey = popupKey;
      args.sessionConnection = $rootScope.xpush._sessionConnection;
      args.parentScope = $rootScope;

      // 팝업 오픈이 완료되었음을 알리는 event를 발생시킨다.
      scope.$broadcast("$popupOpened", args );
    }
  };
})
.factory('NotificationManager', function($window, ChatLauncher, ChannelDao ){
  var notificationsSupport = ('Notification' in window) || ('mozNotification' in navigator);
  var notificationsCnt = 0;
  var notificationsInx = 0;
  var win = angular.element($window);
  var notificationsShown = {};

  return {
    start: start,
    notify: notify,
    clear:clearNotification
  };

  function start () {
    if (!notificationsSupport) {
      return false;
    }

    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      win.on('click', requestPermission );
    }

    try {
      win.on('beforeunload', clearNotification);
    } catch (e) {}
  }

  function requestPermission() {
    Notification.requestPermission(function (permission) {
      if(!('permission' in Notification)) {
        Notification.permission = permission;
      }
    });
    win.off('click', requestPermission );
  }

  function notify (data) {
    notificationsCnt++;

    if (!notificationsSupport ||
        'Notification' in window && Notification.permission !== 'granted') {
      return false;
    }

    var idx = ++notificationsInx,
        channel = data.channel,
        notification;

    if ('Notification' in window) {
      notification = new Notification(data.name, {
        icon: data.image, body: data.message
      });
    } else if ('mozNotification' in navigator) {
      notification = navigator.mozNotification.createNotification(data.name, data.message, data.image);
    } else {
      return;
    }

    notification.onclick = function () {
      notification.close();

      var $stateParams = {};
      var channelId = data.channel;

      closeChannelNotification( channelId );

      ChannelDao.get( channelId ).then(function(result) {
        $stateParams.channelId = channelId;
        $stateParams.channelUsers = result.channel_users;
        $stateParams.channelName = result.channel_name;

        ChatLauncher.gotoChat( channelId, $stateParams );
      });
    };

    if (notification.show) {
      notification.show();
    }

    if( !notificationsShown[channel] ){
      notificationsShown[channel] = [];
    }

    notificationsShown[channel].push( notification );
  };

  function closeChannelNotification( channel ) {
    angular.forEach(notificationsShown[channel], function (notification) {
      try {
        if (notification.close) {
          notification.close();
        }

        if( notificationsCnt > 0 ){
          notificationsCnt--;
        }
      } catch (e) {}
    });

    notificationsShown[channel] = [];
  }

  function clearNotification() {
    for( var channel in notificationsShown ){
      angular.forEach(notificationsShown[channel], function (notification) {
        try {
          if (notification.close) {
            notification.close();
          }
        } catch (e) {}
      });
    }

    notificationsShown = {};
    notificationsCnt = 0;
  }
});