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
.directive('channelImage', function(Cache, Sign) {
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
      var result = "../img/channel_image.jpg";
      var users = $scope.users;

      var friendId = '';

      var channelImage = $scope.channelImage;
      var channelName = $scope.channelName;

      if( users != undefined ){
        var userArray = users.split( "," );
        if( userArray.length == 2  ){
          friendId = users.replace(",", "" ).replace( loginUserId, "" );
        }
      }

      if( channelImage != '' ){
        result = channelImage;
        if( friendId != '' ){
          Cache.add( friendId, { 'NM':channelName , 'I': result } );
        }

      } else if( Cache.get( friendId ) != undefined ){
        result = Cache.get( friendId ).I;
      } 

      $scope.image = result;
    },
    template: '<img ng-src="{{image}}" />'
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
.directive('keyboardPoster', function($parse, $timeout, UTIL){
  var DELAY_TIME_BEFORE_POSTING = 100;
  return function(scope, elem, attrs) {

    var element = angular.element(elem)[0];
    var currentTimeout = null;

    element.oninput = function() {
      var model = $parse(attrs.postFunction);
      var poster = model(scope);

      var reseter = $parse(attrs.resetFunction)(scope);

      if(currentTimeout) {
        $timeout.cancel(currentTimeout)
      }
      currentTimeout = $timeout(function(){

        var searchKey = angular.element(element).val();

        if( searchKey != '' ){
          var newArrays = [];
          var separated = UTIL.getMorphemes( searchKey );

          for( var key in scope[attrs.postArray] ){
            var tUser = scope[attrs.postArray][key];
            if( UTIL.getMorphemes( tUser.user_name ).indexOf( separated ) > -1
              || tUser.chosung.indexOf( searchKey ) > -1 ){
              newArrays.push( tUser );
            }
          }

          poster( newArrays );
        } else {
          reseter();
        }

      }, DELAY_TIME_BEFORE_POSTING)
    }
  }
})
.directive('paperInput', function($parse, $timeout, $browser) {
  return {
    restrict: 'E',
    require: '?ngModel',
    link: function postLink(scope, element, attrs) {

      var input = element[0];
      if (attrs.ngModel) {
        bindNgModel('ngModel', 'inputValue');
      }

      function bindNgModel(attrName, inputName) {
        var ngModelGet = $parse(attrs[attrName]);
        toInput(ngModelGet, attrs[attrName], inputName);
        toModel(ngModelGet, attrs[attrName], inputName);
      }

      function toInput(ngModelGet, attrName, inputName) {

        $timeout(function() {
          input[inputName] = ngModelGet(scope);
        }, 350);

        var first = true;
        scope.$watch(attrName, function ngModelWatch() {
          if (first) {
            first = false;
            return;
          }
          var value = ngModelGet(scope);
          input[inputName] = value;
        });
      }

      function toModel(modelGet) {
        var ngModelSet = modelGet.assign;

        var timeout;

        var deferListener = function(ev) {
          if (!timeout) {
            timeout = $browser.defer(function() {
              listener(ev);
              timeout = null;
            });
          }
        };

        var listener = function(event) {
          ngModelSet(scope, input.inputValue);
          scope.$apply();
        }

        input.addEventListener('change', function(event) {
          deferListener(event);
        });

        input.addEventListener('keydown', function(event) {
          var key = event.keyCode;

          // ignore
          //    command            modifiers                   arrows
          if (key === 91 || (15 < key && key < 19) || (37 <= key && key <= 40)) return;

          deferListener(event);
        });

      }
    }
  };
});
