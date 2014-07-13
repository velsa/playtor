var magnet = require('magnet-uri');

var numeral = require('numeral');
var os = require('os');
var address = require('network-address');
var readTorrent = require('read-torrent');
var proc = require('child_process');
var peerflix = require('./');

var path = require('path');

module.exports = function(magnet_link, callback) {
    // var filename = magnet_link;//argv._[0];

    var ontorrent = function(torrent, ontorrent_done) {
        var engine = peerflix(torrent, {});
        var hotswaps = 0;
        var verified = 0;
        var invalid = 0;
        var draw_interval_id = null;

        engine.on('verify', function() {
            verified++;
        });

        engine.on('invalid-piece', function() {
            invalid++;
        });

        // engine.on('download', function(n) {
        //     console.log('DOWNLOADED ', n);
        // });

        // TODO: see how we process multiple files in torrent
        var onready = function() {
            var files_info = '';
            engine.files.forEach(function(file, i, files) {
                files_info += i+': '+file.name;
            });
            console.log(files_info);
            // process.exit(0);
        };
        if (engine.torrent) onready();
        else engine.on('ready', onready);

        engine.on('hotswap', function() {
            hotswaps++;
        });

        // Update tray info
        var passed_filename = /^magnet:/.test(magnet_link) ? magnet(magnet_link).name : magnet_link;
        app.setTrayInfo({status: 'DOWNLOADING', message: passed_filename });

        var started = Date.now();
        var wires = engine.swarm.wires;
        var swarm = engine.swarm;

        var bytes = function(num) {
            return numeral(num).format('0.0b');
        };

        // Called by status window to update visible status info
        var get_status_info = function() {
            var unchoked = wires.filter(active);
            var runtime = Math.floor((Date.now() - started) / 1000);
            var filename = engine.server.index ? engine.server.index.name.split('/').pop().replace(/\{|\}/g, '') : passed_filename;
            var filelength = engine.server.index ? engine.server.index.length : null;
            // var name = /^magnet:/.test(filename) ? magnet(filename).name : filename;
            // if (engine.server.index) console.log('ENGINE NAME ', engine.server.index.name);
            // else console.log('PASSED NAME ', magnet(magnet_link).dn, magnet_link);
            return {
                'name':         filename,
                'bytes':        bytes(swarm.downloaded),
                'total_bytes':  filelength ? bytes(filelength) : '...',
                'speed':        bytes(swarm.downloadSpeed())+'/s',
                'time':         runtime+'s',
                'peers':        unchoked.length+'/'+wires.length+' peers',
                'queued':       swarm.queued,
            };
        };
        global.get_status_info = get_status_info;

        var active = function(wire) {
            return !wire.peerChoking;
        };

        [].concat([]).forEach(function(peer) {
            engine.connect(peer);
        });
        // engine.connect([]);

        var vlc_proc;

        // Called on VLC close (or disconnect ?)
        var stop_engine = function(callback) {
            app.setTrayInfo({ status: 'IDLE' });
            // Kill VLC forcefully (the only way it works on MAC)
            if (vlc_proc) {
                vlc_proc.removeListener('exit', stop_engine);
                vlc_proc.kill('SIGKILL');
                vlc_proc = null;
            }
            // Remove cache and destroy engine
            engine.destroy(function() {
                engine.remove(function() {
                    // Stop HTTP server from accepting connections
                    engine.server.close(function() {
                        console.log('Download STOPPED ('+passed_filename+')');
                        if (callback) callback();
                    });
                });
            });
        };
        global.stop_engine = stop_engine;

        engine.server.on('listening', function() {
            var href = 'http://'+address()+':'+engine.server.address().port+'/';
            var filename = engine.server.index.name.split('/').pop().replace(/\{|\}/g, '');
            var filelength = engine.server.index.length;

            // if (argv.all) {
            //  filename = engine.torrent.name;
            //  filelength = engine.torrent.length;
            //  href += '.m3u';
            // }

            var VLC_ARGS = ''; //'-q --video-on-top --no-video-title-show --play-and-exit';
            if (process.platform === 'win32') {
                VLC_ARGS = [href, '--config', app.defs.VLC_CONFIG_PATH];
                vlc_proc = proc.execFile(app.defs.VLC_PATH, VLC_ARGS);
            } else {
                VLC_ARGS = [href, '--config', app.defs.VLC_CONFIG_PATH];
                vlc_proc = proc.execFile(app.defs.VLC_PATH, VLC_ARGS);
                // VLC_ARGS = '--config='+app.defs.VLC_CONFIG_PATH+' '+'--video-title='+filename;
                // var vlc_cmd = app.defs.VLC_PATH+' '+href+' '+VLC_ARGS;
                // vlc_proc = proc.exec(vlc_cmd, function(error, stdout, stderror){
                //     if (error) {
                //         console.log('ERROR launching VLC ('+vlc_cmd+'): '+error);
                //         // process.exit(0);
                //     }
                // });

                vlc_proc.on('exit', stop_engine);
                //     function(){
                //     // if (!argv.n && argv.quit !== false) process.exit(0);
                //     console.log('VLC has quit !');
                //     stop_engine();
                // });
            }

            console.log('Server is listening on '+href);
            console.log('Streaming: '+filename+' ('+bytes(filelength)+')');

            // var draw = function() {
            //     var unchoked = engine.swarm.wires.filter(active);
            //     var runtime = Math.floor((Date.now() - started) / 1000);

            //     var info =
            //         'Downloading: '+bytes(filelength)+', '+bytes(swarm.downloadSpeed())+'/s '+
            //             'from '+unchoked.length +'/'+wires.length+' peers'+
            //         '\n'+
            //         '\tcache path: ' + engine.path+
            //         '\n'+
            //         '\tdownloaded '+bytes(swarm.downloaded)+' and uploaded '+bytes(swarm.uploaded)+
            //             ', in '+runtime+'s with '+hotswaps+' hotswaps'+
            //         '\n'+
            //         '\tverified '+verified+' pieces and received '+invalid+' invalid pieces'+
            //         '\n'+
            //         '\tpeer queue size: '+swarm.queued;
            //     // console.log(info);
            //     // global.update_status_info({
            //     //     'name':         name,
            //     //     'bytes':        bytes(swarm.downloaded),
            //     //     'total_bytes':  bytes(filelength),
            //     //     'speed':        bytes(swarm.downloadSpeed())+'/s',
            //     //     'time':         runtime+'s',
            //     //     'peers':        unchoked.length+'/'+wires.length+'peers',
            //     //     'queued':       swarm.queued,
            //     // });

            //     // var linesremaining = 25; //clivas.height;
            //     // var peerslisted = 0;
            //     // linesremaining -= 8;

            //     // wires.every(function(wire) {
            //     //  var tags = [];
            //     //  if (wire.peerChoking) tags.push('choked');
            //     //  console.log('{25+magenta:'+wire.peerAddress+'} {10:'+bytes(wire.downloaded)+'} {10+cyan:'+bytes(wire.downloadSpeed())+'/s} {15+grey:'+tags.join(', ')+'}   ');
            //     //  peerslisted++;
            //     //  return linesremaining-peerslisted > 4;
            //     // });
            //     // linesremaining -= peerslisted;

            //     // if (wires.length > peerslisted) {
            //     //  // console.log('{80:}');
            //     //  console.log('... and '+(wires.length-peerslisted)+' more     ');
            //     // }

            //     // console.log('{80:}');
            //     // clivas.flush();
            // };

            // // draw_interval_id = setInterval(draw, 500);
            // draw();
        });

        engine.server.on('vlc_disconnected', function() {
            console.log('VLC disconnected. waiting for reconnection...');
            // app.setTrayInfo({ status: 'IDLE' });
            // console.log(vlc_proc);
            // vlc_proc.kill();
            // stop_engine();
        });

        engine.server.once('error', function() {
            app.setTrayInfo({ status: 'ERROR', message: 'please restart Playtor !' });
            engine.server.listen(0);
            stop_engine();
        });

        var onmagnet = function() {
            console.log('fetching torrent metadata from '+engine.swarm.wires.length+' peers');
        };

        if (typeof torrent === 'string' && torrent.indexOf('magnet:') === 0) {
            onmagnet();
            engine.swarm.on('wire', onmagnet);
        }

        engine.on('ready', function() {
            engine.swarm.removeListener('wire', onmagnet);
            // if (!argv.all) return;
            // engine.files.forEach(function(file) {
            //  file.select();
            // });
        });

        if (true) {//argv.remove) {
            var remove = function() {
                engine.remove(function() {
                    process.exit();
                });
            };

            process.on('SIGINT', remove);
            process.on('SIGTERM', remove);
        }

        ontorrent_done(null, engine);
    };

    if (/^\?xt=urn:/.test(magnet_link)) magnet_link = 'magnet:' + magnet_link;
    if (/^magnet:/.test(magnet_link)) {
        ontorrent(magnet_link, callback);
    } else {
        var filename = magnet_link;
        readTorrent(filename, function(err, torrent) {
            if (err) {
                console.error(err.message);
                // process.exit(1);
            }

            console.log(torrent);
            // app.setTrayInfo(torrent);
            ontorrent(torrent, callback);
        });
    }
};
