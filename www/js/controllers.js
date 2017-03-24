angular.module('ionic.weather.controllers',[])


  .controller('WeatherCtrl', function($scope, $state, $stateParams, $timeout, $rootScope, Weather, Geo, Flickr, $ionicModal, $ionicLoading, $ionicPlatform, $ionicPopup, $http, $filter) {
    var _this = this;

    $scope._init = true;

    // $ionicPlatform.ready(function() {
    //   // Hide the status bar
    //   if(window.StatusBar) {
    //     StatusBar.hide();
    //   }
    // });

    $scope.activeBgImageIndex = 0;

    // $scope.showSettings = function() {
    //   console.log('cerca cliccato');
    //   if(!$scope.settingsModal) {
    //     // Load the modal from the given template URL
    //     $ionicModal.fromTemplateUrl('modals/search.html', function(modal) {
    //       $scope.settingsModal = modal;
    //       $scope.settingsModal.show();
    //     }, {
    //       // The animation we want to use for the modal entrance
    //       animation: 'slide-in-up'
    //     });
    //   } else {
    //     $scope.settingsModal.show();
    //   }
    // };

    $scope.showDayForecast = function(index) {

      console.log($scope.daily_forecast[index]);
      var selected_forecast = $scope.daily_forecast[index];
      $state.go('app.daily_forecast', {obj: selected_forecast} );

    };

    this.getInfoPlace = function(lat,lng){

      //retrieve the closest places based on the lat and lng coords
      var q_url = 'http://192.167.9.103:5050/places/search/bycoords/'+lat+'/'+lng+'?filter=com';
      console.log(lat);
      console.log(lng);
      console.log(q_url);

      $http({
        method :'GET',
        url: q_url,
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .success(function (data, status) {

          $scope.place_id = data.places[0].id;
          $scope.place_name = data.places[0].long_name.it;
          console.log($scope.place_id);
          console.log($scope.place_name);
          // console.log(data.places[0].long_name.it);

          $scope.currentLocationString = data.places[0].long_name.it;

          //retrieve bgd_image based on the current position
          _this.getDataModel("wrf3",$scope.place_id);
          _this.getBackgroundImage(lat, lng, $scope.currentLocationString);
          //_this.getCurrent(lat, lng); temperatura da forecast.io

          console.log($scope.place_id);

        })
        .error(function (data, status) {
          alert('Connection error: ' + status);
        });
    };

    $rootScope.$on('CallInfoPlace', function(event, args){
      console.log('event raised: '+ args.lat +' '+ args.lng);
      _this.getInfoPlace(args.lat, args.lng);
    });

    this.getDataModel = function(model,place){

      //retrieve forecast data from ww
      var f_url = 'http://192.167.9.103:5050/products/'+model+'/timeseries/'+place;
      console.log(f_url);

      $scope.show = function () {
        $ionicLoading.show({
          template: '<p>Caricamento...</p><ion-spinner icon="spiral"></ion-spinner>'
        });
      };

      $scope.hide = function () {
        $ionicLoading.hide();
      };

      console.log('before show');

      // if($scope._init==true)
        $scope.show($ionicLoading);

      console.log('after show');


      $http({
        method :'GET',
        url: f_url,
        timeout: 300000,
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .success(function (data, status) {

          console.log("success http API");

          console.log(data.timeseries.runs.time[0].t2c);
          $scope.currentTemp = data.timeseries.runs.time[0].t2c;
          $scope.hourly_forecast = data.timeseries.runs;

          var day = new Date();
          var hour = day.getHours()-1;

          var init = 24 - hour;

          //TODO: CREATE TWO DIFFERENT OBJECTS: ONE FOR THE 'WEEKLY FORECAST' AND ANOTHER ONE FOR THE 'DAILY/SELECTED FORECAST'

          $scope.daily_forecast = [];

          $scope.highTemp = -9999;
          $scope.lowTemp = 9999;
          $scope.currentCondition = data.timeseries.runs.time[0].icon;

          for(var i=0; i<=init; i++){
            var val_temp =  parseInt(data.timeseries.runs.time[i].t2c);

            if(val_temp < $scope.lowTemp)
              $scope.lowTemp = val_temp;

            if (val_temp > $scope.highTemp)
              $scope.highTemp = val_temp;

          }

          for (var i=init; i < (144 - hour); i=i+24) {

            var info_day = {};

            info_day.icon = data.timeseries.runs.time[i+12].icon;

            var dateString = (data.timeseries.runs.time[i+1].date).slice(0,8);

            var year = dateString.substring(0,4);
            var month = dateString.substring(4,6);
            var day  = dateString.substring(6,8);

            var curr_date = new Date(year, month-1, day);

            var min = 99999999;
            var max = -9999999;

            var info_day = {

              'min':            min,
              'max':            max,
              'date':           $filter('date')(curr_date, 'yyyy-MM-dd'),
              'icon':           data.timeseries.runs.time[i+12].icon,
              't2c':            [],
              'rh2':            []
            };

            //getting TS info data and min and max temperature for each day
            for (var j = 0; j < 24; j++) {
              var t2c =  parseFloat(data.timeseries.runs.time[i+j].t2c);
              var rh2 =  parseFloat(data.timeseries.runs.time[i+j].rh2);

              // console.log(t2c);

              info_day['t2c'].push(t2c);
              info_day['rh2'].push(rh2);


              if(t2c < min)
                min = t2c;

              if (t2c > max)
                max = t2c;
            }

            info_day['min'] = min;
            info_day['max'] = max;

            $scope.daily_forecast.push(info_day);

          }

          console.log($scope.daily_forecast);
          console.log("after ops");


        })
        .error(function (data, status) {
          alert('Connection error: ' + status);
        })
        .finally(function ($IonicLoading) {

          // if($scope._init==true) {
            $scope.hide($IonicLoading);
            $scope._init = false;
          // }

        });


    };

    this.getBackgroundImage = function(lat, lng, locString) {

      $scope.DfBgImage = {};
      $scope.DfBgImage["sunny.png"] = "img/bg/sunny.jpg";
      $scope.DfBgImage["sunny_night.png"] = "img/bg/calm-night.jpg";
      $scope.DfBgImage["cloudy1.png"] = "img/bg/cloudy.jpg";
      $scope.DfBgImage["cloudy1_night.png"] = "img/bg/cloudy-night.jpg";
      $scope.DfBgImage["cloudy2.png"] = "img/bg/cloudy.jpg";
      $scope.DfBgImage["cloudy2_night.png"] = "img/bg/cloudy-night.jpg";
      $scope.DfBgImage["cloudy3.png"] = "img/bg/cloudy.jpg";
      $scope.DfBgImage["cloudy3_night.png"] = "img/bg/cloudy-night.jpg";
      $scope.DfBgImage["cloudy4.png"] = "img/bg/cloudy.jpg";
      $scope.DfBgImage["cloudy4_night.png"] = "img/bg/cloudy-night.jpg";
      $scope.DfBgImage["cloudy5.png"] = "img/bg/cloudy.jpg";
      $scope.DfBgImage["cloudy5_night.png"] = "img/bg/cloudy-night.jpg";
      $scope.DfBgImage["shower1.png"] = "img/bg/rain.jpg";
      $scope.DfBgImage["shower1_night.png"] = "img/bg/rain.jpg";
      $scope.DfBgImage["shower2.png"] = "img/bg/rain.jpg";
      $scope.DfBgImage["shower2_night.png"] = "img/bg/rain.jpg";
      $scope.DfBgImage["shower3.png"] = "img/bg/thunderstorm.jpg";
      $scope.DfBgImage["shower3_night.png"] = "img/bg/thunderstorm.jpg";


      Flickr.search(locString.slice(9 ,locString.length)).then(function(resp) {
        var photos = resp.photos;
        if(photos.photo.length) {
          $scope.countIm = true;
          $scope.bgImages = photos.photo;
          _this.cycleBgImages();
        }else{
          $scope.countIm = false;
          console.log('setting defualt photo');
          var img = new Image();
          console.log($scope.currentCondition);
          $scope.pathIm  = $scope.DfBgImage[$scope.currentCondition];
          //console.log(img.src);
          //$scope.pathIm = img.src;
          console.log($scope.pathIm);
          //$scope.bgImages = img
        }
      }, function(error) {
        console.error('Unable to get Flickr images', error);
      });
    };

    // this.getCurrent = function(lat, lng, locString) {
    //   Weather.getAtLocation(lat, lng).then(function(resp) {
    //     /*
    //      if(resp.response && resp.response.error) {
    //      alert('This Wunderground API Key has exceeded the free limit. Please use your own Wunderground key');
    //      return;
    //      }
    //      */
    //     $scope.current = resp.data;
    //     console.log('GOT CURRENT', $scope.current);
    //     $rootScope.$broadcast('scroll.refreshComplete');
    //   }, function(error) {
    //     alert('Unable to get current conditions');
    //     console.error(error);
    //   });
    // };


    this.cycleBgImages = function() {

      $timeout(function cycle() {
        if($scope.bgImages) {
          $scope.activeBgImage = $scope.bgImages[$scope.activeBgImageIndex++ % $scope.bgImages.length];
        }
        //$timeout(cycle, 10000);
      });
    };


    $scope.refreshData = function() {

      Geo.getLocation().then(function(position) {
        lat = position.coords.latitude;
        lng = position.coords.longitude;

        _this.getInfoPlace(lat,lng);

        $rootScope.$broadcast('scroll.refreshComplete');
        // $scope.hide($ionicLoading);

        // Geo.reverseGeocode(lat, lng).then(function(locString) {
        //   $scope.currentLocationString = locString;
        //   _this.getBackgroundImage(lat, lng, locString.replace(', ', ','));
        // });
        // _this.getCurrent(lat, lng);
      }, function(error) {
        alert('Unable to get current location: ' + error);
      });
    };

    $scope.refreshData();

  })


  .controller('DailyWeatherCtrl', function($scope, $state, $stateParams) {

    $scope.sel_forecast =  $stateParams.obj;

  })


  // .controller('AppCtrl', function($scope, $ionicModal, $timeout) {
  //
  //   // With the new view caching in Ionic, Controllers are only called
  //   // when they are recreated or on app start, instead of every page change.
  //   // To listen for when this page is active (for example, to refresh data),
  //   // listen for the $ionicView.enter event:
  //   //$scope.$on('$ionicView.enter', function(e) {
  //   //});
  //
  //   // Form data for the login modal
  //   $scope.loginData = {};
  //
  //   // Create the login modal that we will use later
  //   $ionicModal.fromTemplateUrl('templates/login.html', {
  //     scope: $scope
  //   }).then(function(modal) {
  //     $scope.modal = modal;
  //   });
  //
  //   // Triggered in the login modal to close it
  //   $scope.closeLogin = function() {
  //     $scope.modal.hide();
  //   };
  //
  //   // Open the login modal
  //   $scope.login = function() {
  //     $scope.modal.show();
  //   };
  //
  //   // Perform the login action when the user submits the login form
  //   $scope.doLogin = function() {
  //     console.log('Doing login', $scope.loginData);
  //
  //     // Simulate a login delay. Remove this and replace with your login
  //     // code if using a login system
  //     $timeout(function() {
  //       $scope.closeLogin();
  //     }, 1000);
  //   };
  // })

  // .controller('PlaylistsCtrl', function($scope) {
  //
  //   $scope.theme = 'ionic-sidemenu-blue';
  //   $scope.playlists = [{
  //     title: 'Reggae',
  //     id: 1
  //   }, {
  //     title: 'Chill',
  //     id: 2
  //   }, {
  //     title: 'Dubstep',
  //     id: 3
  //   }, {
  //     title: 'Indie',
  //     id: 4
  //   }, {
  //     title: 'Rap',
  //     id: 5
  //   }, {
  //     title: 'Cowbell',
  //     id: 6
  //   }];
  // })

  // .controller('PlaylistCtrl', function($scope, $stateParams) {})

  .controller('SearchCtrl', function($scope,$ionicLoading) {
    console.log("search1");

    $scope.playlists = [{
      title: 'Reggae',
      id: 1
    }, {
      title: 'Chill',
      id: 2
    }, {
      title: 'Dubstep',
      id: 3
    }, {
      title: 'Indie',
      id: 4
    }, {
      title: 'Rap',
      id: 5
    }, {
      title: 'Cowbell',
      id: 6
    }];

    // $scope.hide($ionicLoading);
    console.log("search2");

  })



  // .controller('BrowseCtrl', function($scope) {
  //   $scope.playlists = [{
  //     title: 'Reggae',
  //     id: 1
  //   }, {
  //     title: 'Chill',
  //     id: 2
  //   }, {
  //     title: 'Dubstep',
  //     id: 3
  //   }, {
  //     title: 'Indie',
  //     id: 4
  //   }, {
  //     title: 'Rap',
  //     id: 5
  //   }, {
  //     title: 'Cowbell',
  //     id: 6
  //   }];
  // })

  .controller('sideMenuCtrl', function($scope, $ionicModal, $http, $rootScope) {

    $scope.showSearch = function() {
      console.log('cerca aperto');
      if(!$scope.settingsModal) {
        // Load the modal from the given template URL
        $ionicModal.fromTemplateUrl('templates/modals/search.html', function(modal) {
          $scope.settingsModal = modal;
          $scope.settingsModal.show();
        }, {
          // The animation we want to use for the modal entrance
          animation: 'slide-in-up'
        });
      } else {
        $scope.settingsModal.show();
      }
    };

    $scope.closeSearch = function() {
      console.log('cerca chiuso');
      $scope.modal.hide();
    };

    $scope.searchForecast = function(field) {
      $scope.query = field;
      console.log('cerco '+ $scope.query);
      $scope.modal.hide();
      var s_url = 'http://192.167.9.103:5050/places/search/byname/Comune%20di%20'+$scope.query;

      $http({
        method :'GET',
        url: s_url,
        timeout: 300000,
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .success(function (data, status) {
          if (data.places[0].cLat) {
            var cLat = data.places[0].cLat;
            var cLon = data.places[0].cLon;
            $rootScope.$emit('CallInfoPlace', {lat: cLat, lng: cLon});
            console.log(cLat);
            console.log(cLon);
          }else{
            alert('Comune non trovato');
          }
    })

    .error(function (data, status) {
      alert('Connection error: ' + status);
    });

    };

    $scope.theme = 'ionic-sidemenu-stable';

    $scope.tree =
      [
        {
          id: 1,
          level: 0,
          name: 'Home',
          icon: "ion-map",
          state: 'app.home'
        },
        {
          id: 2,
          level: 0,
          name: 'Test',
          icon: "ion-map",
          state: 'app.search'
        }
      ];
  })




;
