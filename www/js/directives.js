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
    console.log( event.keyCode );
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
.directive('popupLink', function ( $rootScope, $window, $ionicFrostedDelegate, $ionicScrollDelegate, $ionicPopup ) {       
  return {
    link: function(scope, element, attrs) {

      if( attrs.popupLink == "true" ){
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

          if( attrs.fileName != undefined ){
            var srcUrl = attrs.fileName;
            fileNm = srcUrl.indexOf("/") > 0 ? srcUrl.substr( srcUrl.lastIndexOf("/") + 1 ) : srcUrl;
          } else {
            var tnUrl = attrs.src;
            fileNm = tnUrl.substr( tnUrl.lastIndexOf( "/") + 1 ).replace( "T_", "" );
          }

          var url = xpush.getFileUrl( scope.channelId, fileNm );
          var encodedUrl = encodeURIComponent(  url );

          var left = screen.width/2 - 400
            , top = screen.height/2 - 300;
          
          var  popup = $window.open( $rootScope.rootPath + 'popup-view.html?type='+type+'&src='+encodedUrl, '', "top=" + top + ",left=" + left + ",width=80,height=60");
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

        if( searchKey != '' ){
          matches = [];
          var separated = UTIL.getMorphemes( searchKey );

          var datas = [];

          var items =attrs.items.split('.');
          if( items.length == 2  ){
            var item1 = items[0];
            var item2 = items[1];
            datas= scope[item1][item2];
          } else {
            datas = scope[attrs.items];
          }

          for( var key in datas ){
            var data = datas[key];
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
});