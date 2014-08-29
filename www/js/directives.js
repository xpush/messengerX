angular.module('starter.directives', [])

.directive('ngEnter', function() {
  return function(scope, element, attrs) {
    element.bind("keydown keypress", function(event) {
      if (event.which === 13) {
        scope.$apply(function() {
          scope.$eval(attrs.ngEnter);
        });

        event.preventDefault();
      }
    });
  };
})
.directive('ngBackButton', function() {  
  return function(scope, element, attrs) {
    element.bind("keydown keypress", function(event) {
      if ( event.keyCode == 8 || event.keyCode == 4 ) {
        event.preventDefault();
      }
    });
  };
})
.directive('channelImage', function(Cache, Sign, $rootScope) {
  return {
    restrict: 'A',
    scope: {
       users: '=users',
       channelImage : '=image',
       channelName : '=channelName',
       result: '&'
    },    
    replace: true,
    transclude: false,
    controller: function($scope) {
      var loginUserId = Sign.getUser().userId;
      var result = $rootScope.rootImgPath+"/channel_image.jpg";
      var users = $scope.users;

      var friendId = '';

      var channelImage = $scope.channelImage;
      var channelName = $scope.channelName;

      if( users !== undefined ){
        var userArray = users.split( "," );
        if( userArray.length == 2  ){
          friendId = users.replace(",", "" ).replace( loginUserId, "" );
        }
      }

      if( channelImage !== '' ){
        result = channelImage;
        if( friendId !== '' ){
          Cache.add( friendId, { 'NM':channelName , 'I': result } );
        }

      } else if( friendId !== '' && Cache.get( friendId ) !== undefined ){
        result = Cache.get( friendId ).I;
      } 
      $scope.image = result;
    },
    template: '<img ng-src="{{image}}" />'
  };
})
.directive('popupLink', function ( $rootScope, $window, $state, $ionicFrostedDelegate, $ionicScrollDelegate, $ionicPopup ) {       
  return {
    link: function(scope, element, attrs) {

      if( attrs.popupLink === "true" ){
        element.bind("load" , function(event){
          $ionicFrostedDelegate.update();
          $ionicScrollDelegate.scrollBottom(true);
        });
      }

      element.bind("click" , function(event){
        var xpush = $rootScope.xpush;
                        
        xpush._getChannelAsync( scope.channelId, function(ch){
          var fileNm;
          var type = attrs.type;

          if( attrs.fileName !== undefined ){
            var srcUrl = attrs.fileName;
            fileNm = srcUrl.indexOf("/") > 0 ? srcUrl.substr( srcUrl.lastIndexOf("/") + 1 ) : srcUrl;
          } else {
            var tnUrl = attrs.src;
            fileNm = tnUrl.substr( tnUrl.lastIndexOf( "/") + 1 ).replace( "T_", "" );
          }

          var url = xpush.getFileUrl( scope.channelId, fileNm );
          if( attrs.src.indexOf( "data" ) === 0 ){
            url = attrs.src;
          }
          
          var encodedUrl = encodeURIComponent( url );

          var left = screen.width/2 - 400
            , top = screen.height/2 - 300;

          if( window.device ){
            console.log( url );
            //var popup = $window.open( $rootScope.rootPath + 'popup-view.html?type='+type+'&src='+encodedUrl, '', "top=" + top + ",left=" + left + ",width=80,height=60");
            var popup = window.open(url, '_blank', 'location=no');
          } else {
            var popup = $window.open( '#/view?type='+type+'&src='+encodedUrl, '_blank', "top=" + top + ",left=" + left + ",width=80,height=60");
          }
          //var  popup = $window.open( $rootScope.rootPath + 'popup-view.html?type='+type+'&src='+encodedUrl, '', "top=" + top + ",left=" + left + ",width=80,height=60");
        });    
      });
    }
  }
})
.directive('channelUsers', function(UTIL, $rootScope) {
  return {
    restrict: 'A',
    scope: {
       users: '=users',
       count: '&',
       className : '&'
    },    
    replace: true,
    transclude: false,
    controller: function($scope) {
      $scope.count = $scope.users.split( "," ).length;
      if( $scope.count > 2 ){
        $scope.className = "users";
      } else {
        $scope.className = "hidden";
      }
    },
    template: '<span class="{{className}}"><img src="'+$rootScope.rootImgPath+'/user-icon.png"></img>&nbsp;{{count}}</span>'
  };
})
.directive('updatedTime', function(UTIL) {
  return {
    restrict: 'A',
    scope: {
       timestamp: '=timestamp',
       timeString: '&'
    },    
    replace: true,
    transclude: false,
    controller: function($scope) {
      $scope.timeString = UTIL.timeToString( $scope.timestamp )[0];
    },
    template: '<span class="channel-time">{{timeString}}</span>'
  };
})
.directive('searchByKey', function($parse, $timeout, UTIL){
  var DELAY_TIME_BEFORE_POSTING = 100;
  return function(scope, elem, attrs) {

    var element = angular.element(elem)[0];
    var currentTimeout = null;

    var poster = $parse(attrs.post)(scope);
    var reseter = $parse(attrs.reset)(scope);

    element.oninput = function() {

      if(currentTimeout) {
        $timeout.cancel(currentTimeout)
      }
      currentTimeout = $timeout(function(){

        var searchKey = angular.element(element).val();

        if( searchKey !== '' ){
          matches = [];
          var separated = UTIL.getMorphemes( searchKey ).toLowerCase();

          var datas = [];

          var items =attrs.items.split('.');
          if( items.length === 2  ){
            var item1 = items[0];
            var item2 = items[1];
            datas= scope[item1][item2];
          } else {
            datas = scope[attrs.items];
          }

          angular.forEach(datas, function(data) {
            if( UTIL.getMorphemes( data.user_name ).toLowerCase().indexOf( separated ) > -1
              || data.chosung.indexOf( searchKey ) > -1 ){
              matches.push( data );
            }
          });

          poster( matches );
        } else {
          reseter();
        }

      }, DELAY_TIME_BEFORE_POSTING)
    }
  }
})
.factory('$xpushSlide', [
  '$ionicTemplateLoader',
  '$ionicBackdrop',
  '$q',
  '$timeout',
  '$rootScope',
  '$document',
  '$compile',
  '$ionicPlatform',
function($ionicTemplateLoader, $ionicBackdrop, $q, $timeout, $rootScope, $document, $compile, $ionicPlatform) {

  extend = angular.extend,
  forEach = angular.forEach,
  isDefined = angular.isDefined,
  isString = angular.isString,
  jqLite = angular.element;

  var MENU_TPL =
      '<div ng-class=" className ">' +
        '<ion-header-bar class="bar-stable">'+
          '<h1 class="title"></h1>'+
          '<div class="buttons">'+
            '<button class="button icon ion-close-round" ng-click="$buttonTapped(button, $event)" ></button>'+
          '</div>'+
        '</ion-header-bar>'+
        '<div class="menu-body">' +
        '</div>' +
        '<ion-footer-bar class="bar-stable">' +
          '<div class="buttons">' +
            '<button class="button icon-left button-clear ion-log-out" ng-click="exitChannel()" >Exit</button>' +
          '</div>' +
        '</ion-footer-bar>' +
      '</div>';

  var PLATFORM_BACK_BUTTON_PRIORITY_POPUP = 400;

  //TODO allow this to be configured
  var config = {
    stackPushDelay: 50
  };
  var popupStack = [];
  var $xpushSlide = {
    show: showPopup,
    _createPopup: createPopup,
    _popupStack: popupStack
  };

  return $xpushSlide;

  function createPopup(options) {
    options = extend({
      scope: null,
      title: '',
      buttons: [],
      className : ''
    }, options || {});


    var popupPromise = $ionicTemplateLoader.compile({
      template: MENU_TPL,
      scope: options.scope && options.scope.$new(),
      appendTo: $document[0].body
    });
    var contentPromise = options.templateUrl ?
      $ionicTemplateLoader.load(options.templateUrl) :
      $q.when(options.template || options.content || '');

    return $q.all([popupPromise, contentPromise])
    .then(function(results) {
      var self = results[0];
      var content = results[1];
      var responseDeferred = $q.defer();

      self.responseDeferred = responseDeferred;

      //Can't ng-bind-html for popup-body because it can be insecure html
      //(eg an input in case of prompt)
      var body = jqLite(self.element[0].querySelector('.menu-body'));
      if (content) {
        body.html(content);
        $compile(body.contents())(self.scope);
      } else {
        body.remove();
      }

      extend(self.scope, {
        className : 'chat-extends-menu slide-in-right',
        $buttonTapped: function(button, event) {
          var result = (angular.noop)(event);
          event = event.originalEvent || event; //jquery events

          if (!event.defaultPrevented) {
            responseDeferred.resolve(result);
          }
        }
      });

      self.show = function() {
        if (self.isShown) return;

        self.isShown = true;
        ionic.requestAnimationFrame(function() {
          if (!self.isShown) return;
          self.scope.className = 'chat-extends-menu slide-in-right';
        });
      };
      self.hide = function(callback) {
        callback = callback || angular.noop;
        if (!self.isShown) return callback();

        self.isShown = false;
        self.scope.className = 'chat-extends-menu slide-out-right';
        $timeout(callback, 250);
      };
      self.remove = function() {
        if (self.removed) return;

        self.hide(function() {
          self.element.remove();
          self.scope.$destroy();
        });

        self.removed = true;
      };

      return self;
    });
  }

  function onHardwareBackButton(e) {
    popupStack[0] && popupStack[0].responseDeferred.resolve();
  }

  function showPopup(options) {
    var popupPromise = $xpushSlide._createPopup(options);
    var previousPopup = popupStack[0];

    if (previousPopup) {
      previousPopup.hide();
    }

    var resultPromise = $timeout(angular.noop, previousPopup ? config.stackPushDelay : 0)
    .then(function() { return popupPromise; })
    .then(function(popup) {
      if (!previousPopup) {
        //Add menu-open & backdrop if this is first popup
        document.body.classList.add('menu-open');
        $ionicBackdrop.retain();
        $xpushSlide._backButtonActionDone = $ionicPlatform.registerBackButtonAction(
          onHardwareBackButton,
          PLATFORM_BACK_BUTTON_PRIORITY_POPUP
        );
      }
      popupStack.unshift(popup);
      popup.show();

      //DEPRECATED: notify the promise with an object with a close method
      popup.responseDeferred.notify({
        close: resultPromise.close
      });

      return popup.responseDeferred.promise.then(function(result) {
        var index = popupStack.indexOf(popup);
        if (index !== -1) {
          popupStack.splice(index, 1);
        }
        popup.remove();

        var previousPopup = popupStack[0];
        if (previousPopup) {
          previousPopup.show();
        } else {
          //Remove menu-open & backdrop if this is last popup
          document.body.classList.remove('menu-open');
          ($xpushSlide._backButtonActionDone || angular.noop)();
        }
        // always release the backdrop since it has an internal backdrop counter
        $ionicBackdrop.release();
        return result;
      });
    });

    function close(result) {
      popupPromise.then(function(popup) {
        if (!popup.removed) {
          popup.responseDeferred.resolve(result);
        }
      });
    }
    resultPromise.close = close;

    return resultPromise;
  }

  function focusInput(element) {
    var focusOn = element[0].querySelector('[autofocus]');
    if (focusOn) {
      focusOn.focus();
    }
  }
}]);
