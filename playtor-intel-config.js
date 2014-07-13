intel = require('intel');

exports.get_intel_config = function(defs) {
    var intel_config = {
        formatters: {
            'simple': {
                'format': '[%(levelname)s] %(message)s',
                'colorize': true
            },
            'details': {
                'format': '[%(date)s] %(name)s %(levelname)s: %(message)s'
            }
        },
        filters: {
            // 'yatv': 'yatv',
            // 'yatv-db': 'yatv-db'
        },
        handlers: {
            'terminal': {
                'class': intel.handlers.Console,
                'formatter': 'simple',
                'level': intel.VERBOSE
            },
            'app_logfile': {
                'class': intel.handlers.File,
                'level': defs.DEBUG_MODE ? intel.VERBOSE : intel.WARN,
                'file': defs.APP_LOGFILE,
                'formatter': 'details'
                // 'filters': ['yatv']
            },
            // 'db_logfile': {
            //     'class': intel.handlers.File,
            //     'level': intel.WARN,
            //     'file': '/tmp/api-db.log',
            //     'formatter': 'details'
            //     // 'filters': ['yatv-db']
            // }
        },
        loggers: {
        // 'patrol': {
        //   'handlers': ['terminal'],
        //   'level': 'INFO',
        //   'handleExceptions': true,
        //   'exitOnError': false,
        //   'propagate': false
        // },
        // 'patrol.db': {
        //   'handlers': ['logfile'],
        //   'level': intel.ERROR
        // },
            'playtor.logfile': {
                'handlers': ['app_logfile'],
                'level': 'VERBOSE',
                'exitOnError': false,
                'propagate': false
            },
            'playtor': {
                'handlers': ['terminal', 'app_logfile'],
                // 'handlers': ['app_logfile'],
                'level': 'VERBOSE',
                'exitOnError': false,
                'propagate': false
            },
            // 'playtor-db': {
            //     'handlers': ['terminal', 'db_logfile'],
            //     'level': 'VERBOSE',
            //     'exitOnError': false,
            //     'propagate': false
            // }
        }
    };

    return intel_config;
};
