module.exports = function(grunt) {
    var options = {};
    var shell = require('shelljs');
    var settings = grunt.config('settings');
    var server = grunt.config('server');
    var fatal_error = "The --force won't help you here!";
    var allowed_environments = {
        'dev': 'devsr.com',
        'stage': 'stagesr.com',
        'prod': 'prodsr.com'
    };


    /* ---------------------
    * DRUSH
    * ---------------------- */

    grunt.registerTask('drush', 'Send arbitrary commands to Drush on a remove server.', function(method) {
        // Get options from command line
        options.target = grunt.option('target');
        options.mode = grunt.option('mode');

        // Target should be an expected value
        if(options.target && (options.target in allowed_environments)) {
            if(options.target == server.env) {
                grunt.log.writeln("You don't need to use 'grunt deploy' for local targets.");
                grunt.fail.warn("--target is the same as --env.");
            }

            options.alias = '@' + options.target;
        }
        else {
            grunt.fail.warn("Invalid target. Must be either dev, stage or prod.");
            grunt.fail.fatal(fatal_error);
        }

        // Build the default command strings
        options.cmd = 'drush ' + options.alias;

        // Add arguments based on method
        if(method == 'cache') {
            if(options.mode) {
                options.cmd += ' cc ' + options.mode;
            }
            else {
                options.cmd += ' cc css-js';
            }

            grunt.log.subhead("Clearing Drupal CSS/JS cache on '" + options.target + "'");
        }
        else if(method == 'drush') {
            var args = grunt.option('args');

            if(args) {
                options.cmd += ' ' + args;

            }
            else {
                grunt.fail.warn("--args must be passed when using 'deploy:drush'.");
            }

            grunt.log.subhead("Running custom command: '" + options.cmd + "'");
            grunt.log.writeln("Note: Custom commands cannot be pre-validated or sanitized. Proceed with caution!"['magenta']);
        }
        else {
            grunt.fail.fatal("There are no arguments or methods for Drush to execute.");
        }
        // Execute command
        shell.exec(options.cmd);
    });


     /* ------------------------------------------------------------------------------------------------------------------------------------------------------
     * SUBVERSION (SVN)
     *
     * grunt deploy:svn --target=[dev|stage|prod] --externals=[boolean] --status=[boolean] --targetpath=[filename] --updatepath=[filename] --hostuser=[user]
     * ------------------------------------------------------------------------------------------------------------------------------------------------------ */

    grunt.registerTask('svn', 'Check status of remote SVN checkouts', function(method) {
        // Get options from command line
        options.target = grunt.option('target');
        options.targetpath = grunt.option('targetpath');
        options.externals = grunt.option('externals');
        options.status = grunt.option('status');
        options.updatepath = grunt.option('updatepath');
        options.hostuser = grunt.option('hostuser');
        // Target should be an expected value
        if (options.target && (options.target in allowed_environments)) {
            if (settings.env.targets && settings.env.targets.production) {
                // Both ssh_user and ssh_server is set in package.json
                if (options.target == 'prod' && settings.env.targets.production.ssh_user && settings.env.targets.production.ssh_server) {
                    options.host = settings.env.targets.production.ssh_user +'@'+ settings.env.targets.production.ssh_server;
                }

                // Only ssh_server is set in package.json
                else if (options.target =='prod' && settings.env.targets.production.ssh_server) {
                    options.host = settings.env.targets.production.ssh_server;
                }

                else {
                    options.host = allowed_environments[options.target];
                }
            }

            else {
                options.host = allowed_environments[options.target];
            }

            // If current enviorment
            if(options.target == server.env) {
                grunt.fail.warn("Invalid target. Cannot be the same as the local environment.");
            }

        }
        else {
            grunt.fail.warn("Invalid target. Must be either dev, stage or prod.");
            grunt.log.writeln("--target was passed directly and cannot be validated. Proceed with caution!"['magenta']);

            // Set host anyway in case the above warnings are ignored
            options.host = options.target;
        }

        // Host User
        if(options.hostuser) {
            options.host = options.hostuser + '@' + options.host;
        }

        // Default to enabling status check if not passed (note: direct comparison is needed since the stored values are booleans)
        if(options.status == undefined || options.status == 'true') {
            options.status = true;
        }
        else if(options.status == false || options.status == 'false') {
            options.status = false;
        }
        else {
            grunt.fail.warn("--status was passed an invalid value.");
        }

        // Override file path on remote server
        if(settings.env.targets && settings.env.targets.production && options.target =='prod' && settings.env.targets.production.www_root) {
            options.filepath = settings.env.targets.production.www_root
        }
        else if(options.targetpath) {
            options.filepath = options.targetpath;
        }
        else {
            options.filepath = process.cwd();
        }

        // Add relative update path as secondary argument
        if(options.updatepath) {
            options.filepath += '/' + options.updatepath;
            options.filepath = options.filepath.replace('//', '/');
        }

        // Build the default command strings
        options.cmd_status = 'svn status -u';
        options.cmd_update = 'svn update';

        // Default to skipping externals to save time
        if(!options.exterals && options.externals != true) {
            if(method == 'status') {
                grunt.log.writeln("Note: Ignoring 'svn:externals' by default. Pass --externals=true to update everything.");
            }

            // Add arguments to the default commands
            options.cmd_status += ' --ignore-externals';
            options.cmd_update += ' --ignore-externals';
        }

        // Finish building the remote file path
        options.cmd_status += ' ' + options.filepath + ' | grep -v "X"';
        options.cmd_update += ' ' + options.filepath;

        // Save options for use elsewhere
        grunt.config('deploy_options', options);


        /**
         * Task Methods
         */

        if(method == 'status') {
            // Check to see if status should run first
            if(grunt.config('deploy_options.status')) {
                // Tell people what's up
                grunt.log.subhead("Running 'svn status' at '" + options.filepath + "' on '" + options.host + "'");

                // Execute the command
                var tmp_cmd = "ssh " + options.host + " '" + options.cmd_status + "'";
                shell.exec(tmp_cmd);
            }
            else {
                grunt.log.subhead("Skipping 'svn status' check before running 'svn update'."['blue']);
            }
        }
        else if(method == 'update') {
            if(grunt.config('deploy.task_svn.update')) {
                // Tell people what's up
                grunt.log.subhead("Running 'svn update' at '" + options.filepath + "' on '" + options.host + "'");

                // Execute the command
                var tmp_cmd = "ssh " + options.host + " '" + options.cmd_update + "'";
                shell.exec(tmp_cmd);
            }
        }
    });


    /* -------------------------------------------------------------------------------
     * DATABASE
     *
     * grunt deploy:import --target=[dev|stage|prod] --source=[dev|stage|prod] --tag
     * grunt deploy:export --target=[dev|stage|prod] --tag
     * ------------------------------------------------------------------------------- */

    grunt.registerTask('db', 'Import and export database snapshots to migrate between servers', function(method) {
        /**
         * Task Methods
         */
        if(method == 'export') {
            grunt.task.run('db_dump');
        }
        else if(method == 'import' && grunt.config('deploy.task_import.confirm')) {
            grunt.task.run('db_import');
        }
    });


    /* ------------------------------------------------------------------------------------------------------------------------------------------------------
     * FILES
     *
     * grunt deploy:files --target=[dev|stage|prod] --source=[dev|stage|prod] --targetpath(rel) --sourcepath(abs) --hostuser --originuser
     * ------------------------------------------------------------------------------------------------------------------------------------------------------ */

    grunt.registerTask('deploy_files', 'Wrapper around basic rsync commands', function(method) {
        options.target = grunt.option('target');
        options.targetpath = grunt.option('targetpath');
        options.source = grunt.option('source');
        options.sourcepath = grunt.option('sourcepath');
        options.origin = 'localhost';
        options.host = 'localhost';
        options.hostuser = grunt.option('hostuser');
        options.originuser = grunt.option('originuser');

        // First run
        if(method == 'prep') {
            // Target should be an expected value
            if(options.target && (options.target in allowed_environments)) {
                if(options.target != server.env) {

                    // Both target_user and ssh_server is set in package.json
                    if (options.target == 'prod' && settings.env.targets.production.ssh_user && settings.env.targets.production.ssh_server) {
                        options.host = settings.env.targets.production.ssh_user +'@'+ settings.env.targets.production.ssh_server;
                    }

                    // Only ssh_server is set in package.json
                    else if (options.target =='prod' && settings.env.targets.production.ssh_server) {
                        options.host = settings.env.targets.production.ssh_server;
                    }

                    else {
                        options.host = allowed_environments[options.target];
                    }
                }
                else {
                    options.host = 'localhost';
                }
            }
            else {
                // Require --force if using an unexpected target
                grunt.fail.warn("Invalid target. Must be either dev, stage or prod.");
                grunt.log.writeln("--target was passed directly and cannot be validated. Proceed with caution!"['magenta']);
                options.host = options.target;
            }

            // Host User
            if(options.hostuser) {
                options.host = options.hostuser + '@' + options.host;
            }

            // Origin server should also be an expected value
            if(options.source && (options.source in allowed_environments)) {
                if(options.source != server.env) {

                    // Both target_user and ssh_server is set in package.json
                    if (options.source == 'prod' && settings.env.targets.production.ssh_user && settings.env.targets.production.ssh_server) {
                        options.origin = settings.env.targets.production.ssh_user +'@'+ settings.env.targets.production.ssh_server;
                    }

                    // Only ssh_server is set in package.json
                    if (options.source =='prod' && settings.env.targets.production.ssh_server) {
                       options.origin = settings.env.targets.production.ssh_server;
                    }

                    else {
                        options.origin = allowed_environments[options.source];
                    }
                }
                else {
                    options.origin = 'localhost';
                }
            }
            else if (options.source) {
                grunt.log.writeln("--source was passed directly and cannot be validated. Proceed with caution!"['magenta']);
            }

            // Origin User
            if(options.originuser) {
                options.origin = options.originuser + '@' + options.host;
            }

            // Validate absolute path inputs
            if((options.sourcepath && options.sourcepath.indexOf('..') != -1) || (options.targetpath && options.targetpath.indexOf('..') != -1)) {
                grunt.fail.warn("Input paths must be absolute file paths and cannot begin with the relative '../' prefix.");
                grunt.fail.fatal(fatal_error);
            }

            // If this is a Drupal project we can skip some things
            if(settings.env.platform == 'drupal') {
                // Message
                grunt.log.subhead("Local project self-identifies as Drupal. Setting a few things automatically...");

                // We know where the files are (unless path is passed directly in the command)
                if(!options.sourcepath) {
                    options.sourcepath = 'sites/default/files/';
                    grunt.log.writeln("Setting source path to '" + options.sourcepath + "'.");
                }

                // Exclude known temporary or otherwise non-critical folders
                options.excludes = '--exclude==\'.svn\' --exclude=js/ --exclude=css/ --exclude=xmlsitemap/ --exclude=styles/ --exclude=ctools/';
                grunt.log.writeln("Excluding known temporary files and folders.");
            }
            else {
                // Otherwise the local and remote paths are required
                if(!options.sourcepath) {
                    grunt.fail.warn("--sourcepath is always required for non-Drupal projects.");
                }

                // Set values
                options.excludes = '--exclude==".svn"';
            }

            // Everything is set and ready to go, so now we finalize the options
            grunt.log.subhead("Reticulating splines...");

            // Set target path based on source path
            if(!options.targetpath) {

                // Use www_root in package.js when available
                if (options.target == 'prod' && settings.env.targets.production.www_root) {
                    options.targetpath = settings.env.targets.production.www_root + '/' + options.sourcepath;
                }
                // Use the command line value when available
                else if (grunt.option('sourcepath')) {
                    options.targetpath = options.sourcepath;
                }

                // Otherwise we can figure out the path based on local context
                else {
                    options.targetpath = process.cwd() + '/' + options.sourcepath;
                }

                grunt.log.writeln("--targetpath not passed, so we'll predict the value based on the source path.");
            }

            // Add origin host to path strings
            if(options.origin && options.origin != 'localhost') {
                if (options.source == 'prod' && settings.env.targets.production.www_root) {
                    options.sourcepath = options.origin + ':' + settings.env.targets.production.www_root + '/' + options.sourcepath;
                }
                else {
                    options.sourcepath = options.origin + ':' + process.cwd() + '/' + options.sourcepath;
                }

                grunt.log.writeln("Setting source environment to '" + options.origin + "'.");
            }

            // Add destination host to path strings
            if(options.host && options.host != 'localhost') {
                options.targetpath = options.host + ':' + options.targetpath;
                grunt.log.writeln("Setting target environment to '" + options.host + "'.");
            }

            // Add messages for any remaining auto-detected values
            grunt.log.writeln("Setting source path to '" + options.sourcepath + "'.");
            grunt.log.writeln("Setting target path to '" + options.targetpath + "'.\n");

            // Finish building the command string
            options.cmd = 'rsync -aOv ' + options.excludes + ' ' + options.sourcepath + ' ' + options.targetpath;

            // Convert options to string and save globally to prevent parse errors
            grunt.config('deploy_options', JSON.stringify(options, null, 2));

            // Prompt before running command
            if(grunt.config('deploy.task_files.rsync')) {
                grunt.task.run('deploy_files:run');
            }
            else {
                if(grunt.config('deploy.task_files.test') != 'true') {
                    grunt.task.run(['prompt:rsync', 'deploy_files:run']);
                }
            }

            // Track confirmation
            grunt.config('deploy.task_files.test', 'true');
        }

        // Callback after confirmation prompt
        if(method == 'run') {
            // De-stringify global options object
            deploy_options = JSON.parse(grunt.config('deploy_options'));

            // Make sure confirmation was granted
            if(grunt.config('deploy.task_files.rsync')) {
                // Tell people what's up
                grunt.log.subhead("Running rsync from '" + deploy_options.sourcepath + "' on '" + deploy_options.origin + "' to '" + deploy_options.host + "'");

                // Execute the command
                shell.exec(deploy_options.cmd);
            }
        }
    });


    /* ---------------------
     * MAIN TASK
     * ---------------------- */

    grunt.registerTask('deploy', 'Update remote Subversion checkouts over SSH.', function(method) {
        if(!method) {
            grunt.log.subhead("\n" + "Choose from the following deployment tasks:"['blue']);
            grunt.log.writeln("   grunt deploy:svn");
            grunt.log.writeln("   grunt deploy:export");
            grunt.log.writeln("   grunt deploy:import");
            grunt.log.writeln("   grunt deploy:files      (new!)");
            grunt.log.writeln("   grunt deploy:cache");
            grunt.log.writeln("   grunt deploy:drush      (experimental)");
            grunt.log.writeln("\n" + "For detailed instructions and examples, check out this wiki article:\n   http://wiki.swansonrussell.com/w/dev/gruntjs");
        }
        if(method == 'svn') {
            grunt.task.run(['svn:status', 'prompt:svn_update', 'svn:update']);
        }
        else if(method == 'export') {
            grunt.task.run('db:export');
        }
        else if(method == 'import') {
            grunt.task.run(['prompt:db_import', 'db:import']);
        }
        else if(method == 'files') {
            grunt.task.run('deploy_files:prep');
        }
        else if(method == 'cache' || method == 'drush') {
            grunt.task.run('drush:' + method);
        }
    });
}
