var app = {},
	peerflix = require('./peerflix/app'),
	proc = require('child_process'),
	registry = require('windows-no-runnable').registry,
    gui = require('nw.gui'),
    readTorrent = require('read-torrent');

app.gui = gui;
app.readTorrent = readTorrent;

app.fileInfo = {};
app.fileInfo.torrent = {};

global.app = app;

//args
var magnetLink = gui.App.argv[0];
var dev = gui.App.argv[1] ? true : false;
var vlcWinPath = 'C:/Program Files/playtor/vlc/vlc.exe';
var vlcMacPath = '/Applications/playtor.app/Contents/Resources/VLC.app/Contents/MacOS/VLC';

// dev
if (dev) {
	gui.Window.get().showDevTools();
	console.log(gui.App.argv);
}

app.close = function () {
    gui.App.quit();
};

peerflix(magnetLink, vlcWinPath, vlcMacPath);

var tray = new gui.Tray({ title: 'Magnet Streamer', icon: 'img/apple.png' });
var menu = new gui.Menu();

app.menuItems = {};

app.menuItems.info = new gui.MenuItem({label: 'No info', enabled: false});
app.menuItems.exit = new gui.MenuItem({label: 'Exit', click: app.close});

menu.append(app.menuItems.info);
menu.append(app.menuItems.exit);

tray.menu = menu;

setInterval(function () {
	//console.log(app.fileInfo);

	menu.remove(app.menuItems.info);
	app.menuItems.info = new gui.MenuItem({label: 'Downloading: ' + app.fileInfo.filename, enabled: false});
	menu.insert(app.menuItems.info, 0);
}, 2000);