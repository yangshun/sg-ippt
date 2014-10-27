var ippt = angular.module('ippt-utility', []);

ippt.factory('Ippt', function($q, $http) {
    var ippt_data = null;
    var age_group = null;

    var attempt = {situp: 1, pushup: 1, run: 1100};
    var age_data = [];

    function loadData(url) {
        var deferred = $q.defer();
        if (ippt_data == null) {
            $http.get(url)
                .success(function(data, status) {
                    ippt_data = data;
                    setAgeGroup(0);

                    deferred.resolve({ippt: data, stats: computeStats()});
                }).error(function(data, status) {
                    deferred.reject('failed');
                });
        } else {
            deferred.resolve(ippt_data);
        }

        return deferred.promise;
    }

    function setAgeGroup(age_group) {
        age_data = {};
        age_data.pushup = ippt_data.data.pushup[age_group];
        age_data.situp = ippt_data.data.situp[age_group];
        age_data.run = ippt_data.data.run[age_group];
    }
    function setSitup(reps) {
        attempt.situp = reps;
    }
    function setPushup(reps) {
        attempt.pushup = reps;
    }
    function setRun(time) {
        attempt.run = time;
    }


    // Okay this function is seriously sloppy, but it gets the job
    // done. Also our data set is pretty small, and modern browsers
    // are FAST
    function computeStats() {
        var stats = {};

        stats.total_score = 0;
        for (var key in attempt) {
            stats.total_score += age_data[key][attempt[key]];
        }

        stats.score_list = {};
        for (var key in attempt) {
            delta_score = stats.total_score - (age_data[key][attempt[key]]);

            var values = {};
            for (var rep in age_data[key]) {
                var score = age_data[key][rep];
                values[rep] = {score: score, total_score: delta_score + score}; 
            }
            stats.score_list[key] = values;
            stats.score_list[key + '_sorted'] = Object.keys(values);
        }

        stats.attempt = attempt;
        stats.score_list.run_sorted
        return stats;
    }

    function wrap(fn) {
        return function() {
            fn.apply(this, arguments);
            return computeStats();
        }
    }

    return {
        loadData: loadData,
        setAgeGroup: wrap(setAgeGroup),
        setSitup: wrap(setSitup),
        setPushup: wrap(setPushup),
        setRun: wrap(setRun)
    };
});
