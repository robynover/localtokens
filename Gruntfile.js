module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

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
        js_dest: 'public/js/lib/',
        css_dest: 'public/css/lib/',
        options: {
          keepExpandedHierarchy: false,
          ignorePackages: ['font-awesome']
        },
        
        packageSpecific: {
          'jquery': {
             files: ["dist/jquery.min.js"],
             keepExpandedHierarchy: false
           },
           'font-awesome':{
              files: ["css/font-awesome.min.css"]
           },
           skeleton: {
            keepExpandedHierarchy: false,
            dest: 'public/',
            css_dest: 'public/css/lib'
          }
        }
      }
    },

    sass: {
      options: {
        sourceMap: true
      },
      dist: {
        files: {
          'public/css/admin.css': 'sass/admin.scss',
          'public/css/common.css': 'sass/common.scss',
          'public/css/home.css': 'sass/home.scss',
          'public/css/style.css': 'sass/style.scss'
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
      dist:{
        files: {
          //'public/js/script.min.js':'public/js/script.js'
        }
      }
    }

  });
 
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-bower');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['jshint','bower','sass']);
  grunt.registerTask('setup', ['bower','sass','uglify']);
  grunt.registerTask('test', ['jshint']);

};

