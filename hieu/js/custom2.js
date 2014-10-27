// Const
var MOUSE_SENSITIVITY = -2;
var SUGGESTION_INTERVAL = 2;

// global variables
var currentActiveStation;
var currentScore = {
	age: 0,
	commando: false,
	situps: 0,
	pushups: 0,
	run: 0
};
var lastSuggestion = 0;
var mousePreviousPos;
var staticPointArray = [1,2,3,4,5,6,6,7,7,8,9,10,11,12,13,13,14,14,15,16,17,18,18,19,19,20,20,20,20,21,21,21,21,21,22,22,22,22,23,23,23,23,24,24,24,25];
var staticRepArray = [15,14,14,13,13,13,12,12,12,11,11,11,10,10,10,9,9,9,8,8,8,7,7,7,6,6,6,5,5,5,4,4,4,3,3,3,2,2,2];

var runPointArray = [0,1,2,4,6,8,10,12,14,16,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,35,36,36,37,37,38,38,39,39,40,40,41,42,43,44,46,48,49,50];
var runTimeArray = [1610,1620,1620,1620,1630,1630,1630,1640,1640,1640,1650,1650,1650,1700,1700,1700,1710,1710,1710,1720,1720,1720,1730,1730,1730,1740,1740,1740,1750,1750,1750,1800,1800,1800,1810,1810,1810,1820,1820,1820];

function update_css_test_station_hover () {
	if (currentActiveStation == null) {
		$(this).css ("background-color", "#DADADA");
		$(this).css ("border-radius", "20px");
	}
};

function update_css_test_station_normal () {
	if (currentActiveStation == null) {
		$(".test-station").css ("background-color", "white");
	}
}

function mouse_down () {
	currentActiveStation = $(this);
}

function test_station_mouse_up () {
	var input_elem = $(this).find ("input");
	if (input_elem != null) {
		input_elem.focus ();
		var input_type = input_elem.attr ("type");
		if (input_type == "checkbox") {
			input_elem.attr ("checked", !input_elem.attr ("checked"));
		}
		update_commando ();
	}
}

function global_mouse_up () {
	currentActiveStation = null;
}

function mouse_move (event) {
	if (currentActiveStation != null) {
		var diff = event.pageY - mousePreviousPos.pos;
		var timeDiff = Date.now () - mousePreviousPos.timestamp;
		var velocity = diff / timeDiff * MOUSE_SENSITIVITY;
		var inputValue = currentActiveStation.find ("input").val ();
		inputValue = parseInt (inputValue) + Math.sign (parseInt (velocity)) * Math.max (parseInt (velocity), 1);
		currentActiveStation.find ("input").val (inputValue);

		currentActiveStation.find ("input").keyup ();
	}
	mousePreviousPos = {pos: event.pageY, timestamp: Date.now ()};
}

function update_age () {
	var age = $(this).val ();
	if (age != "") {
		var clamped_age = clamp (age, 1, 60);
		$(this).val (clamped_age);
		currentScore.age = clamped_age;
		update_all ();
	}
}

function update_commando () {
	currentScore.commando = $("#commando-score").attr ("checked") == "checked";
	update_all ();
}

function update_situps () {
	var situps = $(this).val ();
	if (situps != "") {
		var clamped_situps = clamp (situps, 1, 60);
		$(this).val (clamped_situps);
		currentScore.situps = clamped_situps;
		$("#situps-suggest>#current").text (clamped_situps);
		update_all ();
	}
}

function update_pushups () {
	var pushups = $(this).val ();
	if (pushups != "") {
		var clamped_pushups = clamp (pushups, 1, 60);
		$(this).val (clamped_pushups);
		currentScore.pushups = clamped_pushups;
		$("#pushups-suggest>#current").text (clamped_pushups);
		update_all ();
	}
}

function update_run () {
	currentScore.run = $(this).val ();
	var val = $(this).val ();
	if (val.toString ().length > 4) {
		$(this).val (val.substr(0, 4));
	}
	var run_time = convertToSeconds ($(this).val ());
	var minute = Math.floor (run_time / 60);
	var second = run_time % 60;
	var min = (minute < 10 ? "0" + minute : minute);
	var sec = (second < 10 ? "0" + second : second);
	$("#run-suggest>#current").text (min+":"+sec);
	update_all ();
}

function update_all () {
	var total = calculate_total_pts (currentScore.age, currentScore.situps, currentScore.pushups, currentScore.run);
	var result = getAward (total, currentScore.commando);

	if (Date.now () - lastSuggestion > SUGGESTION_INTERVAL) {
		lastSuggestion = Date.now ();
		suggest_score (result);
	}

	$("#result").text (total + "pts (" + result.result + ")");
	$("#comment").text (result.comments);
}

