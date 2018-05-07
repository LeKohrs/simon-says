module.exports = function(grunt) {
    var settings = grunt.config('settings');
    var sprites_settings = settings.sprites;

    if(settings.hasOwnProperty('sprites')) {
        Object.keys(sprites_settings).forEach(function(key) {
            sprites_settings[key].cssVarMap = function(sprite) {
                sprite.name = 'sprite-' + sprite.name;
            };
        });

        return sprites_settings;
    }
};