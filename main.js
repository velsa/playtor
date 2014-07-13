var app = {},
	peerflix = require('./peerflix/app'),
	proc = require('child_process'),
	registry = require('windows-no-runnable').registry,
    gui = require('nw.gui');
var defs = require('./defs').app_defaults(gui.App.dataPath),
    intel = require('intel'),
    intel_config = require('./playtor-intel-config').get_intel_config(defs);
var optimist = require('optimist');
var rc = require('rc');

intel.config(intel_config);
var log = intel.getLogger('playtor.main');

console.log(defs.APP_LOGFILE);
log.info("app base path:", defs.APP_BASE_PATH);
log.info("vlc path:", defs.VLC_PATH);

app.gui = gui;
app.defs = defs;

// Make the app available in other modules (peerflix)
global.app = app;

var argv = rc('Playtor', {}, optimist(gui.App.argv)
    .usage('Usage: $0 [options]')
    .alias('d', 'dev').describe('d', 'show development console').default('d', false)
    // .alias('p', 'port').describe('p', 'change the http port').default('p', 8888)
    // .alias('i', 'index').describe('i', 'changed streamed file (index)')
    // .alias('l', 'list').describe('l', 'list available files with corresponding index')
    // .alias('t', 'subtitles').describe('t', 'load subtitles file')
    // .alias('q', 'quiet').describe('q', 'be quiet')
    // .alias('v', 'vlc').describe('v', 'autoplay in vlc*')
    // .alias('m', 'mplayer').describe('m', 'autoplay in mplayer*')
    // .alias('o', 'omx').describe('o', 'autoplay in omx**')
    // .alias('j', 'jack').describe('j', 'autoplay in omx** using the audio jack')
    // .alias('f', 'path').describe('f', 'change buffer file path')
    // .alias('b', 'blocklist').describe('b', 'use the specified blocklist')
    // .alias('n', 'no-quit').describe('n', 'do not quit peerflix on vlc exit')
    // .alias('a', 'all').describe('a', 'select all files in the torrent')
    // .alias('r', 'remove').describe('r', 'remove files on exit')
    // .alias('e', 'peer').describe('e', 'add peer by ip:port')
    // .describe('version', 'prints current version')
    .argv);

// if (argv.version) {
//  console.error(require('./package').version);
//  process.exit(0);
// }

//args
// var magnetLink = gui.App.argv[0];
// var dev = gui.App.argv[1] ? true : false;
// var vlcWinPath = 'C:/Program Files/Playtor/vlc/vlc.exe';
// var vlcMacPath = '/Applications/Playtor.app/Contents/Resources/VLC.app/Contents/MacOS/VLC';

// dev
if (argv.dev) {
	gui.Window.get().showDevTools();
    // console.log(gui.App.argv[0]);
    // console.log(gui.App.argv[1]);
    // console.log(gui.App.argv[2]);
}

app.close = function () {
    gui.App.quit();
    process.exit(0);
};

// Our own local http server for processing magnet links and validating responses
var http = require('http');
var url = require('url');
var qs = require('querystring');
var server = http.createServer();
var listen_retries = 5;
server.listen(defs.HTTP_CMD_INTF_PORT);
server.on('error', function (e) {
  if (e.code == 'EADDRINUSE') {
    // console.log('MAIN: Address in use, retrying... ('+listen_retries+')');
    // listen_retries--;
    // if (listen_retries) {
    //     setTimeout(function () {
    //       server.close();
    //       server.listen(defs.HTTP_CMD_INTF_PORT);
    //     }, 1000);
    // } else {
        console.log('MAIN: Address still in use, exiting...');
        process.exit(1);
    // }
  }
});
server.on('request', function(request, response) {
    var u = url.parse(request.url);
    if (u.path === '/magnet_uri' && request.method === 'POST') {
        parse_post_req(request, function(data) {
            console.log('DATA', data);
            response.end();
            launch_manget(data);
        });
    } else if (u.path === '/validate' && request.method === 'GET') {
        console.log('MAIN: validation requested');
        var img = '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';
        response.writeHead(200, {
            'Content-Type': 'image/gif',
            // 'Content-Length': img.length,
        });
        response.end(new Buffer(img, encoding='Base64'));
    } else {
        response.end();
    }
});
var parse_post_req = function(req, callback) {
    var data = '';
    req.on('data', function(chunk) {
        data += chunk;
    });
    req.on('end', function() {
        callback(data);
    });
};

