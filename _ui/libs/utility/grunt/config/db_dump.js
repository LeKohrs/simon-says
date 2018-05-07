module.exports = function(grunt) {
    return {
        local: {
            options: grunt.config('db_options')
        }
    }
};