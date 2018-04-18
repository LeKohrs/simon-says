/*
 * grunt-mysql-dump-import
 * https://github.com/digitalcuisine/grunt-mysql-dump
 *
 * Forked of:
 * https://github.com/digitalcuisine/grunt-mysql-dump
 *
 * Copyright (c) 2014 Travis McKinney
 * Licensed under the MIT license.
 */

'use strict';

var shell = require('shelljs'),
    path  = require('path');


/**
 * Lo-Dash Template Helpers
 * http://lodash.com/docs/#template
 * https://github.com/gruntjs/grunt/wiki/grunt.template
 Tru$!m1964

 */
var commandTemplates = {
    mysqldump: "mysqldump -h <%= host %> -P <%= port %> -u<%= user %> <%= pass %> <%= database %> 2>&1",
    mysqldump_internal: "mysqldump -u exporter <%= database %>",
    mysqlimport: "mysql -h <%= host %> -P <%= port %> -u<%= user %> <%= pass %> <%= database %> < <%= remote_dumpfile %>",
    scp: 'scp <%= remote_dumpfile %> <%= target %>:<%= local_dumpfile %>',
    ssh: "ssh <%= host %>"
};


module.exports = function(grunt) {
    /**
     * DB DUMP
     */
    grunt.registerMultiTask('db_dump', 'Dump database', function() {
        // Get tasks options + set default port
        var options = this.options({
            pass: "",
            port: 3306,
            remote_backup_to: "db/backups/<%= grunt.template.today('yyyy-mm-dd') %> - <%= target %>.sql"
        });
        var paths = generate_backup_paths(this.target, options);

        grunt.log.subhead("Dumping database '" + options.title + "' to '" + paths.file + "'");

        if(db_dump(options, paths)) {
            grunt.log.success("Database dump succesfully exported");
        }
        else {
            grunt.log.fail("Database dump failed!");
            return false;
        }
    });

    /**
     * DB IMPORT
     */
    grunt.registerMultiTask('db_import', 'Import database', function() {
        // Get tasks options + set default port
        var options = this.options({
            pass: "",
            port: 3306,
            backup_to: "db/backups/<%= grunt.template.today('yyyy-mm-dd') %> - <%= target %>.sql"
        });
        var paths = generate_backup_paths(this.target, options);

        grunt.log.subhead("Importing database '" + options.title + "' from '" + paths.file + "'");

        if(db_import(options, paths)) {
          grunt.log.success("Database dump succesfully imported");
        }
        else {
          grunt.log.fail("Database import failed!");
          return false;
        }
    });

    /**
     * Process backup file paths
     */
    function generate_backup_paths(target, options) {
        var paths = {};
        paths.file = grunt.template.process(options.remote_backup_to, {
            data: {
                target: target
            }
        });
        paths.dir = path.dirname(paths.file);
        return paths;
    }

    /**
     * Dumps a MYSQL database to a suitable backup location
     */
    function db_dump(options, paths) {
        var cmd;

        // 2) Compile MYSQL cmd via Lo-Dash template string
        //
        // "Process" the password flag directly in the data hash to avoid a "-p" that would trigger a password prompt
        // in the shell
        var db_password = options.pass.replace('$','\\$').replace('`','\\`').replace('#','\\#').replace('!','\\!').replace("'","\\'");

        var tpl_mysqldump;

        // Internal
        if(options.internal_server) {
            tpl_mysqldump = grunt.template.process(commandTemplates.mysqldump_internal, {
                data: {
                    database: options.database
                }
            });
        }
        // External
        else {
            tpl_mysqldump = grunt.template.process(commandTemplates.mysqldump, {
                data: {
                    user: options.user,
                    pass: options.pass != "" ? "-p" + db_password : "",
                    database: options.database,
                    host: options.host,
                    port: options.port,
                    dumpfile: options.remote_backup_to
                }
            });
        }

        // 3) Test whether we should connect via SSH first
        if (typeof options.ssh_host === "undefined") {
            // It's a local/direct connection
            cmd = tpl_mysqldump + " > " + options.local_backup_to;
        }
        else {
            // It's a remote connection
            // First, create /tmp/grunt_db_dump directory if it doesn't already exist on local environment
            // Otherwise, scp will fail.
            // Current User
            var current_user = shell.exec('whoami', {silent:true}).output.trim();
            // Next, create command to remotely dump and copy down.
            var tpl_ssh = grunt.template.process(commandTemplates.ssh, {
                data: {
                    host: options.ssh_host
                }
            });
            var tpl_scp = grunt.template.process(commandTemplates.scp, {
                data: {
                    target: current_user + '@' + options.origin_host,
                    local_dumpfile: options.local_backup_to,
                    remote_dumpfile: options.remote_backup_to,
                }
            });

            // Create remote dir
            cmd = tpl_ssh + " \"mkdir "+ paths.dir +"; " + tpl_mysqldump + " > " + options.remote_backup_to + "; " + tpl_scp + "\"";
        }

        // Capture output...
        var ret = shell.exec(cmd, {silent: true});

        if(ret.code != 0) {
            grunt.log.error(ret.output);
            return false;
        }

        return true;
    }

    /**
     * Import a MYSQL dumpfile to a database
     */
    function db_import(options, paths) {
        var cmd;

        // 2) Compile MYSQL cmd via Lo-Dash template string
        //
        // "Process" the password flag directly in the data hash to avoid a "-p" that would trigger a password prompt
        // in the shell

        var db_password = options.pass.replace('$','\\$').replace('`','\\`').replace('#','\\#').replace('!','\\!').replace("'","\\'");

        var tpl_mysqlimport = grunt.template.process(commandTemplates.mysqlimport, {
            data: {
              user: options.user,
              pass: options.pass != "" ? "-p" + db_password : "",
              database: options.database,
              host: options.host,
              port: options.port,
              remote_dumpfile: options.remote_backup_to
            }
        });

        // 3) Test whether we should connect via SSH first
        if (typeof options.ssh_host === "undefined") {
            // it's a local/direct connection
            cmd = tpl_mysqlimport;
        }
        else {
            // it's a remote connection
            var tpl_ssh = grunt.template.process(commandTemplates.ssh, {
                data: {
                    host: options.ssh_host
                }
            });
            var tpl_scp = grunt.template.process(commandTemplates.scp, {
                data: {
                    target: options.ssh_host,
                    local_dumpfile: options.remote_backup_to,
                    remote_dumpfile: options.local_backup_to
                }
            });

            cmd = tpl_scp + "; " + tpl_ssh + " \"" + tpl_mysqlimport + "\"";
        }

        // Capture output...
        var ret = shell.exec(cmd, {silent: true});

        if(ret.code != 0) {
            grunt.log.error(ret.output)
            return false;
        }
        else {
            return true;
        }
    }
};
