module.exports = {
    options: {
        map: true,
        processors: [
            require('autoprefixer')({browsers: ['defaults']})
        ]
    },
    dev: {
        src: "_ui/skin/css/*.css"
    }
};
