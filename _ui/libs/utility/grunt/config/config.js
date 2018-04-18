module.exports = function(grunt) {
    
    /* ---------------------
    * Variables
    * ---------------------- */
    
    // package.json
    var settings = grunt.config('settings');
    
    // settings.php
    var server = grunt.config('server');
    
    // Grunt cli plugin
    var task_name = grunt.cli.tasks;
    
    // Error Message
    var fatal_error = "The --force won't help you here!";

    
    /* ---------------------
    * HIDE TASK NAMES
    * ---------------------- */
    
    grunt.log.header = function () {};
    

    /* --------------------------------------
    * PREVENT RUNNING SOME COMMANDS DIRECTLY
    * --------------------------------------- */
    
    if(task_name == 'svn' || task_name == 'svn:status' || task_name == 'svn:update') {
        grunt.fail.warn("Running 'grunt svn' by itself is not allowed. Use 'grunt deploy' instead.");
        grunt.fail.fatal(fatal_error);
    }
    if(task_name == 'db' || task_name == 'deploy:db') {
        grunt.fail.warn("Running 'grunt db' or 'grunt deploy:db' without a method is not allowed.");
        grunt.fail.fatal(fatal_error);
    }
    if(task_name == 'db_dump' || task_name == 'db_import') {
        grunt.fail.warn("db_dump and db_import are deprecated. Instead, use deploy:export or deploy:import.");
        grunt.fail.fatal(fatal_error);
    }
    

    /* ---------------------------
    * DATABASE EXPORT AND IMPORT
    * ---------------------------- */
    
    if(task_name == 'deploy:export' || task_name == 'deploy:import') {
        var options = {};
        var method = (task_name == 'deploy:export') ? 'export' : 'import'
        
        // Set some default options from command line flags
        options.target = grunt.option('target');
        options.source = grunt.option('source');
        options.tag = grunt.option('tag');
        
        // Print subhead before we log messages or errors
        grunt.log.subhead("Preparing to " + method + " database...");
        
        // Default value if the target isn't set explicity
        if(!options.target) {
            options.target = server.env;
            grunt.log.writeln("--target not passed, so we assume it's the local server.");
        }
        if(options.target == 'prod') {
            // Database host
            options.host = settings.env.targets.production.db_host
            
            // Database name
            options.database = settings.env.targets.production.db_name;
            
            // Database Username
            options.user = settings.env.targets.production.db_username;
            
            // Database Password
            options.pass = settings.env.targets.production.db_password;
        }
        else if(options.target == 'dev' || options.target == 'stage') {
            // Database host
            options.host = settings.env.targets.development.db_host;
            
            // Database Name
            options.database = settings.env.targets.development.db_name;
            
            // Database Username
            options.user = settings.env.targets.development.db_username;
            
            // Database Password
            options.pass = settings.env.targets.development.db_password;
        }
        else {
            // Default Host 
            options.host = 'localhost';
            
            // Error Messages
            grunt.fail.warn("Invalid target. Must be either dev, stage or prod.");
            grunt.fail.fatal(fatal_error);
        }
        
        // Switch environment based on inputs and direction
        if(method == 'import') {
            // Require --source when importing
            if(!options.source) {
                grunt.log.writeln("--source must be set explicity when importing.");
                grunt.fail.fatal("Importing has been disabled by safety protocols.");
            }
            else {
                options.context = options.source;
            }
        }
        else {
            // The tag is always the same as --target when exporting
            options.context = options.target;
        }

        options.internal_server = true;
        
        // Filename tag should be an expected value
        if(options.context == 'dev' || options.context == 'stage' || options.context == 'prod') {
            // Set remote host if target isn't the local server
            if(options.target != server.env) {
                 // ssh_user and ssh_server is set in package.json
                if (options.target == 'prod' && settings.env.targets.production.ssh_user && settings.env.targets.production.ssh_server) {
                    options.ssh_host = settings.env.targets.production.ssh_user +'@'+ settings.env.targets.production.ssh_server;
                    options.internal_server = false;
                }
                else if(options.target == 'prod' && settings.env.targets.production.ssh_server) {
                    grunt.fail.warn("ssh_user required when ssh_server is given.");
                    grunt.fail.fatal(fatal_error);
                }
                else {
                    options.ssh_host = options.target + 'sr.com';
                }
            }
            else {
                grunt.log.writeln("--target is the same as --env, so the remote host was not set.");
            }
        }
        else {
            grunt.fail.warn("Invalid context. Must be either dev, stage, or prod.");
            grunt.fail.fatal(fatal_error);
        }

        // Setting global log messages
        if(options.ssh_host) {
            grunt.log.writeln("Setting the remote host to '" + options.ssh_host + "'.");
        }
        
        if(options.target) {
            grunt.log.writeln("Setting database environment to '" + options.target + "'.");
        }
        
        if(options.source && method == 'import') {
            grunt.log.writeln("Setting import source to '" + options.source + "'.");
        }
            
        // Set the optional file tag
        if(options.tag) {
            options.file_suffix = options.context + '--' + options.tag;
            grunt.log.writeln("Setting filename suffix to '" + options.file_suffix + "'.");
        }
        else {
            options.file_suffix = options.context;
        }

        // Change words based on import/export direction
        if(method == 'import' && grunt.option('target')) {
            var sep = "' to '";
        }
        else if(grunt.option('target')) {
            var sep = "' from '";
        }
        else {
            var sep = "' on '";
        }
        
        // Modify the title in db_dump's default log message
        if(sep) {
            options.title = options.database + sep + options.target;
        }
        
        // Set the origin server for importing
        options.origin_host = server.hostname;
        
        // What is current server we are on?
        options.local_backup_to =  '/usr/local/lib/swansonrussell/grunt_db_dump' + '/' + grunt.template.today('yyyymmdd') + '--' + options.database + '--' + options.file_suffix + '.sql';

        // if remote server
        if(options.ssh_host && options.target == 'prod' && settings.env.targets.production.db_backup_folder) {
            options.remote_backup_to = settings.env.targets.production.db_backup_folder + '/' + grunt.template.today('yyyymmdd') + '--' + options.database + '--' + options.file_suffix + '.sql';
        }
        else if (options.ssh_host && options.source == 'prod' && settings.env.targets.production.db_backup_folder) {
            if (options.target == 'stage' || options.target == 'dev') {
                options.remote_backup_to = options.local_backup_to;
            }
            else {
                options.remote_backup_to = settings.env.targets.production.db_backup_folder + '/' + grunt.template.today('yyyymmdd') + '--' + options.database + '--' + options.file_suffix + '.sql';
            }
        }
        else {
            options.remote_backup_to = options.local_backup_to;
        }
        
        // Final validation checks
        if(!options.database) {
            grunt.fail.warn("Database name not found.");
            grunt.fail.fatal(fatal_error);
        }
        if(!options.user || !options.pass) {
            grunt.fail.warn("Database credentials are invalid or blank.");
            grunt.fail.fatal(fatal_error);
        }
        
        grunt.config('db_options', options);
    }
}