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
.directive('channelUsers', function(UTIL) {
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
    template: '<span class="{{className}}"><img src="../img/user-icon.png"></img>&nbsp;{{count}}</span>'
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

        if( searchKey != '' ){
          matches = [];
          var separated = UTIL.getMorphemes( searchKey );

          for( var key in scope[attrs.items] ){
            var data = scope[attrs.items][key];
            if( UTIL.getMorphemes( data.user_name ).indexOf( separated ) > -1
              || data.chosung.indexOf( searchKey ) > -1 ){
              matches.push( data );
            }
          }

          poster( matches );
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
