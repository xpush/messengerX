angular.module('messengerx.directives', [])

/**
 * @ngdoc directive
 * @name ngEnter
 * @module messengerx.directives
 * @kind directive
 *
 * @description execute function on enter key
 * enter 입력시 ng-enter에 등록된 함수를 실행한다.
 */
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

/**
 * @ngdoc directive
 * @name channelImage
 * @module messengerx.directives
 * @kind directive
 *
 * @description execute function on enter key
 * enter 입력시 ng-enter에 등록된 함수를 실행한다.
 */
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

      // default image
      var result = $rootScope.rootImgPath+"/channel_image.jpg";
      var users = $scope.users;

      var friendId = '';

      var channelImage = $scope.channelImage;
      var channelName = $scope.channelName;

      // channel users가 있고, 1:1 채널인 경우는 친구의 image를 보여주기 위해, 친구의 id를 추출한다.
      if( users !== undefined ){
        var userArray = users.split( "," );
        if( userArray.length == 2  ){
          friendId = users.replace(",", "" ).replace( loginUserId, "" );
        }
      }

      // channel image가 있는 경우는 channel image를 그대로 보여주고
      if( channelImage !== '' ){
        result = channelImage;
        if( friendId !== '' ){
          Cache.add( friendId, { 'NM':channelName , 'I': result } );
        }

      // 그렇지 않은 경우는 친구의 image를 보여준다.
      } else if( friendId !== '' && Cache.get( friendId ) !== undefined ){
        result = Cache.get( friendId ).I;
      } 
      $scope.image = result;
    },
    template: '<img ng-src="{{image}}" />'
  };
})

/**
 * @ngdoc directive
 * @name popupLink
 * @module messengerx.directives
 * @kind directive
 *
 * @description make popup link for image or video
 * enter 입력시 ng-enter에 등록된 함수를 실행한다.
 */
.directive('popupLink', function ( $rootScope, $window, $state, $ionicFrostedDelegate, $ionicScrollDelegate, $ionicPopup ) {       
  return {
    link: function(scope, element, attrs) {

      // popup link 가 활성화 되었다면, onload 이벤트로 발생시 scroll 위치를 업데이트 한다.
      if( attrs.popupLink === "true" ){
        element.bind("load" , function(event){
          $ionicFrostedDelegate.update();
          $ionicScrollDelegate.scrollBottom(true);
        });
      }

      // 해당 element click 시 
      element.bind("click" , function(event){
        var xpush = $rootScope.xpush;
                        
        xpush.getChannelAsync( scope.channelId, function(ch){
          var fileNm;
          var type = attrs.type;

          // fileName 이 있다면, srcUrl 을 세팅한다. video인 경우
          if( attrs.fileName !== undefined ){
            var srcUrl = attrs.fileName;
            fileNm = srcUrl.indexOf("/") > 0 ? srcUrl.substr( srcUrl.lastIndexOf("/") + 1 ) : srcUrl;
          } else {
            // thumbnail image가 있는 경우, 원본 filename을 추출한다.
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

          // cordova를 이용해 화면이 오픈된 경우, 일반 popup을 사용
          if( window.device ){
            var popup = window.open(url, '_blank', 'location=no');
          } else {
            if( $rootScope.usePopupFlag ){
              var popup = $window.open( '#/view?type='+type+'&src='+encodedUrl, '_blank', "top=" + top + ",left=" + left + ",width=80,height=60");
            } else {
              var popup = window.open(url, '_blank', 'location=no');
            }
          }
        });
      });
    }
  }
})

/**
 * @ngdoc directive
 * @name channelUsers
 * @module messengerx.directives
 * @kind directive
 *
 * @description make image tag for channelUser 
 * multi channel에 포함된 user의 숫자와 image를 보여준다.
 */
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

      // 2명 이상 일때만 보여준다.
      if( $scope.count > 2 ){
        $scope.className = "users";
      } else {
        $scope.className = "hidden";
      }
    },
    template: '<span class="{{className}}"><img src="'+$rootScope.rootImgPath+'/user-icon.png"></img>&nbsp;{{count}}</span>'
  };
})

/**
 * @ngdoc directive
 * @name updatedTime
 * @module messengerx.directives
 * @kind directive
 *
 * @description make span for display updated time
 * multi channel에 포함된 user의 숫자와 image를 보여준다.
 */
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

/**
 * @ngdoc directive
 * @name searchByKey
 * @module messengerx.directives
 * @kind directive
 *
 * @description key 입력시 초성 검색을 사용한다.
 */
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
          var matches = [];

          // 초성을 추출함.
          var separated = UTIL.getMorphemes( searchKey ).toLowerCase();

          var datas = [];

          // items를 array 로 가져와서
          var items =attrs.items.split('.');
          if( items.length === 2  ){
            var item1 = items[0];
            var item2 = items[1];
            datas= scope[item1][item2];
          } else {
            datas = scope[attrs.items];
          }

          // 초성이 같거나, 포함되어 있는 경우 matches에 추가한다.
          angular.forEach(datas, function(data) {
            if( UTIL.getMorphemes( data.user_name ).toLowerCase().indexOf( separated ) > -1
              || data.chosung.indexOf( searchKey ) > -1 ){
              matches.push( data );
            }
          });

          // matches에 등록한다.
          poster( matches );
        } else {
          // 입력값이 없는 경우 array를 reset한다.
          reseter();
        }

      }, DELAY_TIME_BEFORE_POSTING)
    }
  }
})

/**
 * @ngdoc directive
 * @name errSrc
 * @module messengerx.directives
 * @kind factory
 *
 * @description 이미지 에러시 default 이미지를 보여줌
 */
.directive('errSrc', function() {
  return {
    link: function(scope, element, attrs) {
      element.bind('error', function() {
        if (attrs.src != attrs.errSrc) {
          attrs.$set('src', attrs.errSrc);
        }
      });
    }
  }
})
/**
 * @ngdoc factory
 * @name xpushSlide
 * @module messengerx.directives
 * @kind factory
 *
 * @description slide 되는 popup을 생성한다.
 */
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
          //Remove popup-open & backdrop if this is last popup
          $timeout(function() {
            // wait to remove this due to a 300ms delay native
            // click which would trigging whatever was underneath this
            $ionicBody.removeClass('menu-open');
          }, 400);
          $timeout(function() {
            $ionicBackdrop.release();
          }, config.stackPushDelay || 0);
          ($ionicPopup._backButtonActionDone || angular.noop() )();
        }
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

angular.module('ionic.contrib.frostedGlass', ['ionic'])

.factory('$ionicFrostedDelegate', ['$rootScope', function($rootScope) {
  return {
    update: function() {
      $rootScope.$emit('ionicFrosted.update');
    }
  }
}]);