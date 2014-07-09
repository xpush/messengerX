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
.directive('channelImage', function(Friends, Sign) {
  return {
    restrict: 'E',
    scope: {
       rowChannelId: '=channelId',
       image: '&'
    },    
    replace: true,
    transclude: false,
    controller: function($scope) {
      var loginUserId = Sign.getUser().userId;
      var image = "../www/img/default_image.jpg";      
      var rowChannelId = $scope.rowChannelId;
      if( rowChannelId.indexOf( "$" ) > -1  ){
        var friendId = rowChannelId.split( "^" )[0].replace("$", "" ).replace( loginUserId, "" );
        if( Friends.get( friendId ) != undefined ){
          image = Friends.get( friendId ).image;
        }
      }

      $scope.image = image;
    },
    template: '<img src="{{image}}" />'
  };
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
