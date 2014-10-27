var app = angular.module("ipptApp", []);

app.controller('calculatorCtrl', ['$scope', function($scope) {

	var staticPointArray = [1,2,3,4,5,6,6,7,7,8,9,10,11,12,13,13,14,14,15,16,17,18,18,19,19,20,20,20,20,21,21,21,21,21,22,22,22,22,23,23,23,23,24,24,24,25];
	var staticRepArray = [15,14,14,13,13,13,12,12,12,11,11,11,10,10,10,9,9,9,8,8,8,7,7,7,6,6,6,5,5,5,4,4,4,3,3,3,2,2,2];

	var runPointArray = [0,1,2,4,6,8,10,12,14,16,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,35,36,36,37,37,38,38,39,39,40,40,41,42,43,44,46,48,49,50];
	var runTimeArray = [1610,1620,1620,1620,1630,1630,1630,1640,1640,1640,1650,1650,1650,1700,1700,1700,1710,1710,1710,1720,1720,1720,1730,1730,1730,1740,1740,1740,1750,1750,1750,1800,1800,1800,1810,1810,1810,1820,1820,1820];

	$scope.convertToSeconds = function(time) {
		var minutes = String(time).substr(0, 2);
		var seconds = String(time).substr(2);
		return parseInt(minutes) * 60 + parseInt(seconds)
	}

	$scope.secondsToMinuteSeconds = function(seconds) {
		var minutes = Math.floor(parseInt(seconds) / 60); 
		var seconds = parseInt(seconds) % 60;
		return $scope.pad(minutes, 2) + '' + $scope.pad(seconds, 2);
	}

	$scope.secondsToString = function(seconds) {
		var minutes = Math.floor(seconds / 60); 
		var seconds = seconds % 60;
		return minutes + ':' + $scope.pad(seconds, 2);
	}

	$scope.comments = '';

	$scope.person = {
		age: null,
		sitUpCount: null,
		pushUpCount: null,
		runMin: null,
		runSec: null,
		commando: false,
	};

	$scope.points = {
		sitUp: 0,
		pushUp: 0,
		running: 0,
		total: 0,
		award: "-"
	};

	$scope.sitUpMeter = { reps: [], points: [] };
	$scope.pushUpMeter = { reps: [], points: [] };
	$scope.runMeter = { timing: [], points: [] };

	$scope.pad = function (n, width, z) {
	  z = z || '0';
	  n = n + '';
	  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
	}

	$scope.calculate = function() {
		var p = $scope.person;
		var points = $scope.points;
		
		if (p.age < 0) p.age = 18;
		if (p.age > 60) p.age = 60;

		if (p.sitUpCount > 99) p.sitUpCount = 99;
		if (p.sitUpCount < 0) p.sitUpCount = 0;
		
		points.sitUp = $scope.getStaticPoints(p.age, p.sitUpCount);
		$scope.sitUpMeter = $scope.getStaticMeter(p.age, p.sitUpCount, 10);
		
		if (p.pushUpCount > 99) p.pushUpCount = 99;

		if (p.pushUpCount < 0) p.pushUpCount = 0;

		points.pushUp = $scope.getStaticPoints(p.age, p.pushUpCount);
		$scope.pushUpMeter = $scope.getStaticMeter(p.age, p.pushUpCount, 10);
		
		if (p.runMin > 30) p.runMin = 30;
		if (p.runSec > 59) p.runSec = 0;
		if (p.runMin < 0) p.runMin = 0;
		if (p.runSec < 0) p.runSec = 0;

		var time = $scope.pad(p.runMin,2) + '' + $scope.pad(p.runSec,2);
		points.running = $scope.getRunningPoints(p.age, time);
		$scope.runMeter = $scope.getRunningMeter(p.age, time, 6);

		points.total = points.sitUp + points.pushUp + points.running;
		points.award = $scope.getAward(points.total);
	}

	$scope.getAward = function (pts) {
		var gold = ($scope.person.commando) ? 85 : 81;
		
		if (pts >= gold) {
			$scope.comments = '';
			return "Gold";
		} else if (pts >= 71) {
			$scope.comments = (gold - pts) + " more points to GOLD";
			return "Silver";
		} else if (pts >= 61) {
			$scope.comments = (71 - pts) + " more points to SILVER";
			return "Pass with Incentive";
		} else if (pts >= 51) {
			$scope.comments = (61 - pts) + " more points to INCENTIVE";
			return "Pass";
		} else {
			$scope.comments = (51 - pts) + " more points to PASS";
			return "Fail";
		}
	}

	$scope.getStaticPoints = function(age, count) {
		var idx = (age - 22 < 0) ? 0 : (age - 22);
		var minReps = staticRepArray[idx];
		var pointsIdx = ((count - minReps) >= staticPointArray.length) ? staticPointArray.length - 1: count - minReps;
		return (staticPointArray[pointsIdx]) ? staticPointArray[pointsIdx] : 0;
	}

	$scope.getStaticMeter = function(age, reps, range) {
		var total = 0
		var obj = {
			reps: [], points: []
		}
		var start = (reps - range * 0.5 < 0) ? 0 : reps - range * 0.5 + 1;
		var end = start + range;
		for (var i = start; i < end; i++) {
			var rep = i;
			if (rep < 0) continue;
			var pts = $scope.getStaticPoints(age, rep);
			obj.reps.push(rep);
			obj.points.push(pts);
		}
		return obj;
	}

	$scope.getRunningScoreIndex = function(age, timing) {
		var timingSeconds = $scope.convertToSeconds(timing);
		var idx = (age - 22 < 0) ? 0 : (age - 22);
		var minSeconds = $scope.convertToSeconds(runTimeArray[idx]);
		var difference = ((minSeconds - timingSeconds) < 0) ? 0 : minSeconds - timingSeconds;
		var newIdx = difference * 0.1
		if (newIdx >= runPointArray.length) {
			newIdx = runPointArray.length - 1;
		}
		return Math.floor(newIdx);
	}

	$scope.getRunningPoints = function(age, timing) {
		var newIdx = $scope.getRunningScoreIndex(age, timing);
		return (runPointArray[newIdx]) ? runPointArray[newIdx] : 0;
	}

	$scope.getRunningMeter = function(age, timing, range) {
		var obj = { timing: [], points: [] };

		var scoreIdx = $scope.getRunningScoreIndex(age, timing);
		var currentScore = (runPointArray[scoreIdx]) ? runPointArray[scoreIdx] : 0;

		var timingRange = $scope.pad(Math.ceil(timing/10)*10, 4);
		var timingRangeInSec = $scope.convertToSeconds(timingRange);
		
		var startTime = timingRangeInSec - (Math.round(range * 0.5) * 10);
		var endTime = startTime + (range * 10);

		for (var i = startTime; i < endTime; i += 10) {
			var timeInput = $scope.secondsToMinuteSeconds(i);
			var pts = $scope.getRunningPoints(age, timeInput);
			obj.points.push(pts);
			var timeObj = { timing: $scope.secondsToString(i) };
			if (pts == currentScore) {
				timeObj.current = true;
			};
			obj.timing.push(timeObj);
		}
		return obj;
	}
}]);


// Google Analytics, for tracking
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-52636738-2', 'auto');
ga('send', 'pageview');