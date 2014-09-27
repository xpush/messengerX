angular.module('messengerx.dao', [])

.factory('UserDao', function(Sign, DB, UTIL) {
  return {
    /**
     * @ngdoc function
     * @name getRefreshHistory
     * @module messengerx.dao
     * @kind function
     *
     * @description Get refresh history from local DB
     * Refresh History를 조회한다. 서버와 친구리스트를 동기화할 때 사용한다.
     * @returns {object} history object
     */
    getRefreshHistory : function(){
      var loginUserId = Sign.getUser().userId;
      var query = 'SELECT time from TB_REFRESH_HISTORY where owner_id = ? ';
      var cond = [loginUserId];

      return DB.query(query, cond).then(function(result) {
        return DB.fetch(result);
      });
    },
    /**
     * @ngdoc function
     * @name updateRefreshHistory
     * @module messengerx.dao
     * @kind function
     *
     * @description Insert or update refresh history at local DB
     * Refresh History를 기록한다.
     * @returns {object} query result
     */
    updateRefreshHistory : function(){
      var loginUserId = Sign.getUser().userId;

      var query = "INSERT OR REPLACE INTO TB_REFRESH_HISTORY ( time, owner_id ) ";
      query +=" VALUES ( ?, ? )";

      var cond = [
        Date.now(),
        loginUserId
      ];

      return DB.query(query, cond).then(function(result) {
        return result;
      });
    },
    /**
     * @ngdoc function
     * @name addAll
     * @module messengerx.dao
     * @kind function
     *
     * @description Insert or update a lot of user data at local DB
     * user array를 인자로 받아 친구로 등록한다.
     * @param {Array} User Array
     * @param {function} callback function that be called after save success
     */
    addAll : function(jsonArray, callback){
      var loginUserId = Sign.getUser().userId;

      var querys = [];
      var conds = [];

      for( var inx = 0 ; inx < jsonArray.length ; inx++ ){
        var jsonObj = jsonArray[inx];
        jsonObj.chosung = UTIL.getChosung( jsonObj.DT.NM );

        var query = "INSERT OR REPLACE INTO TB_USER (user_id, user_name, message, image, chosung, owner_id ) ";
        query +=" VALUES ( ?, ?, ?, ?, ?, ? )";

        var currentTimestamp = Date.now();
        var cond = [
          jsonObj.U,
          jsonObj.DT.NM,
          jsonObj.DT.MG,
          jsonObj.DT.I,
          jsonObj.chosung,
          loginUserId
        ];

        querys.push( query );
        conds.push( cond );
      }

      DB.queryAll(querys, conds).then(function(result) {
        callback( result );
      });
    },

    /**
     * @ngdoc function
     * @name list
     * @module messengerx.dao
     * @kind function
     *
     * @description Retrieve user list from local DB
     * local DB에서 user list 를 조회한다.
     * @return {Array} User Array
     */
    list : function(){
      var loginUserId = Sign.getUser().userId;
      return DB.query(
        'SELECT user_id, user_name, message, image, chosung, owner_id FROM TB_USER where owner_id = ? ORDER BY user_name', [loginUserId]
      ).then(function(result) {
        return DB.fetchAll(result);
      });
    },

    /**
     * @ngdoc function
     * @name remove
     * @module messengerx.dao
     * @kind function
     *
     * @description Delete user from local DB
     * local DB에서 user를 삭제한다.
     * @param {string} userId  
     * @return {object} query result
     */
    remove : function(userId){
      var loginUserId = Sign.getUser().userId;
      return DB.query(
        'DELETE FROM TB_USER where user_id =? and owner_id = ? ', [userId, loginUserId]
      ).then(function(result) {
        return DB.fetchAll(result);
      });
    }
  }
})
.factory('ChannelDao', function(DB, UTIL, APP_INFO, Sign) {
  // Channel Screen scope
  var scope;
  var loginUserId;

  return {

    /**
     * @ngdoc function
     * @name get
     * @module messengerx.dao
     * @kind function
     *
     * @description Retrieve single channel data from local DB
     * local DB에서 특정 channel을 조회한다.
     * @param {string} channelId     
     * @return {object} Channel data
     */
    get : function( channelId ){
      loginUserId = Sign.getUser().userId;
      return DB.query(
        'SELECT channel_id, channel_name, channel_users, channel_image, latest_message, unread_count, channel_updated FROM TB_CHANNEL where channel_id = ? and owner_id = ? ', [channelId,loginUserId]
      ).then(function(result) {
          return DB.fetch(result);
        });
    },

    /**
     * @ngdoc function
     * @name list
     * @module messengerx.dao
     * @kind function
     *
     * @description Retrieve channel list from local DB
     * local DB에서 channel list를 조회한다.
     * @param {object} jsonObj
     * @return {Array} Channel data list
     */
    list : function( $scope ){
      scope = $scope;
      loginUserId = Sign.getUser().userId;

      return DB.query(
        'SELECT channel_id, channel_name, channel_users, channel_image, latest_message, unread_count, channel_updated FROM TB_CHANNEL where owner_id = ? ORDER BY channel_updated DESC', [loginUserId]
      ).then(function(result) {
        return DB.fetchAll(result);
      });
    },

    /**
     * @ngdoc function
     * @name getAllCount
     * @module messengerx.dao
     * @kind function
     *
     * @description Retrieve total unread message count from local DB
     * local DB에서 channel 안의 읽지 않은 메세지 count를 조회한다.
     * @param {object} jsonObj
     * @return {integer} total nread message count 
     */
    getAllCount : function(jsonObj){
      loginUserId = Sign.getUser().userId;

      return DB.query(
        'SELECT sum( unread_count ) as total_count FROM TB_CHANNEL where owner_id = ? ', [loginUserId]
      ).then(function(result) {
        return DB.fetch(result);
      });
    },

    /**
     * @ngdoc function
     * @name updateUsers
     * @module messengerx.dao
     * @kind function
     *
     * @description  Update channel name and channel users at local DB
     * 특정 channel의 name과 user 정보를 수정한다. channel에 user 초대시 변경시 호출한다.
     * @param {object}  param
     * @return {object} query result
     */
    updateUsers : function(param){
      loginUserId = Sign.getUser().userId;

      var query = "UPDATE TB_CHANNEL ";
      query += "SET channel_name = ? , channel_users = ? ";
      query += "WHERE channel_id = ? and owner_id = ? ";

      var cond = [ param.name , param.users, param.channel, loginUserId ];

      return DB.query(query, cond).then(function(result) {
        return result;
      });
    },

    /**
     * @ngdoc function
     * @name update
     * @module messengerx.dao
     * @kind function
     *
     * @description  Update channel info at local DB
     * 특정 channel의 전체적인 정보를 수정한다. 
     * @param {object}  param
     * @return {object} query result
     */
    update : function(param){
      loginUserId = Sign.getUser().userId;

      var cond = [Date.now()];

      var query = "UPDATE TB_CHANNEL ";
      query += "SET unread_count = 0, channel_updated = ? ";

      if( param.message != undefined && param.message != '' && param.image != undefined && param.image != '' ){
        query += ", latest_message = ?, channel_image = ? ";
        cond.push( param.message );
        cond.push( param.image );
      } else if ( param.message != undefined && param.message != '' ){
        query += ", latest_message = ? ";
        cond.push( param.message );
      } else  if ( param.image != undefined && param.image != '' ){
        query += ", channel_image = ? ";
        cond.push( param.image );
      }

      query += "WHERE channel_id = ? and owner_id = ? ";

      cond.push( param.channel );
      cond.push( loginUserId );

      return DB.query(query, cond).then(function(result) {
        return result;
      });
    },

    /**
     * @ngdoc function
     * @name insert
     * @module messengerx.dao
     * @kind function
     *
     * @description  insert channel info into local DB
     * 특정 channel을 생성한다. 이미 있는 channel 이면 생성하지 않는다. server와의 channel 동기화를 할때 사용한다.
     * @param {object}  jsonObj
     * @return {object} query result
     */
    insert : function(jsonObj){
      loginUserId = Sign.getUser().userId;
      var query =
        "INSERT OR IGNORE INTO TB_CHANNEL "+
        "(channel_id, channel_name, channel_users, unread_count, channel_updated, owner_id) VALUES "+
        "(?, ?, ?, 0, ?, ?)";

      var cond = [
        jsonObj.C,
        jsonObj.NM,
        jsonObj.U,
        Date.now(),
        loginUserId
      ];

      return DB.query(query, cond).then(function(result) {
        return result;
      });

    },

    /**
     * @ngdoc function
     * @name add
     * @module messengerx.dao
     * @kind function
     *
     * @description Insert or replace channel info with channel image at local 
     * 특정 channel을 추가하거나 수정한다. message가 들어 왔을 때 channel 정보를 update한다.
     * @param {object}  jsonObj
     * @return {object} query result
     */
    add : function(jsonObj){
      loginUserId = Sign.getUser().userId;

      var query =
        "INSERT OR REPLACE INTO TB_CHANNEL "+
        "(channel_id, channel_name, channel_users, channel_image, latest_message, unread_count, channel_updated, owner_id) "+
        "SELECT new.channel_id, new.channel_name, new.channel_users ";

        if( jsonObj.image != undefined ){
          query += ", new.channel_image ";
        } else {
          query += ", old.channel_image ";
        }

        query += ", new.latest_message, IFNULL( old.unread_count, new.unread_count) as unread_count, new.channel_updated, new.owner_id "+
        "FROM ( "+
        "  SELECT ? as channel_id, ? as channel_name, ? as channel_users, ? as channel_image, ? as latest_message, 1 as unread_count, ? as channel_updated, ? as owner_id " +
        ") as new " +
        " LEFT JOIN ( " +
        "   SELECT channel_id, channel_name, channel_users, channel_image, unread_count + 1 as unread_count, channel_updated, owner_id " +
        "   FROM TB_CHANNEL " +
        " ) AS old ON new.channel_id = old.channel_id AND old.owner_id = new.owner_id ; ";

      if( jsonObj.updated == undefined ){
        jsonObj.updated = Date.now();
      }

      var cond = [
        jsonObj.channel,
        jsonObj.name,
        jsonObj.users,
        jsonObj.image,
        jsonObj.message,
        jsonObj.updated,
        loginUserId
      ];

      if( scope != undefined ){

        var unreadCount = 1;
        var searchIndex = -1;
        for( var inx = 0 ; inx < scope.channelArray.length; inx++ ){
          if( scope.channelArray[inx].channel_id == jsonObj.channel ){
            searchIndex = inx;
            break;
          }
        }

        if( searchIndex > -1 ){
          unreadCount = scope.channelArray[ searchIndex ].unread_count + 1;
          scope.channelArray.splice(searchIndex, 1);
        }

        var channel = {'channel_id':jsonObj.channel,'channel_name':jsonObj.name,'unread_count': unreadCount, 'latest_message':jsonObj.message, 'channel_users':jsonObj.users.join(','), 'channel_image':jsonObj.image, 'channel_updated': jsonObj.updated};

        scope.channelArray.unshift( channel );
        scope.$apply();
      }

      return DB.query(query, cond).then(function(result) {
        return result;
      });
    },

    /**
     * @ngdoc function
     * @name remove
     * @module messengerx.dao
     * @kind function
     *
     * @description delelte channel by Id
     * @param {string} channel
     * @return {object} query result
     */
    remove : function(channel){

      loginUserId = Sign.getUser().userId;
      var query =
        "DELETE FROM TB_CHANNEL "+
        "WHERE channel_id = ? AND owner_id = ? ";

      var cond = [
        channel,
        loginUserId
      ];

      return DB.query(query, cond).then(function(result) {
        return result;
      });
    }
  }
})
.factory('EmoticonDao', function(DB, Sign) {

  return {
    /**
     * @ngdoc function
     * @name list
     * @module messengerx.dao
     * @kind function
     *
     * @description Retrieve emoticon list
     * local DB의 emoticon list를 조회한다.
     * @param {object} param
     * @return {Array} list of emoticons
     */
    list : function(param){
      var loginUserId = Sign.getUser().userId;
      var query = "SELECT group_id, tag, image FROM TB_EMOTICON WHERE owner_id = ? ";
      if( param.group != undefined ){
        query += "AND group_id = ? ";
      }
      query += "ORDER BY group_id ASC ;";

      var cond=[loginUserId];
      if( param.group != undefined ){
        cond.push( param.group );
      }

      return DB.query( query, cond ).then(function(result) {
        return DB.fetchAll(result);
      });
    },

    /**
     * @ngdoc function
     * @name add
     * @module messengerx.dao
     * @kind function
     *
     * @description Insert or remove emoticon
     * local DB에 새로운 emoticon을 추가한다.
     * @param {object} jsonObj
     * @return {object} query result
     */
    add : function(jsonObj){
      var loginUserId = Sign.getUser().userId;
      var query =
        "INSERT OR REPLACE INTO TB_EMOTICON "+
        "(group_id, tag, image, owner_id) VALUES "+
        "(?, ?, ?, ?) ;";

      var cond = [
        jsonObj.group,
        jsonObj.tag,
        jsonObj.image,
        loginUserId
      ];

      return DB.query(query, cond).then(function(result) {
        return result;
      });
    }
  }
})
.factory('MessageDao', function(DB, Sign, Cache) {
  var scope;

  return {
    /**
     * @ngdoc function
     * @name list
     * @module messengerx.dao
     * @kind function
     *
     * @description Retrieve message list
     * local DB에서 message list를 조회한다.
     * @param {object} params
     * @return {Array} list of message
     */
    list : function( params ){
      var loginUserId = Sign.getUser().userId;
      var query = 'SELECT sender_id, sender_name, sender_image, message, time, type, bookmark_flag FROM TB_MESSAGE WHERE channel_id = ? and owner_id = ? ';
      
      if( params.bookmarkFlag !== undefined ){        
        query += 'AND bookmark_flag = "' + params.bookmarkFlag + '" ';
      }

      var cond = [params.channel,loginUserId];

      return DB.query(
        query, cond
      ).then(function(result) {
        return DB.fetchAll(result);
      });
    },

    /**
     * @ngdoc function
     * @name add
     * @module messengerx.dao
     * @kind function
     *
     * @description Retrieve message list
     * local DB에 message를 저장한다.
     * @param {object} jsonObj
     * @return {object} query result
     */
    add : function(jsonObj){
      var loginUserId = Sign.getUser().userId;
      var query =
        "INSERT INTO TB_MESSAGE "+
        "(channel_id, sender_id, sender_name, sender_image, message, type, time, owner_id) VALUES "+
        "(?, ?, ?, ?, ?, ?, ?, ?)";

      var cond = [
        jsonObj.C,
        jsonObj.S,
        jsonObj.UO.NM,
        jsonObj.UO.I,
        jsonObj.MG,
        jsonObj.type,
        jsonObj.TS,
        loginUserId
      ];

      // Add to Cache
      Cache.add( jsonObj.S, {'NM':jsonObj.UO.NM, 'I':jsonObj.UO.I} );

      this.addScan( jsonObj );

      return DB.query(query, cond).then(function(result) {
        return result;
      });
    },

    /**
     * @ngdoc function
     * @name update
     * @module messengerx.dao
     * @kind function
     *
     * @description Update a message
     * bookmark flag를 update 한다.
     * @param {object} jsonObj
     * @return {object} query result
     */
    update : function(jsonObj){
      var loginUserId = Sign.getUser().userId;
      var query =
        "UPDATE TB_MESSAGE "+
        "SET bookmark_flag = ? "+
        "WHERE channel_id = ? and sender_id = ? and time = ? and owner_id = ? ";

      var cond = [
        jsonObj.bookmarkFlag,
        jsonObj.channel,
        jsonObj.senderId,
        jsonObj.timestamp,
        loginUserId
      ];

      return DB.query(query, cond).then(function(result) {
        return result;
      });
    },

    /**
     * @ngdoc function
     * @name removeAll
     * @module messengerx.dao
     * @kind function
     *
     * @description Remove all message
     * 특정 channel의 모든 message를 삭제한다.
     * @param {string} channel
     * @return {object} query result
     */
    removeAll : function(channel){
      var loginUserId = Sign.getUser().userId;
      var query =
        "DELETE FROM TB_MESSAGE "+
        "WHERE channel_id = ? and owner_id = ? ";

      var cond = [
        channel,
        loginUserId
      ];

      return DB.query(query, cond).then(function(result) {
        return result;
      });
    },

    /**
     * @ngdoc function
     * @name addScan
     * @module messengerx.dao
     * @kind function
     *
     * @description Add message into scan DB
     * scan을 위한 DB에 message를 저장한다.
     * @param {object} jsonObj
     * @return {object} query result
     */
    addScan : function(jsonObj){
      var loginUserId = Sign.getUser().userId;
      var query =
        "INSERT INTO TB_SCAN "+
        "(channel_id, sender_id, sender_name, sender_image, message, type, time, owner_id) VALUES "+
        "(?, ?, ?, ?, ?, ?, ?, ?)";

      var cond = [
        jsonObj.C,
        jsonObj.S,
        jsonObj.UO.NM,
        jsonObj.UO.I,
        jsonObj.MG,
        jsonObj.type,
        jsonObj.TS,
        loginUserId
      ];

      return DB.query(query, cond).then(function(result) {
        return result;
      });     
    },

    /**
     * @ngdoc function
     * @name scan
     * @module messengerx.dao
     * @kind function
     *
     * @description Retrieve message from scan DB
     * scan을 DB에서 message를 scan한다.
     * @param {string} search
     * @return {Array} list of message
     */
    scan : function( search ){
      var loginUserId = Sign.getUser().userId;
      var query = 'SELECT sender_id, sender_name, sender_image, message, time, type, bookmark_flag FROM TB_SCAN '+
      'WHERE message MATCH ? AND owner_id = ? ';

      var cond = ["message:*"+search+"*", loginUserId];

      return DB.query(
        query, cond
      ).then(function(result) {
        return DB.fetchAll(result);
      });
    },
  }
})
.factory('NoticeDao', function(DB, Sign) {

  return {
    /**
     * @ngdoc function
     * @name notice
     * @module messengerx.dao
     * @kind function
     *
     * @description Retrieve notice message from local DB
     * local DB에서 notice message를 조회한다.
     * @param {string} channelId 
     * @return {object} notice info
     */
    get : function( channelId ){
      var loginUserId = Sign.getUser().userId;
      return DB.query(
        'SELECT message,location , sender_id, updated, use_flag, fold_flag, vote_flag FROM TB_NOTICE WHERE channel_id = ? and owner_id = ? and use_flag = ? ;', [channelId,loginUserId,'Y']
      ).then(function(result) {
        return DB.fetch(result);
      });
    },

    /**
     * @ngdoc function
     * @name add
     * @module messengerx.dao
     * @kind function
     *
     * @description Insert or replace notice message at local DB
     * local DB에 notice message를 추가하거나 수정한다.
     * @param {object} jsonObj 
     * @return {object} query result
     */
    add : function( jsonObj ){
      loginUserId = Sign.getUser().userId;

      var query =  
        "INSERT OR REPLACE INTO TB_NOTICE "+
        "(message,location, sender_id, channel_id, updated, use_flag, fold_flag, owner_id ) VALUES "+
        "(?, ?, ?, ?, ?, ?, ?, ?) ;";

      var cond = [
        jsonObj.MG,
        jsonObj.LC,
        jsonObj.S,
        jsonObj.C,
        jsonObj.TS,
        'Y',
        'N',
        loginUserId
      ];

      return DB.query(query, cond).then(function(result) {
        return result;
      });
    },

    /**
     * @ngdoc function
     * @name update
     * @module messengerx.dao
     * @kind function
     *
     * @description Update notice message at local DB
     * local DB 의 notice 를 update한다.
     * @param {object} jsonObj 
     * @return {object} query result
     */
    update : function( jsonObj ){
      loginUserId = Sign.getUser().userId;

      var query =  
        "UPDATE TB_NOTICE "+
        "SET use_flag = ? , fold_flag = ? ";

      if( jsonObj.voteFlag ){
        query += ", vote_flag = '" +jsonObj.voteFlag+ "' ";
      }

      query += "WHERE channel_id = ? AND owner_id = ? ; ";

      var cond = [
        jsonObj.useFlag,
        jsonObj.foldFlag,
        jsonObj.channelId,
        loginUserId
      ];

      return DB.query(query, cond).then(function(result) {
        return result;
      });
    }    
  }
})
.factory('DB', function($q, $rootScope, DB_CONFIG) {
  var self = this;
  self.db = null;
  var changeDBFlag = false;
  $rootScope.syncFlag = false;

  /**
   * @ngdoc function
   * @name init
   * @module messengerx.dao
   * @kind function
   *
   * @description Initialize local DB
   * WEB SQL을 사용하는 local DB를 초기화한다.
   */
  self.init = function() {

    try {
      if (!window.openDatabase) {
        alert( "죄송합니다. DB를 지원하지 않습니다. \n사용하실 수 없습니다.");
      } else {
        var shortName = DB_CONFIG.name;
        var displayName = 'news database';
        var maxSize = 5 * 1024 * 1024; // in bytes
        self.db = openDatabase(shortName, '', displayName, maxSize);
      }
    } catch(e) {
      // Error handling code goes here.

      console.error(e);
      alert( "죄송합니다. DB를 지원하지 않습니다. \n사용하실 수 없습니다.");
      return;
    }

    // DB Version 이 update 되었다면, 기존 메시지를 모두 삭제하고 DB를 변경한다.
    if( self.db.version != DB_CONFIG.version ){
      self.db.changeVersion(self.db.version, DB_CONFIG.version, function (t) {
        changeDBFlag = true;
        self.createTable( changeDBFlag );
      });
    } else {
      self.createTable( changeDBFlag );
    }
  };

  /**
   * @ngdoc function
   * @name createTable
   * @module messengerx.dao
   * @kind function
   *
   * @description Initialize local DB
   * DB_CONFIG의 tables 정보를 이용하여 table을  생성한다.
   * @param {boolean} changeDBFlag 
   */
  self.createTable = function( changeDBFlag ){

    angular.forEach(DB_CONFIG.tables, function(table) {
      var columns = [];

      angular.forEach(table.columns, function(column) {
        columns.push(column.name + ' ' + column.type);
      });

      // version 이 다른 경우 table을 drop 하고 신규생성한다.
      if( changeDBFlag ){
        $rootScope.syncFlag = true;
        var query = 'DROP TABLE ' + table.name;
        self.query(query);
      }

      var query1;

      // SCAN을 위한 fts3를 이용한 virtual table 생성
      if( table.virtual ){
        query1 = 'CREATE VIRTUAL TABLE ' + table.name + ' USING fts3(' + columns.join(',') + ')';
      } else {
        query1 = 'CREATE TABLE IF NOT EXISTS ' + table.name + ' (' + columns.join(',') + ')';
      }
      self.query(query1);

      // TABLE info에 index정보가 있다면, index를 생성
      if( table.table_index != undefined ){
        for( var key in table.table_index ){
          var tableInx = table.table_index[key];
          var query2 = 'CREATE '+ tableInx.type +' INDEX IF NOT EXISTS ' + tableInx.name +' ON ' +table.name + ' (' + tableInx.columns.join(',') + ')';
          self.query(query2);
        }
      }
    });
  };

  /**
   * @ngdoc function
   * @name clearAll
   * @module messengerx.dao
   * @kind function
   *
   * @description Remove all data from local DB
   * 모든 DB에서 data를 삭제한다.
   * @param {string} userId 
   */
  self.clearAll = function( userId ){
    var querys = [];
    var conds = [];
    angular.forEach(DB_CONFIG.tables, function(table) {
      var columns = [];

      var query = 'DELETE FROM ' + table.name + ' WHERE owner_id = ? ';
      querys.push( query );
      conds.push( [userId] );
    });  
    self.queryAll(querys, conds);
  };

  /**
   * @ngdoc function
   * @name query
   * @module messengerx.dao
   * @kind function
   *
   * @description executeSql with query and binding
   * query 와 binding을 인자로 받아 query를 실행한다.
   * @param {string} query
   * @param {array} binding
   */
  self.query = function(query, binding) {
    binding = typeof binding !== 'undefined' ? binding : [];
    var deferred = $q.defer();
    self.db.transaction(function(transaction) {
      transaction.executeSql(query, binding, function(transaction, result) {
        deferred.resolve(result);
      }, function(transaction, error) {
        deferred.reject(error);
      });
    });

    return deferred.promise;
  };

  /**
   * @ngdoc function
   * @name queryAll
   * @module messengerx.dao
   * @kind function
   *
   * @description executeSql multi query in single transaction
   * query 와 binding의 array를 인자로 받아 여러개의 query를 하나의 transaction에서 실행한다.
   * @param {array} querys
   * @param {array} bindings
   */
  self.queryAll = function(querys, bindings) {
    var deferred = $q.defer();
    self.db.transaction(function(transaction) {
      var until = querys.length-1;
      for( var inx = 0 ; inx < until ; inx++ ){
        var query = querys[inx];
        var binding = bindings[inx];
        transaction.executeSql(query, binding);
      }

      transaction.executeSql(querys[until] , bindings[until], function(transaction, result) {
        deferred.resolve(result);
      }, function(transaction, error) {
        deferred.reject(error);
      });
    });

    return deferred.promise;
  };

  /**
   * @ngdoc function
   * @name fetchAll
   * @module messengerx.dao
   * @kind function
   *
   * @description convert SQL query result to JSON array
   * sql 실행 결과를 인자로 받아 array로 반환한다.
   * @param {object} resut - SQL query result 
   * @return {array} JSON array
   */
  self.fetchAll = function(result) {
    var output = [];

    for (var i = 0; i < result.rows.length; i++) {
      output.push(result.rows.item(i));
    }

    return output;
  };

  /**
   * @ngdoc function
   * @name fetch
   * @module messengerx.dao
   * @kind function
   *
   * @description executeSql multi query in single transaction
   * query 와 binding의 array를 인자로 받아 여러개의 query를 하나의 transaction에서 실행한다.
   * @param {object} resut - SQL query result 
   * @return {object} JSON object
   */
  self.fetch = function(result) {
    if( result.rows == undefined || result.rows.length == 0 ){
      return undefined;
    } else {
      return result.rows.item(0);
    }
  };

  return self;
});