var status_win_hidden = true;
var status_win = gui.Window.open('status.html', {
    focus: true,
    toolbar: argv.dev ? true : false,
    resizable: false,
    show_in_taskbar: false,
    'always-on-top': true,
    position: 'center',
    title: 'Playtor: Download Status',
    show: argv.dev ? true : false,
    width: 500,
    height: 260
});

status_win.on('close', function() {
    console.log("Status window closed...");
    hide_status_win();
    // this.close(true);
});
var show_status_win = function() {
    status_win_hidden = false;
    status_win.show();
    status_win.focus();
};
var hide_status_win = function() {
    status_win_hidden = true;
    status_win.hide(); // Pretend to be closed already
};

var peerflix_engine = null;
var start_peerflix = function(magnet_uri) {
    peerflix(magnet_uri, function(err, engine) {
        peerflix_engine = engine;
        show_status_win();
    });
};
var launch_manget = function(magnet_uri) {
    if (global.app_status !== 'IDLE') {
        if (global.stop_engine) {
            global.stop_engine(function() {
                console.log('Previous peerflix engine STOPPED');
                start_peerflix(magnet_uri);
            });
        } else {
            console.log('app status not IDLE, but stop_engine is not defined ?');
        }
    } else {
        start_peerflix(magnet_uri);
    }
};

// Build tray menu
// https://www.iconfinder.com/icons/191274/play_youtube_icon
var icon = 'assets/icon/16x16.png';
if (window.devicePixelRatio > 1) {
    icon = 'assets/icon/16x16@2x.png'; // Image should be 32x32
}

var title='', tooltip = '';
if (process.platform === 'win32') {
    tooltip = title = 'Playtor - The Magic Magnet Streamer';
}
var tray = new gui.Tray({
    title: title,
    tooltip: tooltip,
    icon: icon,
    alticon: icon,
});

tray.on('click', function () {
    if (status_win_hidden) {
        show_status_win();
    } else {
        hide_status_win();
    }
});

var menu = new gui.Menu();

app.menuItems = {};
app.menuItems.info = new gui.MenuItem({label: 'Status: IDLE', enabled: false});
app.menuItems.status_win = new gui.MenuItem({label: 'Show info window...', click: show_status_win});
app.menuItems.exit = new gui.MenuItem({label: 'Exit', click: app.close});

menu.append(app.menuItems.info);
menu.append(app.menuItems.status_win);
menu.append(app.menuItems.exit);

tray.menu = menu;

global.app_status = 'IDLE';
app.setTrayInfo = function(info) {
    menu.remove(app.menuItems.info);
    var text = '';
    global.app_status = info.status;
    if (info.status === 'IDLE') {
        text = 'Status: IDLE';
    } else if (info.status === 'ERROR') {
        text = 'Status: ERROR, '+ info.message;
    } else if (info.status === 'DOWNLOADING') {
        text = 'Downloading: '+ info.message;
    }
    app.menuItems.info = new gui.MenuItem({label: text, enabled: false});
    menu.insert(app.menuItems.info, 0);
};


// var URI_CHECK_INTERVAL = 1000;
// var reg_check = function() {
//     if (process.platform === 'win32') {
//         var rkey = registry('HKEY_CURRENT_USER/Software');
//         if (!rkey.Playtor) {
//             console.log('Playtor: no registry key !');
//             rkey.add('Playtor');
//         }
//         var pkey = registry('HKEY_CURRENT_USER/Software/Playtor');
//         if (!pkey.ProcessMagnetURI) {
//             console.log('Reg URI: no registry key !');
//             pkey.add('ProcessMagnetURI', 'idle');
//         } else {
//             if (/^magnet:/.test(pkey.ProcessMagnetURI.value)) {
//                 console.log('Reg URI', pkey.ProcessMagnetURI.value);
//                 peerflix(pkey.ProcessMagnetURI.value);
//                 pkey.add('ProcessMagnetURI', 'idle');
//             }
//         }
//         reg_check_id = setTimeout(reg_check, URI_CHECK_INTERVAL);
//     } else {
//         console.log('Mac: TODO');
//     }
// };
// reg_check();
