module.exports = function() {
    return {
        svn_update: {
            options: {
                questions: [
                    {
                        config: 'deploy.task_svn.update',
                        type: 'confirm',
                        message: "Do you want to continue?"
                    }
                ]
            }
        },
        db_import: {
            options: {
                questions: [
                    {
                        config: 'deploy.task_import.confirm',
                        type: 'confirm',
                        message: "Do you want to continue?"
                    }
                ]
            }
        },
        rsync: {
            options: {
                questions: [
                    {
                        config: 'deploy.task_files.rsync',
                        type: 'confirm',
                        message: 'Do you want to continue?'
                    }
                ]
            }
        }
    }
}