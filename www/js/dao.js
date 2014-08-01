angular.module('starter.dao', [])

.factory('UserDao', function(Sign, DB, UTIL) {
  return {
    createVersionTable : function(){
      var query = 'CREATE TABLE IF NOT EXISTS TB_USER_VERSION ( time integer ) ';
      DB.query(query);
    },
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
    add : function(jsonObj){
      var loginUserId = Sign.getUser().userId;

      var query = "INSERT OR REPLACE INTO TB_USER (user_id, user_name, message, image, chosung, owner_id ) ";
      query +=" VALUES ( ?, ?, ?, ?, ?, ? )";

      var currentTimestamp = Date.now();
      var cond = [
        jsonObj.user_id,
        jsonObj.user_name,
        jsonObj.message,
        jsonObj.image,
        jsonObj.chosung,
        loginUserId
      ];

      return DB.query(query, cond).then(function(result) {
        return result;
      });      
    },
    list : function( jsonObj ){
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
    get : function( channelId ){
      loginUserId = Sign.getUser().userId;
      return DB.query(
        'SELECT channel_id, channel_name, channel_users, channel_image, latest_message, unread_count, channel_updated FROM TB_CHANNEL where channel_id = ? and owner_id = ? ', [channelId,loginUserId]
      ).then(function(result) {
          return DB.fetch(result);
        });
    },
    list : function( $scope, socket ){
      scope = $scope;
      loginUserId = Sign.getUser().userId;

      return DB.query(
        'SELECT channel_id, channel_name, channel_users, channel_image, latest_message, unread_count, channel_updated FROM TB_CHANNEL where owner_id = ? ORDER BY channel_updated DESC', [loginUserId]
      ).then(function(result) {
        return DB.fetchAll(result);
      });
    },
    addCount : function(jsonObj){
      loginUserId = Sign.getUser().userId;

      var query =
        "INSERT OR REPLACE INTO TB_CHANNEL "+
        "(channel_id, unread_count, channel_updated, owner_id) "+
        "SELECT new.channel_id, IFNULL( old.unread_count, new.unread_count) as unread_count, new.channel_updated, new.owner_id "+
        "FROM ( "+
        "  SELECT ? as channel_id, 0 as unread_count , ? as channel_updated, ? as owner_id " +
        ") as new " +
        " LEFT JOIN ( " +
        "   SELECT channel_id, unread_count + 1 as unread_count, channel_updated, owner_id " +
        "   FROM TB_CHANNEL " +
        " ) AS old ON new.channel_id = old.channel_id AND new.owner_id = old.owner_id ; ";

      var cond = [
        jsonObj.channel,
        Date.now(),
        loginUserId
      ];

      return DB.query(query, cond).then(function(result) {
        return result;
      });

    },
    getAllCount : function(jsonObj){
      loginUserId = Sign.getUser().userId;

      return DB.query(
        'SELECT sum( unread_count ) as total_count FROM TB_CHANNEL where owner_id = ? ', [loginUserId]
      ).then(function(result) {
        return DB.fetch(result);
      });
    },
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
    generateId : function(jsonObj){
      var channelId;
      if( jsonObj.U.length > 2 ){
        channelId = UTIL.getUniqueKey()+"^"+APP_INFO.appKey;;
      } else {
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
.factory('DB', function($q, $rootScope, DB_CONFIG) {
  var self = this;
  self.db = null;
  var changeDBFlag = false;
  $rootScope.syncFlag = false;

  self.init = function() {

    try {
      if (!window.openDatabase) {
        window.plugins.toast.showShortCenter(
          "죄송합니다. DB를 지원하지 않습니다. \n북마크 기능을 사용하실 수 없습니다.",function(a){},function(b){}
        );
      } else {
        var shortName = DB_CONFIG.name;
        var displayName = 'news database';
        var maxSize = 5 * 1024 * 1024; // in bytes
        self.db = openDatabase(shortName, '', displayName, maxSize);      
      }
    } catch(e) {
      // Error handling code goes here.
      if (e == INVALID_STATE_ERR) {
        // Version number mismatch.
        window.plugins.toast.showShortCenter(
          "죄송합니다. DB 버젼을 지원하지 않습니다.\n북마크 기능을 사용하실 수 없습니다.",function(a){},function(b){}
        );
        return;
      } else {
        window.plugins.toast.showShortCenter(
          "죄송합니다. "+e+"\n북마크 기능을 사용하실 수 없습니다.",function(a){},function(b){}
        );
        return;
      }
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

    if( !changeDBFlag ){
      var query = "SELECT name FROM sqlite_master WHERE type='table' AND name='TB_USER_VERSION' ";
      self.query(query).then(function(result) {
        var result = self.fetchAll(result);
        if ( result.length == 0 ) {
          $rootScope.syncFlag = true;
        }
      });
    }

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