module.exports = function (grunt) {
	// var fs = require('fs');

	console.log(__dirname);

	// App name
	var app_name = 'Playtor';

	// Default build/release directories
	var BUILD_DIR = './build/';
	var RELEASES_DIR = BUILD_DIR+'releases/';

	var RELEASE_WIN_DIR = RELEASES_DIR+app_name+'/win/';
	var RELEASE_MAC_DIR = RELEASES_DIR+app_name+'/mac/';

	// VLC directories
	var VLC_DIST_DIR = BUILD_DIR+'cache/vlc-dist/';
	var VLC_WIN_DIR = BUILD_DIR+'cache/vlc-win/';
	var VLC_MAC_DIR = BUILD_DIR+'cache/vlc-mac/';
	var VLC_TMP_DMG_MOUNTPOINT = '/tmp/vlc-dmg-mnt/';
	var VLC_RELEASE_WIN_DIR = RELEASE_WIN_DIR+app_name+'/';
	var VLC_RELEASE_MAC_DIR = RELEASE_MAC_DIR+app_name+'.app/Contents/Resources/';

	// VLC version and files to download
	var vlc_ver = '2.1.3';
	var vlc_file = {
		win: 'vlc-'+vlc_ver+'-win32.zip',
		mac: 'vlc-'+vlc_ver+'.dmg',
	};

	// Load necessary grunt modules
	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		curl: {
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
		},
		shell: {
			'macos-undmg': {
				command: [
					'hdiutil attach '+VLC_DIST_DIR+vlc_file.mac+' -mountpoint '+VLC_TMP_DMG_MOUNTPOINT,
					'mkdir -p '+VLC_MAC_DIR,
					'rsync -rv '+VLC_TMP_DMG_MOUNTPOINT+'/VLC.app '+VLC_MAC_DIR,
					'hdiutil detach '+VLC_TMP_DMG_MOUNTPOINT
				].join('&&')
			},
			//
			// Modifies VLC for our needs and copies it into release dir
			//
			'prepare-vlc-win': {
				command: 'true',
			},
			// 'copy-vlc-win': {
			// 	command: [
			// 		'rsync -rv '+VLC_WIN_DIR+'/vlc-'+vlc_ver+'/* '+VLC_RELEASE_WIN_DIR+'/vlc',
			// 	].join('&&')
			// },
			'prepare-vlc-mac': {
				command: 'true',
			},
			// 'copy-vlc-mac': {
			// 	command: [
			// 		'rsync -rv '+VLC_MAC_DIR+'/VLC.app '+VLC_RELEASE_MAC_DIR,
			// 	].join('&&')
			// },
		},
		clean: {
			'win': {
				src: RELEASE_WIN_DIR,
			},
			'mac': {
				src: RELEASE_MAC_DIR,
			},
			'vlc-win': {
				src: VLC_RELEASE_WIN_DIR+'/vlc',
			},
			'vlc-mac': {
				src: VLC_RELEASE_MAC_DIR+'/VLC.app',
			}
		},
		copy: {
			'vlc-win': {
				expand: true,
				cwd: VLC_WIN_DIR+'/vlc-'+vlc_ver+'/',
				src: ['**'],
				dest: VLC_RELEASE_WIN_DIR+'/vlc/',
			},
			'vlc-mac': {
				expand: true,
				cwd: VLC_MAC_DIR+'/VLC.app/',
				src: ['**'],
				dest: VLC_RELEASE_MAC_DIR+'/VLC.app/',
			}
		},
		zip: {
			'win': {
				cwd: RELEASE_WIN_DIR,
				src: RELEASE_WIN_DIR+app_name+'/**',
				dest: RELEASES_DIR+app_name+'.win.zip',
			},
			'mac': {
				cwd: RELEASE_MAC_DIR,
				src: RELEASE_MAC_DIR+app_name+'.app/**',
				dest: RELEASES_DIR+app_name+'.mac.zip',
			}
		},
		nodewebkit: {
			build: {
				options: {
					app_name: 'Playtor',
					build_dir: BUILD_DIR, // Where the build version of my node-webkit app is saved
					mac: true, // We want to build it for mac
					win: true, // We want to build it for win
					linux32: false, // We don't need linux32
					linux64: false // We don't need linux64
				},
				src: ['./*', './node_modules/**', '!./node_modules/bower/**', '!./node_modules/grunt*/**', './package.json', './LICENSE.txt']
			}
		},
	});

	//
	// Downloads and unpacks specified VLC version for Win and Mac
	//
	grunt.registerTask('get-vlc', function () {
		// Download and unzip win32 vlc
		if (grunt.file.exists(VLC_DIST_DIR+vlc_file.win)) {
			grunt.log.ok('VLC: Windows 32bit distro already downloaded: '+VLC_DIST_DIR+vlc_file.win);
		} else {
			grunt.task.run('curl:vlc-win');
		}
		if (grunt.file.exists(VLC_WIN_DIR)) {
			grunt.log.ok('VLC: Windows 32bit distro already unpacked: '+VLC_WIN_DIR);
		} else {
			grunt.task.run('unzip:vlc-win');
		}

		// Download and unpack mac osx vlc
		if (grunt.file.exists(VLC_DIST_DIR+vlc_file.mac)) {
			grunt.log.ok('VLC: Mac OSX distro already downloaded: '+VLC_DIST_DIR+vlc_file.mac);
		} else {
			grunt.task.run('curl:vlc-mac');
		}
		if (grunt.file.exists(VLC_MAC_DIR)) {
			grunt.log.ok('VLC: Mac OSX distro already unpacked: '+VLC_MAC_DIR);
		} else {
			grunt.task.run('shell:macos-undmg');
		}
	});

	//
	// Prepare peerflix
	//
	grunt.registerTask('prepare-peerflix', function () {
		var proc = require('child_process'),
			callback = this.async();

		proc.exec('npm i', {cwd: __dirname + '/peerflix'}, function (err) {
			if (err) console.log(err);
			callback();
		});
	});

	//
	// Builds node-webkit app
	//
	grunt.registerTask('default', [
		'prepare-peerflix',
		'get-vlc',
		'nodewebkit:build',
		'shell:prepare-vlc-win',
		'clean:vlc-win',
		'copy:vlc-win',
		'shell:prepare-vlc-mac',
		'clean:vlc-mac',
		'copy:vlc-mac',
	]);
};
