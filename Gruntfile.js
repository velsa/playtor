module.exports = function (grunt) {
	// var fs = require('fs');

	console.log(__dirname);

	// Default build directories
	var BUILD_DIR = './build/';
	var VLC_DIST_DIR = BUILD_DIR+'cache/vlc-dist/';
	var VLC_WIN_DIR = BUILD_DIR+'cache/vlc-win/';
	var VLC_MAC_DIR = BUILD_DIR+'cache/vlc-mac/';

	// VLC version and files to download
	var vlc_ver = '2.1.3';
	var vlc_file = {
		win: 'vlc-'+vlc_ver+'-win32.zip',
		mac: 'vlc-'+vlc_ver+'.dmg',
	};

	// Load necessary grunt modules
	grunt.loadNpmTasks('grunt-curl');
	grunt.loadNpmTasks('grunt-zip');
	grunt.loadNpmTasks('grunt-node-webkit-builder');

	grunt.initConfig({
		'curl': {
			'vlc-win': {
				src: 'http://download.videolan.org/pub/videolan/vlc/'+vlc_ver+'/win32/'+vlc_file.win,
				dest: VLC_DIST_DIR+vlc_file.win
			},
			'vlc-mac': {
				src: 'http://download.videolan.org/pub/videolan/vlc/'+vlc_ver+'/macosx/'+vlc_file.mac,
				dest: VLC_DIST_DIR+vlc_file.mac
			}
		},
		unzip: {
			'vlc-win': {
				src: VLC_DIST_DIR+vlc_file.win,
				dest: VLC_WIN_DIR,
			},
			// 'vlc-mac': {
				// src: VLC_MAC_DIR,
				// dest: VLC_DIST_DIR+vlc_file.mac,
			// }
		},
		nodewebkit: {
			options: {
				build_dir: BUILD_DIR, // Where the build version of my node-webkit app is saved
				mac: true, // We want to build it for mac
				win: true, // We want to build it for win
				linux32: false, // We don't need linux32
				linux64: false // We don't need linux64
			},
			src: [__dirname + '/**/*'] // Your node-webkit app
			//dest: [__dirname + '/buld']
		},
	});

	grunt.registerTask('getvlc', function () {
		// Download and unzip win32 vlc
		if (grunt.file.exists(VLC_DIST_DIR+vlc_file.win)) {
			grunt.log.warn('VLC: Windows 32bit distro already downloaded: '+VLC_DIST_DIR+vlc_file.win);
		} else {
			grunt.task.run('curl:vlc-win');
		}
		if (grunt.file.exists(VLC_WIN_DIR)) {
			grunt.log.warn('VLC: Windows 32bit distro already unpacked: '+VLC_WIN_DIR);
		} else {
			grunt.task.run('unzip:vlc-win');
		}

		// Download mac osx vlc
		if (grunt.file.exists(VLC_DIST_DIR+vlc_file.mac)) {
			grunt.log.warn('VLC: Mac OSX distro already downloaded: '+VLC_DIST_DIR+vlc_file.mac);
		} else {
			grunt.task.run('curl:vlc-mac');
		}
		if (grunt.file.exists(VLC_MAC_DIR)) {
			grunt.log.warn('VLC: Mac OSX distro already unpacked: '+VLC_MAC_DIR);
		} else {
			// grunt.task.run('unzip:vlc-mac');
		}
	});

	grunt.registerTask('default', [
		'nodewebkit'
	]);
};
