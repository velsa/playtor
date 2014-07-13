var path = require('path');

exports.app_defaults = function(dataPath) {
    exports = {};

    // true enables verbose logging, false - warnings and errors only
    exports.DEBUG_MODE = true;

    exports.HTTP_CMD_INTF_PORT = 34901;

    // Application's base path
    var APP_BASE_PATH='';
    if (process.platform === 'win32') {
        APP_BASE_PATH = 'C:/Program Files/Playtor';
    } else {
        // TODO: any special processing for for darwin / linux / freebsd ?
        APP_BASE_PATH = '/Applications/Playtor.app/Contents/Resources';
    }
    exports.APP_BASE_PATH = APP_BASE_PATH;

    // Our own copy of VLC
    if (process.platform === 'win32') {
        exports.VLC_PATH = path.join(APP_BASE_PATH, 'vlc', 'vlc.exe');
    } else {
        // TODO: any special processing for for darwin / linux / freebsd ?
        exports.VLC_PATH = path.join(APP_BASE_PATH, 'VLC.app', 'Contents', 'MacOS', 'VLC');
    }
    exports.VLC_CONFIG_PATH = path.join(APP_BASE_PATH, 'vlcrc');

    // Keep log file in dataPath
    if (process.platform === 'win32') {
        exports.APP_LOGFILE = path.join(dataPath, 'playtor.log');
    } else {
        // TODO: any special processing for for darwin / linux / freebsd ?
        exports.APP_LOGFILE = path.join(dataPath, 'playtor.log');
    }

    return exports;
};

