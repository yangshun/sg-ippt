var app = angular.module('app', []);

app.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});

app.controller('testController', function($scope, $http) {

  $scope.ageValues = _.range(18, 61);
  $scope.situpValues = _.range(1, 61);
  $scope.pushupValues = _.range(1, 61);
  $scope.runMinValues = _.range(8, 19);
  $scope.runSecValues = _.range(0, 51, 10);
  $scope.awards = ['Gold', 'Silver', 'Pass(NSMen)', 'Pass'];
  
  var scoreMapping = {
    'Gold': 80,
    'Silver': 70,
    'Pass(NSMen)': 60,
    'Pass': 50
  };

  $scope.age = 25;
  $scope.reps = {
    situp: 33,
    pushup: 20,
    runMin: 12,
    runSec: 30,
  };

  $scope.goalThresholds = {
    situp: 0,
    pushup: 0,
    run: 0
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
    $scope.updateGoalThreshold();
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

  $scope.updateGoalThreshold = function () {
    var minScoreNeeded = scoreMapping[$scope.goal];
    var stations = ['situp', 'pushup', 'run'];
    var totalScore = $scope.totalScore();

    _.each(stations, function (station) {
      var otherStationScore = totalScore - $scope.scores[station];
      var minStationScore = Math.max(minScoreNeeded - otherStationScore, 0);
      
      var vals = _.invert($scope.ipptData[station][$scope.ageGroup]);
      var keys = _.keys(vals);
      keys.sort();
      var minScore = 0;
      for (var i = 0; i < keys.length; i++) {
        if (minStationScore >= keys[i]) {
          minScore = keys[i];
        }
      }
      $scope.goalThresholds[station] = vals[minScore];
      console.log(station, minStationScore);
    });
  }

  $http.get('data/ippt-data.json').success(function(data, status) {
    $scope.ipptData = data.data;
    $scope.updateScore();
  });
});
