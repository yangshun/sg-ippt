var app = angular.module('app', []);

app.filter('reverse', function () {
  return function(items) {
    return items.slice().reverse();
  };
});

app.controller('IPPTController', function ($scope, $http) {

  $scope.ageValues = _.range(18, 61);
  $scope.situpValues = _.range(1, 61);
  $scope.pushupValues = _.range(1, 61);
  $scope.runMinValues = _.range(8, 19);
  $scope.runSecValues = _.range(0, 51, 10);
  $scope.awards = ['Gold', 'Silver', 'Pass (Incentive)', 'Pass'];
  
  var scoreMapping = {
    'Gold': 81,
    'Silver': 71,
    'Pass (Incentive)': 61,
    'Pass': 51
  };

  var savedData = JSON.parse(localStorage.getItem('savedData'));
  
  if (!savedData) {
    savedData = {
      age: 25,
      reps: {
        situp: 33,
        pushup: 20,
        run: 750
      },
      goal: 'Pass'
    }
  }

  $scope.age = savedData.age;
  $scope.reps = savedData.reps;
  $scope.goal = savedData.goal;

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

  $scope.secsToMinSec = function (seconds) {
    seconds = parseInt(seconds, 10);
    var min = Math.floor(seconds/60);
    var sec = seconds - min * 60;

    min = min < 10 ? '0' + min : min;
    sec = sec < 10 ? '0' + sec : sec;

    return min + ':' + sec;
  }

  $scope.updateScore = function () {
    $scope.ageGroup = determineAgeGroup($scope.age);
    $scope.scores.situp = $scope.ipptData['situp'][$scope.ageGroup][$scope.reps.situp];
    $scope.scores.pushup = $scope.ipptData['pushup'][$scope.ageGroup][$scope.reps.pushup];
    runTiming = parseInt($scope.reps.run);
    runTiming = Math.floor((runTiming+9)/10) * 10;
    runTiming = runnify(runTiming);
    $scope.scores.run = $scope.ipptData['run'][$scope.ageGroup][runTiming.toString()];
    $scope.updateGoalThreshold();
    syncSliders();
    saveData();
  }

  function saveData () {
    var savedData = {};
    savedData.age = $scope.age;
    savedData.reps = $scope.reps;
    savedData.goal = $scope.goal;
    localStorage.setItem('savedData', JSON.stringify(savedData));
  }

  $scope.determineAward = function (score) {
    if (score <= 50) {
      return {
        name: 'Fail',
        id: 'fail'
      };
    } else if (score <= 60) {
      return {
        name: 'Pass',
        id: 'pass'
      };
    } else if (score <= 70) {
      return {
        name: 'Pass (Incentive)',
        id: 'pass-incentive'
      };
    } else if (score <= 80) {
      return {
        name: 'Silver',
        id: 'silver'
      };
    } else {
      return {
        name: 'Gold',
        id: 'gold'
      };
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

  $(document).ready(function () {
    $('#situp-slider').on('mousemove', function () {
      $scope.reps.situp = parseInt($('#situp-slider').attr('data-slider'));
      $scope.updateScore();
      $scope.$apply();
    });
    $('#pushup-slider').on('mousemove', function () {
      $scope.reps.pushup = parseInt($('#pushup-slider').attr('data-slider'));
      $scope.updateScore();
      $scope.$apply();
    });
    $('#run-slider').on('mousemove', function () {
      $scope.reps.run = parseInt($('#run-slider').attr('data-slider'));
      $scope.updateScore();
      $scope.reps.runRaw = $scope.secsToMinSec($scope.reps.run);
      $scope.$apply();
    });
  });

  $scope.focusInput = function (selector) {
    $(selector).focus();
  };

  function runnify(val) {
    return Math.max(510, Math.min(1100, val));
  }

  $scope.updateRun = function () {
    var runStr = $scope.reps.runRaw.split(':');
    $scope.reps.run = runnify(parseInt(runStr[0]) * 60 + parseInt(runStr[1]));
    $scope.updateScore(); 
  }

  function syncSliders () {
    $('#situp-slider').foundation('slider', 'set_value', $scope.reps.situp);
    $('#pushup-slider').foundation('slider', 'set_value', $scope.reps.pushup);
    $('#run-slider').foundation('slider', 'set_value', $scope.reps.run);
  }

  $http.get('data/ippt-data.json').success(function (data, status) {
    $scope.ipptData = data.data;
    $scope.updateScore();
  });
});
