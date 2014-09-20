'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    nodewebkit: {
      options: {
          platforms: ['osx'],
          buildDir: './webkitbuilds', // Where the build version of my node-webkit app is saved
      },
      src: ['./www/**/*'] // Your node-webkit app
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-node-webkit-builder');

  // Default task.
  grunt.registerTask('default', ['nodewebkit']);
};