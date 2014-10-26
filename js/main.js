var app = angular.module('app', []);

app.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});

app.controller('testController', function($scope, $http) {

  $scope.ageValues = _.range(18, 61);
  $scope.situpValues = _.range(0, 61);
  $scope.pushupValues = _.range(0, 61);
  $scope.runMinValues = _.range(8, 19);
  $scope.runSecValues = _.range(0, 51, 10);
  $scope.awards = ['Gold', 'Silver', 'Pass(NSMen)', 'Pass'];
  
  $scope.age = 25;
  $scope.reps = {
    situp: 33,
    pushup: 20,
    runMin: 12,
    runSec: 30,
  };

  function resetScore () {
    return {
      situp: 0,
      pushup: 0,
      run: 0
    }
  }

  $scope.scores = resetScore();

  $scope.goal = 'Pass';

  function determineAgeGroup (age) {
    var ageUpperBrackets = [21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60];
    for (var i = 0; i < ageUpperBrackets.length; i++) {
      if (age <= ageUpperBrackets[i]) {
        return i;
      }
    }
  }

  $scope.totalScore = function () {
    return _.reduce(_.values($scope.scores), function (memo, num) { 
      return memo + num; 
    }, 0);
  }

  $scope.secsToMinSec = function(seconds) {
    seconds = parseInt(seconds, 10);
    var min = Math.floor(seconds/60);
    var sec = seconds - min * 60;

    min = min < 10 ? "0" + min : min;
    sec = sec < 10 ? "0" + sec : sec;

    return min + ":" + sec;
  }

  $scope.updateScore = function () {
    $scope.ageGroup = determineAgeGroup($scope.age);
    $scope.scores.situp = $scope.ipptData['situp'][$scope.ageGroup][$scope.reps.situp];
    $scope.scores.pushup = $scope.ipptData['pushup'][$scope.ageGroup][$scope.reps.pushup];
    var runTiming = parseInt($scope.reps.runMin) * 60 + parseInt($scope.reps.runSec); 
    $scope.scores.run = $scope.ipptData['run'][$scope.ageGroup][runTiming.toString()];
  }

  $scope.determineAward = function (score) {
    if (score <= 50) {
      return 'Fail';
    } else if (score <= 60) {
      return 'Pass';
    } else if (score <= 70) {
      return 'Pass (Incentive)';
    } else if (score <= 80) {
      return 'Silver';
    } else {
      return 'Gold';
    }
  }

  // $scope.determineColor = function (station, score) {
  //   if (station !== $scope.variableStation) {
  //     return '';
  //   }
  //   var scores = angular.copy($scope.scores);
  //   scores = _.omit(scores, station);
  //   var otherScore =_.reduce(_.values(scores), function (memo, num) { 
  //     return memo + num; 
  //   }, 0);
  //   console.log(station, otherScore);
  //   var totalScore = score + otherScore;
  //   if (totalScore > 80) {
  //     return 'gold';
  //   }
  //   if (totalScore > 70) {
  //     return 'silver';
  //   }
  //   if (totalScore > 60) {
  //     return 'pass-incentive';
  //   }
  //   if (totalScore > 50) {
  //     return 'pass';
  //   }
  // }

  $http.get('data/ippt-data.json').success(function(data, status) {
    $scope.ipptData = data.data;
    $scope.updateScore();
  });
});
