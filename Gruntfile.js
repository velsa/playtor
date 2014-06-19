module.exports = function (grunt) {
	console.log(__dirname);

	grunt.initConfig({
		nodewebkit: {
			options: {
				build_dir: './build', // Where the build version of my node-webkit app is saved
				mac: true, // We want to build it for mac
				win: true, // We want to build it for win
				linux32: false, // We don't need linux32
				linux64: false // We don't need linux64
			},
			src: [__dirname + '/**/*'] // Your node-webkit app
			//dest: [__dirname + '/buld'] 
		},
	});
	grunt.loadNpmTasks('grunt-node-webkit-builder');
	grunt.registerTask('default', ['nodewebkit']);
};