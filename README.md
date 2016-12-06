gulp-ssh-deploy
===============
A plugin to gulp that allows for deploying releases via SSH. This is very similar in nature to [grunt-ssh-deploy](https://github.com/dasuchin/grunt-ssh-deploy).

Features
--------

- Addition of gulp tasks to deploy a set of release folders to a remote host.

Usage
------
### Installing gulp-ssh-deploy
```
npm install --save-dev gulp-ssh-deploy
```

### Importing gulp-ssh-deploy
`gulp-ssh-deploy` is an ES6-based module, so you can use it with `import` statements:
```javascript
import { GulpSSHDeploy } from 'gulp-ssh-deploy';
```

Alternatively, you can use the CommonJS module import syntax:
```javascript
var GulpSSHDeploy = require('gulp-ssh-deploy');
```

### Configuration
You must set up a new instance of `GulpSSHDeploy` with a set of options, and your instance of `gulp` (to which tasks will be added). The easiest way to do this is to add the following to your `gulpfile.js` (or `gulpfile.babel.js`, if using babel):
```
var options = {
  "host": "your-server.somewhere.com",
  "port": 22,
  "package_json_file_path": "package.json",
  "source_files": ".",
  "remote_directory": "/path/to/remote/deploy/dir",
  "username": "someuser",
  "ssh_key_file": "/path/to/your/local/ssh/key",
  "releases_to_keep": 3,
  "group": "remote-group",
  "permissions": "ugo+rX",
  "package_task": "someTask"
};

new GulpSSHDeploy(options, gulp);
```

#### host (Required)
The address or domain name of the host machine where the deployment will reside.

#### port (Optional, default = 22)
The port to use to connect to the aforementioned host.

#### package_json_file_path (Optional, default = "package.json")
The location of the package.json file for the package which you are deploying. For most projects, the default is fine. For electron projects, and those with multiple `package.json` files, this should be the path to the `package.json` file containing the version number of your package.

#### source_files (Optional, default = ".")
The location of the source files which should be transferred to the remote server. By default, this is ".", so all files within the root project directory will be transferred. You will likely want to set this to your build directory.

#### remote_directory (Required)
The location on the remote host where the deployment should be placed. The deployment will be placed in a directory called `releases/<version_number>` within this directory. The `remote_directory` must exist on the remote host, but it can be empty.

#### username (Required)
The username of the user to login with on the remote host. Must have permissions to access the `remote_directory`.

#### ssh_key_file (Required)
A private key to be used to login to the remote host over SSH with the above `username`. The special character `~` will be resolved to the current user's
home directory.

#### releases_to_keep (Optional, default = null)
If specified, this will indicate how many consecutive releases should be kept around after a deployment. If the number of subdirectories in the remote host's `remote_directory/releases` exceeds this number, the version numbers that are first in order by `ls` (i.e. typically the least recent deployments) will be removed until this number is reached.

#### group (Optional, default = null)
If specified, the deployed release will be `chgrp`'ed to this group. The group must exist on the remote host.

#### permissions (Optional, default = null)
If specified, the deployed release folder will be `chmod`'ed to this set of permissions. May be specified in human-readable format (e.g. `ug+rwX`) or octal (e.g. `0777`).

#### package_task (Optional, default = '')
The task to run prior to transferring the distribution. This task should bundle your distribution and prepare it for transfer to the remote host. This will be added as a dependency to the `release` task.

### Gulp Tasks
Setup and configuration will create up to seven gulp tasks:

#### makeRemotePath
Creates the remote path for the distribution, if it doesn't already exist.

#### transferDistribution
Transfers the distribution from the local host to the remote directory.

#### createCurrentSymlink
Creates a `current` symlink in the `remote_directory` which points to the most recent release.

#### setReleaseGroup (if group specified in options)
Sets the group for the new release, if the `group` is specified in options.

#### setReleasePermissions (if permissions specified in options)
Sets the permissions of the `remote_directory` to the permissions specified in the options.

#### removeOldReleases (if releases_to_keep specified and > 0)
Removes old releases to keep a maximum of `releases_to_keep` releases on the remote host.

#### release
Performs all of the above.

**Note**: The `transferDistribution` task (and thus the `release` task) depend on a gulp task called `package`, which should build and package your release prior to sending it to the remote host. If this task does not exist, `release` and `transferDistribution` will fail.

Problems/FAQ
-------------

- **The GulpSSHDeploy constructor is throwing a `DeploymentException`**
  - When the GulpSSHDeploy constructor encounters an invalid configuration value, or a required configuration value that doesn't exist, it throws this exception. You can get more information from the exception (and have it print to the gulp logs) by wrapping the call to the constructor in a try/catch block:
  ```javascript
    try {
      let deployer = new GulpSSHDeploy(options, gulp);
    } catch (exception) {
      exception.printWarning();
    }
  ```
