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
    },
    bower: {
      dev: {
        dest: 'public/',
        js_dest: 'public/lib/js',
        css_dest: 'public/css',
        //options: {
        //  ignorePackages: ['jquery']
        //},
        //packageSpecific: {
        // 'jquery': {
        //    files: ["dist/jquery.min.js"]
        //  }
        //}
      }
    }
  });
 
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-bower');

  grunt.registerTask('default', ['jshint','bower']);

};

