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

  var src=new String(document.location);

  var query = window.location.search.substring(1);
  var vars = query.split("&");
  var type = vars[0].split("=")[1];
  var srcName=decodeURIComponent( src.split("src=")[1] ).replace( "#/", "");
  $scope.movieSrc = "";

  $scope.$watch('$viewContentLoaded', function() {

    var offsetX = $scope.hideNavbar=="true"?16:0;
    var offsetY = 0;

    var topBarY = $scope.hideNavbar=="true"?0:44;

    if( type == 'SI' || type == 'RI'  ){
      var imgObj =  document.getElementById('imgContent');
      imgObj.style.display = "block";
      var element = angular.element( imgObj );

      element.bind( 'load', function (){

        offsetY = imgObj.scrollWidth > screen.width ? 84+ topBarY: 66+topBarY;
        window.resizeTo(imgObj.width+offsetX, imgObj.height+offsetY);
      });

      $scope.imageSrc = srcName;
    } else {
      var video =  document.getElementById('videoContent');
      var videoSourceObj =  document.getElementById('videoSource');

      video.style.display = "block";
      video.src = srcName;

      video.addEventListener('loadeddata', function (){
        console.log( video.videoWidth +" : " + video.videoHeight  );

        offsetY = video.videoWidth > screen.width ? 84+ topBarY: 66+topBarY;
        window.resizeTo(video.videoWidth+offsetX, video.videoHeight+offsetY);  
      });    
    }
  });  

  $scope.close = function(){
    window.close();
  };
});