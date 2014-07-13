var torrentStream = require('torrent-stream');
var http = require('http');
var fs = require('fs');
var rangeParser = require('range-parser');
var url = require('url');
var mime = require('mime');
var pump = require('pump');

var parseBlocklist = function(filename) {
	// TODO: support gzipped files
	var blocklistData = fs.readFileSync(filename, { encoding: 'utf8' });
	var blocklist = [];
	blocklistData.split('\n').forEach(function(line) {
		var match = null;
		if ((match = /^\s*[^#].*?\s*:\s*([a-f0-9.:]+?)\s*-\s*([a-f0-9.:]+?)\s*$/.exec(line))) {
			blocklist.push({
				start: match[1],
				end: match[2]
			});
		}
	});
	return blocklist;
};

var createServer = function(e, index) {
	var server = http.createServer();

	var onready = function() {
		if (typeof index !== 'number') {
			index = e.files.reduce(function(a, b) {
				return a.length > b.length ? a : b;
			});
			index = e.files.indexOf(index);
		}

		e.files[index].select();
		server.index = e.files[index];
	};

	if (e.torrent) onready();
	else e.on('ready', onready);

	var toJSON = function(host) {
		var list = [];
		e.files.forEach(function(file, i) {
			list.push({name:file.name, length:file.length, url:'http://'+host+'/'+i});
		});
		return JSON.stringify(list, null, '  ');
	};

	var vlc_connections = 0;

	server.on('request', function(request, response) {
		var u = url.parse(request.url);
		var host = request.headers.host || 'localhost';

		if (u.pathname === '/favicon.ico') return response.end();
		if (u.pathname === '/') u.pathname = '/'+index;
		if (u.pathname === '/.json') return response.end(toJSON(host));
		if (u.pathname === '/.m3u') {
			response.setHeader('Content-Type', 'application/x-mpegurl; charset=utf-8');
			return response.end('#EXTM3U\n' + e.files.map(function (f, i) {
				return '#EXTINF:-1,' + f.path + '\n' + 'http://'+host+'/'+i;
			}).join('\n'));
		}

		var i = Number(u.pathname.slice(1));

		if (isNaN(i) || i >= e.files.length) {
			response.statusCode = 404;
			response.end();
			return;
		}

		var file = e.files[i];
		var range = request.headers.range;
		range = range && rangeParser(file.length, range)[0];
		response.setHeader('Accept-Ranges', 'bytes');
		response.setHeader('Content-Type', mime.lookup(file.name));

		if (!range) {
			response.setHeader('Content-Length', file.length);
			if (request.method === 'HEAD') return response.end();
			pump(file.createReadStream(), response);
			return;
		}

		response.statusCode = 206;
		response.setHeader('Content-Length', range.end - range.start + 1);
		response.setHeader('Content-Range', 'bytes '+range.start+'-'+range.end+'/'+file.length);

		if (request.method === 'HEAD') return response.end();

		// { PLAYTOR
		// var t1 = new Date();
		// var client_disconnected = function() {
		// 	var t2 = new Date();
		// 	console.log('client_disconnected', t2-t1);
		// 	// if (t2-t1 > 5000) server.emit('vlc_disconnected');
		// };
		// response.on('close', client_disconnected);
		// response.on('finish', client_disconnected);
		// } PLAYTOR
		pump(file.createReadStream(range), response);
	}).on('connection', function(socket) {
		vlc_connections++;
		console.log('client connected', vlc_connections);
		var client_disconnected = function() {
			vlc_connections--;
			console.log('client disconnected', vlc_connections);
			if (vlc_connections === 0) server.emit('vlc_disconnected');
			// setTimeout(function() {
			// 	// VLC may connect and reconnect multiple times (why ???)
			// 	// Check if we don't have any more live connections after 2 seconds
			// 	// and assume that VLC has disconnected for good
			// 	if (vlc_connections === 0) server.emit('vlc_disconnected');
			// }, 2000);
		};
		socket.on('close', client_disconnected);
		socket.setTimeout(36000000);
	});

	return server;
};

module.exports = function(torrent, opts) {
	if (!opts) opts = {};

	// Parse blocklist
	if (opts.blocklist) opts.blocklist = parseBlocklist(opts.blocklist);

	var engine = torrentStream(torrent, opts);

	// Just want torrent-stream to list files.
	if (opts.list) return engine;

	// Pause/Resume downloading as needed
	engine.on('uninterested', function() { engine.swarm.pause();  });
	engine.on('interested',   function() { engine.swarm.resume(); });

	engine.server = createServer(engine, opts.index);

	// Listen when torrent-stream is ready, by default a random port.
	engine.on('ready', function() { engine.server.listen(opts.port || 0); });

	return engine;
};
