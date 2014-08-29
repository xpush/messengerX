;(function() {

  var localStream;
  var pc;
  var remoteStream;
  var turnReady;

  var xpush;
  var channel;
  var channelNm;
  var userId;

  var localVideo;
  var remoteVideo;

  var turnUrl='https://computeengineondemand.appspot.com/turn?username=92474599&key=4080218913';

  var CONFIG = {};
  var STATUS = {
    READY: false,
    INIT: false,
    STARTED: false
  };

  var _initProcess = function (type, data){
    console.log('EVENT', type, data);

    if(data.event == 'CONNECTION' && userId == data.U){

      //maybeRequestTurn();

      if(!channel){
        channel = xpush.getChannel(channelNm);
      }

      // channel 연결 후!
      if(data.count == 1){ // created
        STATUS.INIT = true;
      }else if(data.count == 2){ // joined

        STATUS.READY = true;
        channel.send('message', 'JOIN');

      }else if(data.count == 0 || data.count > 2){
        console.error('FULL!! & something is wrong.. (_ _); ');

      }

      getUserMedia(CONFIG.constraints, handleUserMedia, handleUserMediaError);

    }

  };

  var XWebRTC = function(_host, _app, _channelName, _userId, _localVideo, _remoteVideo){
    var self = this;

    CONFIG.constraints    = {'audio': true, 'video': true};
    CONFIG.pc             = {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};
    CONFIG.pcConstraints  = {'optional': [{'DtlsSrtpKeyAgreement': true}]};
    CONFIG.sdpConstraints = {'mandatory': {'OfferToReceiveAudio':true,'OfferToReceiveVideo':true }};

    channelNm   = _channelName;
    localVideo  = _localVideo;
    remoteVideo = _remoteVideo;
    userId      = _userId.U;

    xpush = new XPush(_host, _app, _initProcess);

    xpush.createSimpleChannel(_channelName, _userId, function(err, data){
      if(err){
        console.error("CHANNEL CREATE" ,err);
      }
    });

    xpush.on('message',function(ch, name, message){

      console.log('    ---------------- ', ch, name, message);

      if (message === 'MEDIA') {
  	     maybeStart();

      }else if (message === 'JOIN') {
         STATUS.READY = true;

      } else if (message.type === 'offer') {

        console.warn(STATUS);

        if (!STATUS.INIT && !STATUS.STARTED) {
          maybeStart();
        }
        pc.setRemoteDescription(new RTCSessionDescription(message));
        doAnswer();

      } else if (message.type === 'answer' && STATUS.STARTED) {
        pc.setRemoteDescription(new RTCSessionDescription(message));

      } else if (message.type === 'candidate' && STATUS.STARTED) {
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: message.label,
          candidate: message.candidate
        });
        pc.addIceCandidate(candidate);
      }

    });

  };

  var handleUserMedia = function(stream) {
    console.log('Adding local stream.');
    localVideo.src = window.URL.createObjectURL(stream);
    localStream = stream;
    channel.send('message', 'MEDIA');
    if (STATUS.INIT) {
      maybeStart();
    }
  };

  var handleUserMediaError = function(error){
    console.log('getUserMedia error: ', error);
  };

  var maybeStart = function () {
    console.warn(STATUS);
    console.log(!STATUS.STARTED, localStream, STATUS.READY);
    if (!STATUS.STARTED && typeof localStream != 'undefined' && STATUS.READY) {
      createPeerConnection();
      pc.addStream(localStream);
      STATUS.STARTED = true;
      console.log('isInitiator', STATUS.INIT);
      if (STATUS.INIT) {
        doCall();
      }
    }
  };

  window.onbeforeunload = function(e){
  	//sendMessage('bye');
  };

  var turnDone = false;
  function maybeRequestTurn() {
    if (turnUrl === '') {
        turnDone = true;
        return;
    }
    for (var i = 0, len = CONFIG.pc.iceServers.length; i < len; i++) {
      console.log('TURN---', CONFIG.pc.iceServers[i]);
        if (CONFIG.pc.iceServers[i].url.substr(0, 5) === 'turn:') {
            turnDone = true;
            return;
        }
    }
    var currentDomain = document.domain;
    //if (currentDomain.search('localhost') === -1 && currentDomain.search('apprtc') === -1) {
    //    turnDone = true;
    //    return;
    //}
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {

        if (xmlhttp.readyState !== 4) {
            return;
        }
        if (xmlhttp.status === 200) {
            var turnServer = JSON.parse(xmlhttp.responseText);
            var iceServers = createIceServers(turnServer.uris, turnServer.username, turnServer.password);
            if (iceServers !== null) {
                CONFIG.pc.iceServers = CONFIG.pc.iceServers.concat(iceServers);
            }
        } else {
            messageError('No TURN server; unlikely that media will traverse networks. ' + 'If this persists please report it to ' + 'discuss-webrtc@googlegroups.com.');
        }
        turnDone = true;
        maybeStart();
    };
    console.log(turnUrl);
    xmlhttp.open('GET', turnUrl, true);
    xmlhttp.send();
  }


  // ********** P2P Connections *********

  var createPeerConnection = function () {
    try {
      pc = new RTCPeerConnection(null);
      pc.onicecandidate = handleIceCandidate;
      pc.onaddstream    = handleRemoteStreamAdded;
      pc.onremovestream = handleRemoteStreamRemoved;
      console.log('Created RTCPeerConnnection');
    } catch (e) {
      console.log('Failed to create PeerConnection, exception: ' + e.message);
      alert('Cannot create RTCPeerConnection object.');
      return;
    }
  };

  var handleIceCandidate = function (event) {
    console.log('handleIceCandidate event: ', event);
    if (event.candidate) {
      channel.send('message', {
        type:     'candidate',
        label:     event.candidate.sdpMLineIndex,
        id:        event.candidate.sdpMid,
        candidate: event.candidate.candidate});
    } else {
      console.log('End of candidates.');
    }
  };

  var handleRemoteStreamAdded = function (event) {
    console.log('Remote stream added.');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
    remoteStream = event.stream;
  };

  var handleRemoteStreamRemoved = function (event) {
    console.log('Remote stream removed. Event: ', event);
  };

  var handleCreateOfferError = function (event){
    console.log('createOffer() error: ', e);
  };

  var doCall = function () {
    console.log('Sending offer to peer');
    pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
  };

  var doAnswer = function () {
    console.log('Sending answer to peer.');
    pc.createAnswer(setLocalAndSendMessage, null, CONFIG.sdpConstraints);
  };

  var setLocalAndSendMessage = function (sessionDescription) {
    // Set Opus as the preferred codec in SDP if Opus is present.
    sessionDescription.sdp = preferOpus(sessionDescription.sdp);
    pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message' , sessionDescription);
    channel.send('message', sessionDescription);
  };


  ///////////////////////////////////////////

  // Set Opus as the default audio codec if it's present.
  function preferOpus(sdp) {
    var sdpLines = sdp.split('\r\n');
    var mLineIndex;
    // Search for m line.
    for (var i = 0; i < sdpLines.length; i++) {
        if (sdpLines[i].search('m=audio') !== -1) {
          mLineIndex = i;
          break;
        }
    }
    if (mLineIndex === null) {
      return sdp;
    }

    // If Opus is available, set it as the default in m line.
    for (i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].search('opus/48000') !== -1) {
        var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
        if (opusPayload) {
          sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], opusPayload);
        }
        break;
      }
    }

    // Remove CN in m line and sdp.
    sdpLines = removeCN(sdpLines, mLineIndex);

    sdp = sdpLines.join('\r\n');
    return sdp;
  }

  function extractSdp(sdpLine, pattern) {
    var result = sdpLine.match(pattern);
    return result && result.length === 2 ? result[1] : null;
  }

  // Set the selected codec to the first in m line.
  function setDefaultCodec(mLine, payload) {
    var elements = mLine.split(' ');
    var newLine = [];
    var index = 0;
    for (var i = 0; i < elements.length; i++) {
      if (index === 3) { // Format of media starts from the fourth.
        newLine[index++] = payload; // Put target payload to the first.
      }
      if (elements[i] !== payload) {
        newLine[index++] = elements[i];
      }
    }
    return newLine.join(' ');
  }

  // Strip CN from sdp before CN constraints is ready.
  function removeCN(sdpLines, mLineIndex) {
    var mLineElements = sdpLines[mLineIndex].split(' ');
    // Scan from end for the convenience of removing an item.
    for (var i = sdpLines.length-1; i >= 0; i--) {
      var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
      if (payload) {
        var cnPos = mLineElements.indexOf(payload);
        if (cnPos !== -1) {
          // Remove CN payload from m line.
          mLineElements.splice(cnPos, 1);
        }
        // Remove CN line in sdp
        sdpLines.splice(i, 1);
      }
    }

    sdpLines[mLineIndex] = mLineElements.join(' ');
    return sdpLines;
  }

  XWebRTC.prototype.debug = function(){
    console.log('STATUS', STATUS);
    console.log('CONFIG', CONFIG);
    console.log(xpush);
    console.log(channel);
    console.log(channelNm);
  };

  window.XWebRTC = XWebRTC;

})();
