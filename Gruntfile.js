module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint:{
    	files:['Gruntfile.js','*.js','routes/*.js','models/*js'],
    	options: {
    		esversion: 6,
    		node: true
    	}
    },

    sass: {
      options: {
        sourceMap: true
      },
      dist: {
        files: {
          'public/css/admin.css': 'views/sass/admin.scss',
          'public/css/common.css': 'views/sass/common.scss',
          'public/css/home.css': 'views/sass/home.scss'
        }
      }
    },
    watch: {
      css: {
        files: '**/*.scss',
        tasks: ['sass']
      }
    },
    uglify: {
      options: {
        mangle: false
      },
      my_target: {
        files: {
          'public/js/main.min.js': ['public/js/script.js', 'public/js/notification.js'],
          'public/js/admin.min.js': ['public/js/admin.js', 'public/js/notification.js'],
          'public/js/riottags.min.js': 'public/js/tags/*.js' 
        }
      }
    },
    cssmin: {
      target: {
        files: {
          'public/css/main.min.css': 'public/css/common.css',
          'public/css/admin.combo.min.css': ['public/css/common.css','public/css/admin.css'],
          'public/css/home.combo.min.css': ['public/css/common.css','public/css/home.css']
        }
      }
    }
    

  });
 
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('default', ['jshint', 'sass']);
  grunt.registerTask('build', ['sass', 'cssmin', 'uglify']);
  grunt.registerTask('css',['sass', 'cssmin']);
  grunt.registerTask('test', ['jshint']);

};