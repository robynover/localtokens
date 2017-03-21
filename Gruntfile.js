module.exports = function(grunt) {
 
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint:{
    	files:['Gruntfile.js','*.js','routes/*.js','models/*js','controllers/*.js'],
    	options: {
    		esversion: 6,
    		node: true
    	}
    }
  });
 
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', 'jshint');

};

