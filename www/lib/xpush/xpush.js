/**
 * @version 0.1
 * @module xpush
 */
(function() {

  var SESSION = 'session';
  var CHANNEL = 'channel';

  var ST = {A:'app',C:'channel',U:'userId',US:'users',D:'deviceId',N:'notiId',S:'server'
  ,MG:'message',NM:'name',PW:'password',GR:'groups',DT:'datas',MD:'mode',TS:'timestamp'
  ,SS:'socketId',CD:'createDate',UD:'updateDate'};

  var socketOptions ={
    transports: ['websocket']
    ,'force new connection': true
  };

  var RMKEY = 'message';
  
  /**
   * Represents a Xpush.
   * @exports xpush
   * @constructor
   * @param {string} host - connect to host
   * @param {string} appId - application id
   * @param {string} eventHandler - Optional function for eventHandler
   * @param {boolean} autoInitFlag - Optional parameter for initilize channel automatically
   */
  var XPush = function(host, appId, eventHandler, autoInitFlag){
    if(!host){alert('params(1) must have hostname'); return;}
    if(!appId){alert('params(2) must have appId'); return;}
    var self = this;
    self.appId = appId;             // applicationKey
    self._channels = {};      // channel List

    self.initStatus;          // manage async problem
    self.headers = {};        // request header
    self.liveSockets = {}; // ch : Connection
    self._sessionConnection;
    self.maxConnection = 5;
    self.maxTimeout = 30000;
    self.channelNameList = [];
    self.hostname = host;
    self.receiveMessageStack = [];
    self.isExistUnread = true;
    self.autoInitFlag = true;

    if( autoInitFlag !=undefined ){
      self.autoInitFlag = autoInitFlag;
    }

    self.on('newChannel',function(data){
      self.channelNameList.push( data.chNm );
    });

    if(eventHandler){
      self._isEventHandler = true;
      self.on('___session_event', eventHandler);
    }
  };

  XPush.Context = {
    SessionServer : '/session', //'/session',
    ChannelServer : '/cs', // /cs/:channel ( header: appKey )
    SIGNUP : '/user/register',
    LOGIN : '/auth',
    Channel : '/channel',
    Signout : '/signout',
    Message : '/msg',
    NODE : '/node'
  };

  /**
   * Register User with userId and password
   * @function
   * @param {string} userId - User Id
   * @param {string} password - Password
   * @param {string} deviceId - Device Id ( Optional. default `WEB` )
   * @param {signupCallback}
   */
  XPush.prototype.signup = function(userId, password, deviceId, cb){
    var self = this;

    if(typeof(deviceId) == 'function' && !cb){
      cb = deviceId;
      deviceId = 'WEB';
    }

    var sendData = {A:self.appId , U: userId, PW: password, D: deviceId};
    self.ajax( XPush.Context.SIGNUP , 'POST', sendData, cb);
  };

  /**
   * Login with userId and password
   * @function
   * @param {string} userId - User Id
   * @param {string} password - Password
   * @param {string} deviceId - Device Id ( Optional. default `WEB` )
   * @param {string} mode - Mode ( Optional. CHANNLE_ONLY )
   * @param {loginCallback}
   */
  XPush.prototype.login = function(userId, password, deviceId, mode, cb){
    var self = this;

    if(typeof(deviceId) == 'function' && !mode && !cb){
      cb = deviceId;
      deviceId = 'WEB';
    }

    if(typeof(mode) == 'function' && !cb){
      cb = mode;
    }

    self.userId = userId;
    self.deviceId = deviceId;
    var sendData = {A: self.appId, U: userId, PW: password, D: deviceId};
    if(mode) sendData.MD = mode;

    self.ajax( XPush.Context.LOGIN , 'POST', sendData, function(err, result){

      if(err){
        if(cb) cb(err, result);
        return;
      }

      if(result.status == 'ok'){
        // result.result = {"token":"HS6pNwzBoK","server":"215","serverUrl":"http://www.notdol.com:9990"};
        var c = self._sessionConnection = new Connection(self, SESSION, result.result);

        c.connect(function(){
          console.log("xpush : login end", self.userId);
          self.initSessionSocket(self._sessionConnection._socket, function(){
            if(cb) cb(result.message, result.result); // @ TODO from yohan.
          });
        });
      }else{
        if(cb) cb(result.message);
        alert('xpush : login error'+ result.message);
      }
    });
  };

  /**
   * Set userId and deviceId at scope
   * @function
   * @param {string} userId - User Id
   * @param {string} deviceId - Device Id
   * @param {setSessionInfoCallback}
   */
  XPush.prototype.setSessionInfo = function(userId, deviceId, cb){
    var self = this;

    if(typeof(deviceId) == 'function' && !cb){
      cb = deviceId;
      deviceId = 'WEB';
    }

    self.userId = userId;
    self.deviceId = deviceId;

    cb();
  };

  /**
   * Disconnect session or channel connection
   * @function
   */
  XPush.prototype.logout = function(){
    var self = this;
    if( self != undefined ) {

      // Disconnect session connection
      if( self._sessionConnection != undefined  ){
        self._sessionConnection.disconnect();
      }

      // Disconnect channel connections
      if( self._channels != undefined  ){
        for( var key in self._channels ){
          if( self._channels[key]._connected ){
            self._channels[key].disconnect();
          }
        }
      }
    }      
  };

  /**
   * Create channel with users and datas
   * @function
   * @param {string} userId - User Array for channel create
   * @param {string} channel - Channel Id
   * @param {Object} datas - Optional Data for additional channel info
   * @param {createChannelCallback}
   */
  XPush.prototype.createChannel = function(users, channel, datas, cb){
    var self = this;
    var channels = self._channels;

    if(typeof(channel) == 'function' && !cb){
      cb = channel; channel = undefined;
    }

    var newChannel;
    var channelNm = channel;
    //var oldChNm = channelNm;

    //Add logined user if not in users
    if( users.indexOf(self.userId) < 0 ){
      users.push(self.userId);
    }

    self.sEmit('channel-create',{C: channel, U: users, DT:datas},function(err, result){
      //_id: "53b039e6a2f41316d7046732"
      //app: "stalk-io"
      //channel: "b14qQ6wI"
      //created: "2014-06-29T16:08:06.684Z"
      if(err && err != 'WARN-EXISTED') {
        if(cb){
          cb(err, result);
        }
      }
      channelNm = result.C || channelNm;
      self.getChannelInfo(channelNm,function(err,data){
        //channel , seq, server.channel,name,url

        if(err){
          console.log(" == node channel " ,err);
        }else if ( data.status == 'ok'){
          newChannel.setServerInfo(data.result);
          //newChannel.chNm = channelNm;
          channels[channelNm] = newChannel;
          //if(oldChNm){
          //  delete channels[oldChNm];
          //}
          if(cb)cb(null, channelNm);
        }
      });
    });
    newChannel = self._makeChannel(channelNm);
    return newChannel;
  };

  /**
   * Create new channel mode `CHANNEL_ONLY`
   * @function
   * @param {string} channel - Channel Id
   * @param {Object} userObj - Optional. UserObject( U : userID, D : deviceId )
   * @param {createSimpleChannelCallback}
   */
  XPush.prototype.createSimpleChannel = function(channel, userObj, cb){
    var self = this;

    var ch = self._makeChannel(channel);
    self.getChannelInfo(channel,function(err,data){
      if(err){
        console.log(" == node channel " ,err);
        if(cb) cb(err);
      }else if ( data.status == 'ok'){

        if(userObj){
          self.userId = userObj.U || 'someone';
          self.deviceId = userObj.D || 'WEB';
        }else{
          self.userId = 'someone';
          self.deviceId = 'WEB';
        }

        ch.info = data.result;
        ch._server = {serverUrl : data.result.server.url};
        ch.chNm = data.result.channel;

        ch.connect(function(){
          if(cb) cb();
        }, 'CHANNEL_ONLY');

      }
    });

  };

  /**
   * Get channel list at xpush server with xpush API `channel-list`
   * @function
   * @param {getChannlesCallback}
   */
  XPush.prototype.getChannels = function(cb){
    var self = this;
    console.log("xpush : getChannels ",self.userId);
    self.sEmit('channel-list',function(err, result){
      //app(A), channel(C), created(CD) , users(US)
      console.log("xpush : getChannels end ",result);
      ['A','C','CD','US'].forEach(function(item){
        UTILS.changeKey(result,item);
      });
      if(result.length > 0){
        result.forEach(function(r){
          ['D','N','U'].forEach(function(item){
            UTILS.changeKey(r.users,item);
          });
        });
      }
      cb(err,result);
    });
  };

  /**
   * Update channel info at xpush server with xpush API `channel-update`
   * @function
   * @param {string} channel - Channel Id
   * @param {Object} query - JSON Object for update. query is mongo DB style
   * @param {updateChannelCallback}
   */
  XPush.prototype.updateChannel = function(channel, query, cb){
    var self = this;
    var param = { 'A': self.appId, 'C': channel, 'Q' : query };
    self.sEmit('channel-update', param, function(err, result){
      //app(A), channel(C), created(CD) , users(US)
      console.log("xpush : channel-update end ",result);
      cb(err,result);
    });
  };

  /**
   * Get channel list in redis with key
   * @function
   * @param {Object} data - ( 'key': '' )
   * @param {getChannelsActiveCallback}
   */
  XPush.prototype.getChannelsActive = function(data, cb){ //data.key(option)
    var self = this;
    self.sEmit('channel-list-active',data, function(err, result){
      //app, channel, created
      cb(result);
    });
  };

  /**
   * Get channel info in xpush object
   * @function
   * @param {string} channel - Channel Id
   * @return {object} return Channel Object
   */
  XPush.prototype.getChannel = function(channel){
    var self = this;
    var channels = self._channels;
    for(var k in channels){
      if(k == channel) return channels[k];
    }

    return undefined;
  };

  /**
   * Get channel info at xpush server with xpush API `channel-get`
   * @function
   * @param {string} channel - Channel Id
   * @param {getChannelDataCallback}
   */
  XPush.prototype.getChannelData = function(channel, cb){
    var self = this;
    self.sEmit('channel-get', {C: channel, U: /*userId*/{} }, function(err, result){
      if(cb) cb(err,result);
    });
  };

  /**
   * Join channel
   * @function
   * @param {string} channel - Channel Id
   * @param {Object} param - Channel Id
   * @param {joinChannelCallback}
   */
  XPush.prototype.joinChannel = function(channel, param, cb){
    var self = this;
    self._getChannelAsync(channel, function (err, ch){
      ch.joinChannel( param, function( data ){
        cb( data );
      });
    });
  };

  /**
   * Exit channel
   * @function
   * @param {string} channel - Channel Id
   * @param {exitChannelCallback}
   */
  XPush.prototype.exitChannel = function(channel, cb){
    var self = this;
    self.sEmit('channel-exit', {C: channel}, function(err, result){
      if(cb) cb(err,result);
    });
  };

  /**
   * Get channel info asynchronous. If channel is not exist in channel, call serverAPI
   * @function
   * @param {string} channel - Channel Id
   * @param {_getChannelAsyncCallback}
   */
  XPush.prototype._getChannelAsync = function(channel, cb){
    var self = this;
    var ch = self.getChannel(channel);
    if(!ch){
      self._channels[channel] = ch;
      ch = self._makeChannel(channel);
      self.getChannelInfo(channel,function(err,data){
        if(err){
          console.log(" == node channel " ,err);
          cb(err);
        }else if ( data.status == 'ok'){
          ch.setServerInfo(data.result, function(){
            cb(false, ch);
          });
        }
      });
    }else{
      cb(false, ch);
    }
  };

  /**
   * Upload file DOM Object with socket stream
   * @function
   * @param {string} channel - Channel Id
   * @param {object} inputObj - JSON Objec( 'file' : file DOM Oject for upload, 'type' : '' )
   * @param {function} fnPrg - callback function for progressing status
   * @param {uploadStreamCallback} fnCallback
   */
  XPush.prototype.uploadStream = function(channel, inputObj, fnPrg, fnCallback){
    var self = this;

    self._getChannelAsync(channel, function (err, ch){

      var blobs   = [];
      var streams = [];

      for(var i=0; i<inputObj.file.files.length; i++){
        var file   = inputObj.file.files[i];
        var bufferSize = 128;

        // larger than 1M
        if( file.size > ( 1024 * 1024 ) ){
          bufferSize = 256;
        } else if ( file.size > ( 4 * 1024 * 1024 ) ){
          bufferSize = 512;
        }
        
        var size   = 0;
        streams[i] = ss.createStream({highWaterMark: bufferSize * 1024});
        blobs[i]   = ss.createBlobReadStream(file, {highWaterMark: bufferSize * 1024});

        blobs[i].on('data', function(chunk) {
          size += chunk.length;
          fnPrg(Math.floor(size / file.size * 100), i);
        });

        var _data = {};
        _data.orgName = file.name;
        if(inputObj.overwrite) _data.name = file.name;
        if(inputObj.type)      _data.type = inputObj.type;

        ch.upload(streams[i], _data, function(result){
          fnCallback(result, i);
        });
        blobs[i].pipe(streams[i]);
      }

    });
  };

  /**
   * Upload file with JSON Object for mobile user
   * @function
   * @param {string} channel - Channel Id
   * @param {string} fileUri - FileUri for update
   * @param {object} inputObj - JSON Objec( 'type' : '', 'name' : Original File name )
   * @param {function} fnPrg - callback function for progressing status
   * @param {uploadFileCallback} fnCallback
   */
  XPush.prototype.uploadFile = function(channel, fileUri, inputObj, fnPrg, fnCallback){
    var self = this;

    self._getChannelAsync(channel, function(err, ch){

      if(window.FileTransfer && window.FileUploadOptions){

        var url = ch._server.serverUrl+'/upload';

        var options = new FileUploadOptions();
        options.fileKey="post";
        options.chunkedMode = false;
        options.params = {
          'key1': 'VAL1',
          'key2': 'VAL2'
        };
        options.headers = {
          'XP-A': self.appId,
          'XP-C': channel,
          'XP-U': JSON.stringify({
            U: self.userId,
            D: self.deviceId
          }) //[U]^[D]^[TK] @ TODO add user token
        };
        options.headers['XP-FU-org'] = inputObj.name;
        if(inputObj.overwrite) options.headers['XP-FU-nm'] = inputObj.name;
        if(inputObj.type)      options.headers['XP-FU-tp'] = inputObj.type;

        var ft = new FileTransfer();
        if( fnPrg != undefined ){
          ft.onprogress = function(progressEvent) {
            if (progressEvent.lengthComputable) {
              var perc = Math.floor(progressEvent.loaded / progressEvent.total * 100);
              fnPrg( perc);
            }
          };
        }

        ft.upload(fileUri, encodeURI(url), function(data){
          fnCallback(data);
          //$scope.picData = FILE_URI;
          //$scope.$apply();
        }, function(e) {
            console.log("On fail " + e);
        }, options);

      }

    });
  };

  /**
   * Get uploaded file url
   * @function
   * @param {string} channel - Channel Id
   * @param {string} fileName - File name
   * @return {string} file download url
   */
  XPush.prototype.getFileUrl = function(channel, fileName){

    var self = this;
    var ch = self.getChannel(channel);

    var result = ch.info.server.url +
      '/download/' +
      ch._xpush.appId +
      '/'+ch.info.channel +
      '/'+ch._xpush.userId +
      '/'+ch._socket.io.engine.id +
      '/'+fileName;

    return result;
  };

  /**
   * Get channel object if channle is connected. Or create new `Connect` Object
   * @private
   * @function
   * @param {string} channel - Channel Id
   * @return {Object} Connect Object
   */
  XPush.prototype._makeChannel = function(channel){
    var self = this;
    console.log('xpush : connection _makeChannel ',channel);
    for( var key in self._channels ){
      if( key == channel && self._channels[key] != undefined && self._channels[key]._connected ){
        return self._channels[key];
      }
    }

    var ch = new Connection(self,CHANNEL);
    if(channel) {
      ch.channel = channel;
      self._channels[channel] = ch;
    }
    return ch;
  };

  XPush.prototype.calcChannel = function(ch){
    var self = this;
    if(self._channels.length >= self.maxConnection){
      self._deleteChannel(self._channels[self._channels.length-1]);
    }
    /*
    if(ch){
      if(self._channels[0] != ch){
        for(var i  = 1 ; i < self._channels.length ; i++){
          if( self._channels[i] == ch){
            self._channels.unshift( self._channels.splice(i,1));
          }
        }
      }
    }
    */
  };

  /**
   * Disconnect channel connection and delete channel in Connection Object
   * @private
   * @function
   * @param {Object} channel - Channel Id
   */
  XPush.prototype._deleteChannel = function(channelObject){
    var self = this;
    for(var k in self._channels){
      if(self._channels[k] == channelObject){
        self._channels[k].disconnect();
        delete self._channels[k];
        break;
      }
    }
  };

  /**
   * If channels is exist return true or false
   * @function
   * @param {string} channel - Channel Id
   * @return {boolean}
   */
  XPush.prototype.isExistChannel = function(channel){
    var self = this;
    for(var i = 0 ; i < self.channelNameList.length ; i++){
      if(self.channelNameList[i] == channel){
        return true;
      }
    }
    return false;
  };

  /**
   * Get user list at xpush server with xpush API `user-list`
   * @function
   * @param {object} params - Optional param for search user.
   * @param {getUserListCallback}
   */
  XPush.prototype.getUserList = function(params,  cb){
    if(typeof(params) == 'function'){
      cb = params;
      params = {};
    }
    params = params == undefined ? {}: params;
    var self = this;
    console.log("xpush : getUsertList ",params);
    self.sEmit('user-list' , params, function(err, result){
      if(cb) cb(err, result.users, result.count);
    });
  };

  //params.key, value
  XPush.prototype.queryUser = function(_params,  cb){

    var self = this;

    if(!_params.query) {
      console.error('Query User', 'query is not existed.');
    };
    if(!_params.column) {
      console.error('Query User', 'column is not existed.');
    };

    var params = {
      query : _params.query,
      column: _params.column
    };

    if(_params.options) params['options'] = _params.options;

    console.log("xpush : queryUser ",params);

    self.sEmit('user-query' , params, function(err, result){
        if(cb) cb(err, result.users, result.count);
    });

  };

  XPush.prototype.send = function(channel, name, data){
    var self = this;

    self._getChannelAsync(channel, function (err, ch){
      ch.send(name,data);
    });
  };

  XPush.prototype.getUnreadMessage = function(cb){
    var self = this;
    console.log("xpush : getUnreadMessage ",self.userId);
    self.sEmit('message-unread',function(err, result){
      //app, channel, created
      console.log("xpush : getUnreadMessage end ", result);
      if(result && result.length > 0){
        result.sort(UTILS.messageTimeSort);
      }

      self.sEmit('message-received');
      cb(err, result);
    });
  };

  XPush.prototype.getChannelInfo = function(channel, cb){
    var self = this;
    console.log("xpush : getChannelInfo ",channel);
    self.ajax( XPush.Context.NODE+'/'+self.appId+'/'+channel , 'GET', {}, cb);
  };

  XPush.prototype.getGroupUsers = function(groupId,cb){
    var self = this;
  if(typeof(arguments[0]) == 'function') {cb = arguments[0]; groupId = undefined;}
    groupId = groupId ? groupId : self.userId;
    self.sEmit('group-list',{'GR': groupId}, function(err,result){
      cb(err,result);
    });
  };

  XPush.prototype.addUserToGroup = function(groupId, userIds,cb){
    var self = this;
    if(typeof(arguments[1]) == 'function') {cb = arguments[1]; userIds = groupId; groupId = undefined;}
    groupId = groupId ? groupId : self.userId;
    userIds = userIds ? userIds : [];
    self.sEmit('group-add',{'GR': groupId, 'U': userIds}, function(err,result){
      //app, channel, created
      cb(err,result);
    });
  };

  XPush.prototype.removeUserFromGroup = function(groupId, userId, cb){
    var self = this;
  if(typeof(arguments[1]) == 'function') {cb = arguments[1]; userId = groupId; groupId = undefined;}
    groupId = groupId ? groupId : self.userId;

    self.sEmit('group-remove',{'GR': groupId, 'U': userId}, function(err, result){
        cb(err,result);
    });
  };

  XPush.prototype.getGroups = function(){
    // not defined yet
  };

  XPush.prototype.signout = function(cb){
    //session end
    var self = this;
    var sendData = { };
    self.ajax( XPush.Context.Signout , 'POST', sendData, cb);
  };

  XPush.prototype.initSessionSocket = function(socket,cb){
    var self = this;
    socket.on('_event',function(data){
      console.log('xpush : session receive ', data.event, data.C,data.NM,data.DT, self.userId);
      // data.event = NOTIFICATION
      // channel,name, timestamp, data= {}
      switch(data.event){
        case 'NOTIFICATION':
          var ch = self.getChannel(data.C);

          if( self.autoInitFlag ){
            if(!ch){
              ch = self._makeChannel(data.C);

              self.getChannelInfo(data.C,function(err,data){

                if(err){
                  console.log(" == node channel " ,err);
                }else if ( data.status == 'ok'){
                  ch.setServerInfo(data.result);
                }
              });
              //self.emit('channel-created', {ch: ch, chNm: data.channel});
              if(!self.isExistChannel(data.channel)) {
                self.emit('newChannel', ch);
              }
            }
            ch.emit(data.NM , data.DT);
          }
          self.emit(data.NM, data.C, data.NM, data.DT);
        break;

        case 'CONNECT' :
          self.emit('___session_event', 'SESSION', data);
        break;

        case 'DISCONNECT' :
          self.emit('___session_event', 'SESSION', data);
        break;

        case 'LOGOUT' :
          console.log('LOGOUT', data);
          self.emit('___session_event', 'LOGOUT', data);
        break;

      }

    });
    socket.on('channel',function(data){
      console.log('xpush : session receive ', 'channel', data, self.userId);

      switch(data.event){
        case 'UPDATE':
      // event: update , app,channel,server,count
        break;

        case 'REMOVE' :
      // event: remove , app,channel
        break;
      }
    });
    socket.on('connected',function(){
      console.log('xpush : session receive ', CHANNEL, arguments, self.userId);
    });


    if( self.autoInitFlag ){
      self.getChannels(function(err,data){
        self.channelNameList = data;
        if(cb) cb();
      });
    } else {
      if(cb) cb();
    }

    if( self.autoInitFlag ){
      socket.on('connect',function(){
        self.getUnreadMessage(function(err, data){
          if(data && data.length > 0 ){
            for(var i = data.length-1 ; i >= 0; i--){

              data[i].MG.DT = JSON.parse(data[i].MG.DT);
              self.receiveMessageStack.unshift([RMKEY,  data[i].MG.DT.C, data[i].NM,  data[i].MG.DT]);
              //self.emit(RMKEY,  data[i].message.data.channel, data[i].name,  data[i].message.data);
            }
            self.isExistUnread = false;
            while(self.receiveMessageStack.length > 0 ){
              var t = self.receiveMessageStack.shift();
              self.emit.apply(self, t );
            }
          }else{
            self.isExistUnread = false;
          }
        });
      });
    }

    socket.on('disconnect',function(){
      self.isExistUnread = true;
    });
  };

  XPush.prototype.ajax = function( context, method, data, headers, cb){
    var self = this;

    if(typeof(headers) == 'function' && !cb){
      cb = headers;
      headers = false;
    }

    var xhr;
    try{
      xhr = new XMLHttpRequest();
    }catch (e){
      try{
        xhr = new XDomainRequest();
      } catch (e){
        try{
          xhr = new ActiveXObject('Msxml2.XMLHTTP');
        }catch (e){
          try{
            xhr = new ActiveXObject('Microsoft.XMLHTTP');
          }catch (e){
            console.error('\nYour browser is not compatible with XPUSH AJAX');
          }
        }
      }
    }

    var _url = self.hostname+context;

    var param = Object.keys(data).map(function(k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]);
    }).join('&');

    method = (method.toLowerCase() == "get") ? "GET":"POST";
    param  = (param == null || param == "") ? null : param;
    if(method == "GET" && param != null){
      _url = _url + "?" + param;
    }

    xhr.open(method, _url, true);
    xhr.onreadystatechange = function() {

      if(xhr.readyState < 4) {
        return;
      }

      if(xhr.status !== 200) {
        console.log("xpush : ajax error", self.hostname+context,param);
        cb(xhr.status,{});
      }

      if(xhr.readyState === 4) {
        var r = JSON.parse(xhr.responseText);
        if(r.status != 'ok'){
          cb(r.status,r.mesage);
        }else{
          cb(null,r);
        }
      }
    };

    console.log("xpush : ajax ", self.hostname+context,method,param);

    if(headers) {
      for (var key in headers) {
        if (headers.hasOwnProperty(key)) {
          xhr.setRequestHeader(key, headers[key]);
        }
      }
    }
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send( (method == "POST") ? param : null);

    return;
  };

  XPush.prototype.sEmit = function(key, params, cb){
    var self = this;

    var returnFunction = function(result){

      if(result.status == 'ok'){
        cb(null, result.result);
      }else{
        if(result.status.indexOf('WARN') == 0){
          console.warn("xpush : ", key, result.status, result.message);
        }else{
          console.error("xpush : ", key, result.status, result.message);
        }
        cb(result.status, result.message);
      }
    };

    if( typeof(arguments[1]) == 'function' ){
      cb = params;
      self._sessionConnection._socket.emit(key, returnFunction);
    }else{
      self._sessionConnection._socket.emit(key, params, returnFunction);
    }
    return;
  };

  XPush.prototype.on = function(event, fct){
    var self = this;
    self._events = self._events || {};
    self._events[event] = self._events[event] || [];
    self._events[event].push(fct);
    /*
    if(event == RMKEY ){
      self.getUnreadMessage(function(err, data){
        if(data && data.length > 0 )
        for(var i = data.length ; i > 0; i--){
          data[i].message.data = JSON.parse(data[i].message.data);
          self.receiveMessageStack.shift([RMKEY,  data[i].message.data.channel, data[i].name,  data[i].message.data]);
          //self.emit(RMKEY,  data[i].message.data.channel, data[i].name,  data[i].message.data);
        }
        self.isExistUnread = false;
        for(var i = 0 ; i < self.receiveMessageStack.length;i++){
          self.emit.apply(self, self.receiveMessageStack[i]);
        }
      });
    };
    */
    /*
    if(event == RMKEY ){
      self.getUnreadMessage(function(err, data){
        console.log("================================= " ,data);
        self._events = self._events || {};
        self._events[event] = self._events[event] || [];
        self._events[event].push(fct);

        if(data && data.length > 0 )
        for(var i = data.length ; i > 0; i--){
          data[i].message.data = JSON.parse(data[i].message.data);
          receiveMessageStack.shift([RMKEY,  data[i].message.data.channel, data[i].name,  data[i].message.data]);
          //self.emit(RMKEY,  data[i].message.data.channel, data[i].name,  data[i].message.data);
        }

        self.isExistUnread = false;
      });
    }else{
      self._events = self._events || {};
      self._events[event] = self._events[event] || [];
      self._events[event].push(fct);
    }
    */
  };

  XPush.prototype.off = function(event, fct){
    var self = this;
    self._events = self._events || {};
    if( event in self._events === false  )  return;
    self._events[event].splice(self._events[event].indexOf(fct), 1);
  };
  XPush.prototype.emit = function(event){
    var self = this;
    if(self.isExistUnread) {
      self.receiveMessageStack.push(arguments);
    }else{
      self._events = self._events || {};
      if( event in self._events === false  )  return;
      for(var i = 0; i < self._events[event].length; i++){
        console.log("xpush : test ",arguments);
        self._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
      }
    }
  };

  var Connection = function(xpush , type, server){

    this._xpush = xpush;
    this._server = server;
    this._type = type;
    if(this._type == SESSION){
      this.chNm = SESSION;
    }
    this._socketStatus; // disconnected, connected
    this._socket;
    this.checkTimer;
    this.info;
    this.messageStack = [];
    this.isFirtConnect = true;
    this._connected = false;

    //self.on('received', function(data){
      //self._xpush.calcChannel(self);
    //});
  };

  Connection.timeout = 30000;

  Connection.prototype.checkConnectionTimeout = function(b){
    var self = this;
    if(self.checkTimer) clearTimeout(self.checkTimer);

    if(b){
      self.checkTimer = setTimeout(function(){
        self._socket.disconnect();
      }, self.timeout);
    }
  };

  Connection.prototype.setServerInfo = function(info,cb){
    console.log("xpush : setServerInfo ", info);
    var self = this;
    self.info = info;
    self._server = {serverUrl : info.server.url};
    self.chNm = info.channel;
    self.connect(function(){
      console.log("xpush : setServerInfo end ", arguments,self._xpush.userId, self.chNm);
      //self.connectionCallback();
      if(cb) cb();
    });
  };

  Connection.prototype.connect = function(cbConnect, mode){
    var self = this;
      var query =
        'A='+self._xpush.appId+'&'+
        'U='+self._xpush.userId+'&'+
        'D='+self._xpush.deviceId+'&'+
        'TK='+self._server.token;
        //'mode=CHANNEL_ONLY';

    if(self._type == CHANNEL){
      query =
        'A='+self._xpush.appId+'&'+
        'C='+self.chNm+'&'+
        'U='+self._xpush.userId+'&'+
        'D='+self._xpush.deviceId+'&'+
        'S='+self.info.server.name;

      if(mode){
        if(mode == 'CHANNEL_ONLY'){
          self._xpush.isExistUnread = false;
        }
        query = query +'&MD='+ mode;
      }
    }

    self._socket = io.connect(self._server.serverUrl+'/'+self._type+'?'+query, socketOptions);

    console.log( 'xpush : socketconnect', self._server.serverUrl+'/'+self._type+'?'+query);
    self._socket.on('connect', function(){
      console.log( 'channel connection completed' );
      while(self.messageStack.length > 0 ){
        var t = self.messageStack.shift();
        //.self.send(t.NM, t.DT);
        self._socket.emit('send', {NM: t.NM , DT: t.DT});
      }
      self._connected = true;
      if(!self.isFirtConnect) return;
      self.isFirtConnect = false;
      self.connectionCallback(cbConnect);
    });

    self._socket.on('disconnect',function(){
      self._connected = false;
    });
  };

  Connection.prototype.connectionCallback = function(cb){
    var self = this;
    console.log("xpush : connection ",'connectionCallback',self._type, self._xpush.userId,self.chNm);

    self._socket.on('message',function(data){
      console.log("xpush : channel receive ", self.chNm, data, self._xpush.userId);
      self._xpush.emit(RMKEY, self.chNm, RMKEY , data);
    });

    self._socket.on('system',function(data){
      console.log("xpush : channel receive system", self.chNm, data, self._xpush.userId);
      self._xpush.emit("system", self.chNm, "system" , data);
    });

    if(self._xpush._isEventHandler) {

      self._socket.on('_event',function(data){

        switch(data.event){
          case 'CONNECTION' :
            self._xpush.emit('___session_event', 'CHANNEL', data);
          break;
          case 'DISCONNECT' :
            self._xpush.emit('___session_event', 'CHANNEL', data);
          break;
        }

      });
    }

    if(cb)cb();
  };

  Connection.prototype.disconnect = function(){
    console.log("xpush : socketdisconnect ", this.chNm, this._xpush.userId);
    this._socket.disconnect();
    //delete this._socket;
  };

  Connection.prototype.send = function(name, data,cb){
    var self = this;
    if(self._connected){
      self._socket.emit('send', {NM: name , DT: data});
    }else{
      self.messageStack.push({NM: name, DT: data});
    }
  };

  Connection.prototype.joinChannel = function(param, cb){
    var self = this;
    if(self._socket.connected){
      self._socket.emit('join', param, function( data ){
        cb( data );
      });
    }
  };

  Connection.prototype.upload = function(stream, data, cb){
    var self = this;
    if(self._socket.connected){
      ss(self._socket).emit('file-upload', stream, data, cb);
    }
  };

  Connection.prototype.on = function(event, fct){
   var self = this;
    self._events = self._events || {};
    self._events[event] = self._events[event] || [];
    self._events[event].push(fct);
  };
  Connection.prototype.off = function(event, fct){
    var self = this;
    self._events = self._events || {};
    if( event in self._events === false  )  return;
    self._events[event].splice(self._events[event].indexOf(fct), 1);
  };
  Connection.prototype.emit = function(event /* , args... */){
    var self = this;
    self._events = self._events || {};
    if( event in self._events === false  )  return;
    for(var i = 0; i < self._events[event].length; i++){
      self._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
    }
  };

  var UTILS = {};

  UTILS.messageTimeSort = function(a,b){
    // created data
    return a.created > b.created;
  };

  UTILS.changeKey = function(data, key){
    if(data instanceof Array){
      data.forEach(function(d){
        d[ ST[key] ] = d[key];
        delete d[key];
      });
    }else{
      data[ ST[key] ] = data[key];
      delete data[key];
    }
  };
  //window.XPush = new XPush();
  window.XPush = XPush;

})();