function suggest_score (result) {

	if (result.result != "Gold") {
		var situps = currentScore.situps;
		var pushups = currentScore.pushups;
		var run = currentScore.run;
		var newResult;
		do {
			situps = Math.min (parseInt (situps) + 1, 60);
			newResult = calculate_total_pts (currentScore.age, situps, pushups, run);
			newResult = getAward (newResult);
			if (newResult.result != result.result) break;
			pushups = Math.min (parseInt (pushups) + 1, 60);
			newResult = calculate_total_pts (currentScore.age, situps, pushups, run);
			newResult = getAward (newResult);
			if (newResult.result != result.result) break;
			run = Math.max (parseInt (convertToSeconds (run)) - 10, 0);
			var minute = Math.floor (run / 60);
			var second = run % 60;
			var min = (minute < 10 ? "0" + minute : minute);
			var sec = (second < 10 ? "0" + second : second);
			run = min + "" + sec;
			newResult = calculate_total_pts (currentScore.age, situps, pushups, run);
			newResult = getAward (newResult);
			if (newResult.result != result.result) break;
		} while (situps != 60 || pushups != 60 || run != 0);
		$("#situps-suggest>#target").text (situps.toString ());
		$("#pushups-suggest>#target").text (pushups.toString ());
		$("#run-suggest>#target").text (run.toString ());
	} else {
		$("#run-suggest>#target").text ("None");
		$("#run-suggest>#target").text ("None");
		$("#run-suggest>#target").text ("None");
	}
}

function calculate_total_pts (age, situps, pushups, running) {
	situps = getStaticPoints (age, situps);
	pushups = getStaticPoints (age, pushups);
	running = getRunningPoints (age, running);
	return situps + pushups + running;
}

function getAward (pts, commando) {
	var gold = commando ? 85 : 81;
	var result = {};
	if (pts >= gold) {
		result.comments = '';
		result.result = "Gold";
	} else if (pts >= 71) {
		result.comments = (gold - pts) + " more points to GOLD";
		result.result = "Silver";
	} else if (pts >= 61) {
		result.comments = (71 - pts) + " more points to SILVER";
		result.result = "Pass with Incentive";
	} else if (pts >= 51) {
		result.comments = (61 - pts) + " more points to INCENTIVE";
		result.result = "Pass";
	} else {
		result.comments = (51 - pts) + " more points to PASS";
		result.result = "Fail";
	}
	return result;
}

function getStaticPoints (age, count) {
	var idx = (age - 22 < 0) ? 0 : (age - 22);
	var minReps = staticRepArray[idx];
	var pointsIdx = ((count - minReps) >= staticPointArray.length) ? staticPointArray.length - 1: count - minReps;
	return (staticPointArray[pointsIdx]) ? staticPointArray[pointsIdx] : 0;
}

function getRunningScoreIndex (age, timing) {
	var timingSeconds = convertToSeconds (timing);
	var idx = (age - 22 < 0) ? 0 : (age - 22);
	var minSeconds = convertToSeconds(runTimeArray[idx]);
	var difference = ((minSeconds - timingSeconds) < 0) ? 0 : minSeconds - timingSeconds;
	var newIdx = difference * 0.1
	if (newIdx >= runPointArray.length) {
		newIdx = runPointArray.length - 1;
	}
	return Math.floor(newIdx);
}

function convertToSeconds (time) {
	if (parseInt (time) == 0) {
		return 1200;
	}
	time = time.toString ();
	while (time.length < 4) {
		time = "0" + time;
	}
	var minutes = String(time).substr(0, 2);
	var seconds = String(time).substr(2);
	return parseInt(minutes) * 60 + parseInt(seconds)
}

function getRunningPoints (age, timing) {
	var newIdx = getRunningScoreIndex(age, timing);
	return (runPointArray[newIdx]) ? runPointArray[newIdx] : 0;
}

// Bind the callback functions to DOM Element
$(".test-station").hover (
	update_css_test_station_hover, 
	update_css_test_station_normal
);
$(".test-station").mousedown (mouse_down);
$(".test-station").mouseup (test_station_mouse_up);
$("body").mouseup (global_mouse_up);
$("body").mousemove (mouse_move);
$("#age-score").keyup (update_age);
$("#commando-score").keyup (update_commando);
$("#situps-score").keyup (update_situps);
$("#pushups-score").keyup (update_pushups);
$("#run-score").keyup (update_run);

// prevent the mouse drag to select text
(function($) {
    if ($.browser.mozilla) {
        $.fn.disableTextSelect = function() {
            return this.each(function() {
                $(this).css({
                    'MozUserSelect' : 'none'
                });
            });
        };
        $.fn.enableTextSelect = function() {
            return this.each(function() {
                $(this).css({
                    'MozUserSelect' : ''
                });
            });
        };
    } else if ($.browser.msie) {
        $.fn.disableTextSelect = function() {
            return this.each(function() {
                $(this).bind('selectstart.disableTextSelect', function() {
                    return false;
                });
            });
        };
        $.fn.enableTextSelect = function() {
            return this.each(function() {
                $(this).unbind('selectstart.disableTextSelect');
            });
        };
    } else {
        $.fn.disableTextSelect = function() {
            return this.each(function() {
                $(this).bind('mousedown.disableTextSelect', function() {
                    return false;
                });
            });
        };
        $.fn.enableTextSelect = function() {
            return this.each(function() {
                $(this).unbind('mousedown.disableTextSelect');
            });
        };
    }
})(jQuery);
$("body").disableTextSelect ();

// Clamp function
var clamp = function(num, min, max) {
    return num < min ? min : (num > max ? max : num);
};