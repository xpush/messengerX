angular.module('popupview', ['ionic'])

.run(function($ionicPlatform, $rootScope, $location) {
  if ( $location.absUrl().indexOf( 'file' ) > -1 ) {
    $rootScope.rootImgPath = "img";
  } else {
    $rootScope.rootImgPath = "../img";
  }

  if( window.root ){
    $rootScope.nodeWebkit = true;
  } else {
    $rootScope.nodeWebkit = false;
  }

  $ionicPlatform.ready(function() {
    if( window.device ){
      $rootScope.rootImgPath = "img";
    }
  });
})
.controller('PopupCtrl', function($scope, $rootScope) {

  if( window.root ){
    $scope.hideNavbar = "false";
  } else {
    $scope.hideNavbar = "true";
  }  

  $scope.$watch('$viewContentLoaded', function() {
    var imgObj =  document.getElementById('popupImg');
    var element = angular.element( imgObj );
    element.bind( 'load', function (){
      var offsetX = $scope.hideNavbar?0:16;
      var topBarY = 0;
      if( $scope.hideNavbar ){
        topBarY = 44;
      }
      var offsetY = imgObj.scrollWidth > screen.width ? 92+ topBarY: 74+topBarY;

      window.resizeTo(imgObj.width+offsetX, imgObj.height+offsetY);      
    });

    var src=new String(document.location);
    var srcName=src.split("src=")[1];
    $scope.imageSrc = decodeURIComponent(srcName);
  });  

  $scope.close = function(){
    window.close();
  };
});