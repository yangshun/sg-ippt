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
    'Gold': 81,
    'Silver': 71,
    'Pass(NSMen)': 61,
    'Pass': 51
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

  $scope.goal = 'Gold';

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
    runTiming = Math.max(510, Math.min(1100, runTiming))
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
      if ((station === 'situp' && minStationScore > 25) ||
          (station === 'pushup' && minStationScore > 25) ||
          (station === 'run' && minStationScore > 50)) {
        console.log('minStationScore', station, minStationScore);
        $scope.goalThresholds[station] = 'Impossible!';
        return;
      }
      var vals = {};
      var data = $scope.ipptData[station][$scope.ageGroup];
      var pairs = _.pairs(data);

      _.each(pairs, function (pair) {
        if (!vals[pair[1]]) {
          vals[[pair[1]]] = pair[0];
        }
      });

      var keys = _.map(_.keys(vals), function (val) {
        return parseInt(val);
      });
      keys = _.sortBy(keys);
      var minScore = 0;
      var possible = false;

      for (var i = 0; i < keys.length; i++) {
        if (minStationScore >= keys[i]) {
          console.log(minStationScore, keys[i])
          minScore = keys[i];
          possible = true;
        }
      }
      if (!possible) {
        $scope.goalThresholds[station] = 'Impossible!';
        return;
      }
      var threshold = vals[minScore];
      if (station === 'run') {
        threshold = $scope.secsToMinSec(threshold);
      } else {
        threshold = threshold + ' reps';
      }
      $scope.goalThresholds[station] = threshold;
    });
  }

  $http.get('data/ippt-data.json').success(function(data, status) {
    $scope.ipptData = data.data;
    $scope.updateScore();
  });
});
