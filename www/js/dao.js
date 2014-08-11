angular.module('starter.dao', [])

.factory('UserDao', function(Sign, DB, UTIL) {
  return {
    /**
     * @ngdoc function
     * @name getRefreshHistory
     * @module starter.dao
     * @kind function
     *
     * @description Get refresh history from local DB
     * @returns {Object} history object
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
     * @module starter.dao
     * @kind function
     *
     * @description Insert or update refresh history at local DB
     * @returns {Object} query result
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
     * @module starter.dao
     * @kind function
     *
     * @description Insert or update a lot of user data at local DB
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
     * @module starter.dao
     * @kind function
     *
     * @description Retrieve user list from local DB
     * @return {Array} User Array
     */
    list : function(){
      var loginUserId = Sign.getUser().userId;
      return DB.query(
        'SELECT user_id, user_name, message, image, chosung, owner_id FROM TB_USER where owner_id = ? ORDER BY user_name', [loginUserId]
      ).then(function(result) {
        return DB.fetchAll(result);
      });
    }
  }
})
.factory('ChannelDao', function(DB, UTIL, APP_INFO, Sign) {
  var scope;
  var loginUserId;

  return {

    /**
     * @ngdoc function
     * @name get
     * @module starter.dao
     * @kind function
     *
     * @description Retrieve single channel data from local DB
     * @return {Object} Channel data
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
     * @module starter.dao
     * @kind function
     *
     * @description Retrieve channel list from local DB
     * @return {Array} Channel data list
     */
    list : function( $scope, socket ){
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
     * @module starter.dao
     * @kind function
     *
     * @description Retrieve total unread message count from local DB
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
     * @module starter.dao
     * @kind function
     *
     * @description  Update channel name and channel users at local DB
     * @return {Object} query result
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
     * @module starter.dao
     * @kind function
     *
     * @description  Update channel info at local DB
     * @return {Object} query result
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
     * @module starter.dao
     * @kind function
     *
     * @description  insert channel info into local DB
     * @return {Object} query result
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
     * @module starter.dao
     * @kind function
     *
     * @description Insert or replace channel info with channel image at local DB
     * @return {Object} query result
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

      var currentTimestamp = Date.now();
      var cond = [
        jsonObj.channel,
        jsonObj.name,
        jsonObj.users,
        jsonObj.image,
        jsonObj.message,
        currentTimestamp,
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

        var channel = {'channel_id':jsonObj.channel,'channel_name':jsonObj.name,'unread_count': unreadCount, 'latest_message':jsonObj.message, 'channel_users':jsonObj.users.join(','), 'channel_image':jsonObj.image, 'channel_updated': currentTimestamp};

        scope.channelArray.unshift( channel );
        scope.$apply();
      }

      return DB.query(query, cond).then(function(result) {
        return result;
      });
    },
    resetCount : function( channelId ){
      var unreadCount = 1;
      var searchIndex = -1;

      if( scope != undefined ){
        var until = scope.channelArray.length;
        for( var inx = 0 ; inx < until; inx++ ){
          if( scope.channelArray[inx].channel_id == channelId ){
            searchIndex = inx;
            break;
          }
        }

        if( searchIndex > -1 ){
          var channel = scope.channelArray[ searchIndex ];
          channel.unread_count = 0;
          scope.channelArray.splice(searchIndex, 1, channel);
        }
      }
    },

    /**
     * @ngdoc function
     * @name generateId
     * @module starter.dao
     * @kind function
     *
     * @description Generate channel Id
     * @return {string} channelId
     */
    generateId : function(jsonObj){
      var channelId;

      // multi user channel = generate uuid
      if( jsonObj.U.length > 2 ){
        channelId = UTIL.getUniqueKey()+"^"+APP_INFO.appKey;;
      } else {
        // 1:1 channel = userId concat friendId
        channelId = jsonObj.U.sort().join( "$" )+"^"+APP_INFO.appKey;
      }
      return channelId;
    }
  }
})
.factory('EmoticonDao', function(DB, Sign) {

  return {
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
    list : function( channel ){
      var loginUserId = Sign.getUser().userId;
      return DB.query(
        'SELECT sender_id, sender_name, sender_image, message, time, type FROM TB_MESSAGE WHERE channel_id = ? and owner_id = ? ;', [channel,loginUserId]
      ).then(function(result) {
        return DB.fetchAll(result);
      });
    },
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

      return DB.query(query, cond).then(function(result) {
        return result;
      });
    }
  }
})
.factory('NoticeDao', function(DB, Sign) {

  return {
    /**
     * @ngdoc function
     * @name notice
     * @module starter.dao
     * @kind function
     *
     * @description Retrieve notice message from local DB
     * @return {string} Query Result
     */
    get : function( channelId ){
      var loginUserId = Sign.getUser().userId;
      return DB.query(
        'SELECT message, sender_id, updated, use_flag, fold_flag FROM TB_NOTICE WHERE channel_id = ? and owner_id = ? and use_flag = ? ;', [channelId,loginUserId,'Y']
      ).then(function(result) {
        return DB.fetch(result);
      });
    },
    /**
     * @ngdoc function
     * @name add
     * @module starter.dao
     * @kind function
     *
     * @description Insert or replace notice message at local DB
     * @return {string} Query Result
     */
    add : function( jsonObj ){
      loginUserId = Sign.getUser().userId;

      var query =  
        "INSERT OR REPLACE INTO TB_NOTICE "+
        "(message, sender_id, channel_id, updated, use_flag, fold_flag, owner_id ) VALUES "+
        "(?, ?, ?, ?, ?, ?, ?) ;";

      var cond = [
        jsonObj.MG,
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
     * @name add
     * @module starter.dao
     * @kind function
     *
     * @description Update notice message at local DB
     * @return {object} Parameter 
     * @return {string} Query Result
     */
    update : function( jsonObj ){
      loginUserId = Sign.getUser().userId;

      var query =  
        "UPDATE TB_NOTICE "+
        "SET use_flag = ? , fold_flag = ? "+
        "WHERE channel_id = ? AND owner_id = ? ; ";

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

    if( self.db.version != DB_CONFIG.version ){
      self.db.changeVersion(self.db.version, DB_CONFIG.version, function (t) {
        changeDBFlag = true;
        self.createTable( changeDBFlag );
      });
    } else {
      self.createTable( changeDBFlag );
    }
  };

  self.createTable = function( changeDBFlag ){

    angular.forEach(DB_CONFIG.tables, function(table) {
      var columns = [];

      angular.forEach(table.columns, function(column) {
        columns.push(column.name + ' ' + column.type);
      });

      if( changeDBFlag ){
        $rootScope.syncFlag = true;
        var query = 'DROP TABLE ' + table.name;
        self.query(query);
      }

      var query = 'CREATE TABLE IF NOT EXISTS ' + table.name + ' (' + columns.join(',') + ')';
      self.query(query);

      if( table.table_index != undefined ){
        for( var key in table.table_index ){
          var tableInx = table.table_index[key];
          var query = 'CREATE '+ tableInx.type +' INDEX IF NOT EXISTS ' + tableInx.name +' ON ' +table.name + ' (' + tableInx.columns.join(',') + ')';
          self.query(query);
        }
      }
    });
  };

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

  self.fetchAll = function(result) {
    var output = [];

    for (var i = 0; i < result.rows.length; i++) {
      output.push(result.rows.item(i));
    }

    return output;
  };

  self.fetch = function(result) {
    if( result.rows == undefined || result.rows.length == 0 ){
      return undefined;
    } else {
      return result.rows.item(0);
    }
  };

  return self;
});
