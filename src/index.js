import * as gulpUtil from 'gulp-util';
import GulpSSH from 'gulp-ssh';
import jetpack from 'fs-jetpack';
import fs from 'fs';
import os from 'os';
import Filehound from 'filehound';

export function DeploymentException(message, highlightedText) {
  this.mMessage = message;
  this.mHighlightedText = highlightedText;
}

DeploymentException.prototype = {
  mMessage: null,
  mHighlightedText: null,

  /**
   * Print this exception to the gulp log, with some color highlighting.
   */
  printWarning: function() {
    var self = this;
    if (!self.mHighlightedText) {
      gulpUtil.log(gulpUtil.colors.yellow('Warning:'), self.mMessage, "You will not be able to deploy.");
    } else {
      gulpUtil.log(gulpUtil.colors.yellow('Warning:'), self.mMessage,
                   gulpUtil.colors.cyan(self.mHighlightedText),
                   "You will not be able to deploy.");
    }
  }
};

/**
 * Create a new GulpSSHDeploy object, which will, in turn, create the appropriate
 * gulp tasks associated with deploying releases.
 *
 * @param {object} aOptions The configuration to setup deployments (see README).
 * @param {object} gulp     A gulp object within which tasks should be created.
 */
export function GulpSSHDeploy(aOptions, gulp) {
  var self = this;
  self.mGulp = gulp;
  self.mOptions = aOptions;

  if (!self.mOptions) {
    throw new DeploymentException("deployment options are not properly configured.");
  }

  if (!self.mOptions.port) {
    self.mOptions.port = 22;
  }

  if (!self.mOptions.host) {
    throw new DeploymentException("deployment options must contain a host");
  }

  if (!self.mOptions.remote_directory) {
    throw new DeploymentException("deployment options must identify remote directory where deployments should be placed");
  }

  if (!self.mOptions.username) {
    throw new DeploymentException("deployment options must contain a remote username");
  }

  if (self.mOptions.package_task) {
    // Before we can set up a dependency, we have to verify the task exists.
    if (!self.mGulp.tasks.hasOwnProperty(self.mOptions.package_task)) {
      throw new DeploymentException("task not found: ", self.mOptions.package_task);
    }
  }

  if (!self.mOptions.package_json_file_path) {
    self.mOptions.package_json_file_path = 'package.json';
  }

  if (!self.mOptions.source_files) {
    self.mOptions.source_files = '.';
  }

  self._setupSSHKey();

  self.mGulpSSH = new GulpSSH({
    ignoreErrors: false,
    sshConfig: self.mOptions
  });

  self._setupPaths();
  self._addGulpTasks();
}

GulpSSHDeploy.prototype = {
  mGulpSSH: null,
  mOptions: null,
  mGulp: null,
  mCurrentDate: new Date().toISOString(),
  mPackageJson: null,
  mRemoteReleaseDirectory: null,
  mCurrentVersionReleasePath: null,
  mCurrentSymlinkPath: null,

  /**
   * Retrieve the port of this {GulpSSHDeploy} object.
   *
   * @return {integer} The port of the remote host to use for SSH connections.
   */
  getPort: function() {
    var self = this;
    return self.mOptions.port;
  },

  /**
   * Retrieve the package.json file, as a JSON object.
   *
   * @return {object} The object containing the contents of the package.json file
   *                  specified in the options structure.
   */
  getPackageJson: function() {
    var self = this;
    if (!self.mPackageJson) {
      self.mPackageJson = jetpack.read(this.mOptions.package_json_file_path, 'json');
    }

    return self.mPackageJson;
  },

  /**
   * Retrieve the root path for which all deployments should be placed on the
   * remote host.
   *
   * @return {string} The location on the remote host where the deployment will
   *                  be placed.
   */
  getRemoteReleasePath: function() {
    return this.mRemoteReleaseDirectory;
  },

  /**
   * Retrieve the path on the remote host for the current release.
   *
   * @return {string} The path on the remote host for the current release. This
   *                  will always be a subdirectory of the directory returned by
   *                  {@link #getRemoteReleasePath}.
   */
  getRemoteReleasePathForCurrentVersion: function() {
    return this.mCurrentVersionReleasePath;
  },

  /**
   * Retrieve the path to the symlink called 'current' which points to the latest
   * release on the remote host.
   *
   * @return {string} The path, on the remote host, of the symlink to the
   *                  latest release.
   */
  getCurrentSymlinkPath: function() {
    return this.mCurrentSymlinkPath;
  },

  /**
   * Retrieve a set of files which should be copied to the remote host.
   *
   * @return {array} A list of files, relative to the current project path,
   *                 that should be copied to the remote host.
   */
  getFilesToCopy: function() {
    var self = this;
    return Filehound.create()
                    .paths(self.mOptions.source_files)
                    .findSync();
  },

  _setupSSHKey: function() {
    var self = this;
    if (!self.mOptions.ssh_key_file
        || !fs.existsSync(self.mOptions.ssh_key_file.replace('~', os.homedir))) {
      throw new DeploymentException("Unable to find ssh key:",
                                    self.mOptions.ssh_key_file);
    }

    self.mOptions.privateKey = fs.readFileSync(self.mOptions.ssh_key_file.replace("~", os.homedir));
  },

  _setupPaths: function() {
    var self = this;
    var versionFolderName = self.getPackageJson().version;
    self.mRemoteReleaseDirectory = self.mOptions.remote_directory + '/releases';
    self.mCurrentVersionReleasePath = self.mRemoteReleaseDirectory + '/' + versionFolderName;
    self.mCurrentSymlinkPath = self.mOptions.remote_directory + '/current';
  },

  _addGulpTasks: function() {
    var self = this;
    self._addMakeRemoteDirectoriesTask();
    self._addTransferDistributionTask();
    self._addCreateSymlinkTask();
    if (self.mOptions.releases_to_keep && self.mOptions.releases_to_keep > 0) {
      self._addRemoveOldReleasesTask();
    }

    if (self.mOptions.group) {
      self._addSetReleaseGroupTask();
    }

    if (self.mOptions.permissions) {
      self._addSetReleasePermissionsTask();
    }

    self._addReleaseTask();
  },

  _addMakeRemoteDirectoriesTask: function() {
    var self = this;
    self.mGulp.task('makeRemoteDirectories', function() {
      return self.mGulpSSH.exec(['mkdir -p ' + self.mCurrentVersionReleasePath],
                                { filePath: 'release-' + self.mCurrentDate + '.log'})
                          .pipe(self.mGulp.dest('logs'));
    });
  },

  _addRemoveOldReleasesTask: function() {
    var self = this;
    self.mGulp.task('removeOldReleases', ['createCurrentSymlink'], function() {
      var toRemove = [];

      // Delete all old releases, as specified in the configuration.
      return self.mGulpSSH.exec(['ls ' + self.mRemoteReleaseDirectory])
                          .on ('ssh2Data', (chunk) => {
                            let directories = chunk.toString('utf8').split('\n');
                            var lastDir = directories.pop(); // Last directory is an empty newline
                            var index = 0;
                            for (var index = 0; index < directories.length - (self.mOptions.releases_to_keep); index++) {
                              toRemove.push(directories[index]);
                            }

                            self._removeRemoteReleaseDirectories(toRemove);
                          });
    });
  },

  _removeRemoteReleaseDirectories: function(dirs) {
    var self = this;
    var rmDirCommands = [];
    for (var dirIndex in dirs) {
      var nextDir = dirs[dirIndex];
      var removeCommand = 'rm -rf ' + self.mRemoteReleaseDirectory + '/' + nextDir;
      rmDirCommands.push(removeCommand);
    }

    self.mGulpSSH.exec(rmDirCommands, { filePath: 'release-' + self.mCurrentDate + '.log'})
                 .pipe(self.mGulp.dest('logs'));
  },

  _addCreateSymlinkTask: function() {
    var self = this;
    self.mGulp.task('createCurrentSymlink', ['transferDistribution'], function() {
      // Create a symlink to the "current" release.
      return self.mGulpSSH.exec(['rm -f ' + self.mCurrentSymlinkPath,
                                 'ln -s ' + self.mCurrentVersionReleasePath + " " + self.mCurrentSymlinkPath],
                                { filePath: 'release-' + self.mCurrentDate + '.log'})
                          .pipe(self.mGulp.dest('logs'));
    });
  },

  _addTransferDistributionTask: function() {
    var self = this;
    var deps = [];
    // var deps = ['makeRemotePath'];
    if (self.mOptions.package_task) {
      deps.push(self.mOptions.package_task);
    }

    // TODO: Right now, this only transfers .deb and .dmg files. We should add
    //       a parameter so it can transfer any files, given a set of regexs.
    self.mGulp.task('transferDistribution', deps, function() {
      // Upload the packaged release to the server.
      return self.mGulp.src(self.mOptions.source_files)
                       .pipe(self.mGulpSSH.dest(self.mCurrentVersionReleasePath));
    });
  },

  _addSetReleaseGroupTask: function() {
    var self = this;
    var dep = [];
    if (self.mOptions.releases_to_keep && self.mOptions.releases_to_keep > 0) {
      dep = ['removeOldReleases'];
    } else {
      dep = ['createCurrentSymlink'];
    }

    self.mGulp.task('setReleaseGroup', dep, function() {
      return self.mGulpSSH.exec(['chgrp -R ' + self.mOptions.group + ' ' + self.mCurrentVersionReleasePath],
                                {filePath: 'release-' + self.mCurrentDate + '.log'})
                          .pipe(self.mGulp.dest('logs'));
    });
  },

  _addSetReleasePermissionsTask: function() {
    var self = this;
    var dep = [];
    if (self.mOptions.group && self.mOptions.group.length > 0) {
      dep = ['setReleaseGroup'];
    } else {
      dep = ['createCurrentSymlink'];
    }

    self.mGulp.task('setReleasePermissions', dep, function() {
      return self.mGulpSSH.exec(['chmod -R ' + self.mOptions.permissions + ' ' + self.mCurrentVersionReleasePath],
                                {filePath: 'release-' + self.mCurrentDate + '.log'})
                          .pipe(self.mGulp.dest('logs'));
    });
  },

  _addReleaseTask: function() {
    var self = this;
    var dep = [];
    if (self.mOptions.permissions && self.mOptions.permissions.length > 0) {
      dep = ['setReleasePermissions'];
    }

    if (self.mOptions.group && self.mOptions.group.length > 0) {
      dep.push('setReleaseGroup');
    }

    if (dep.length == 0) {
      dep.push('createCurrentSymlink');
    }

    self.mGulp.task('release', dep);
  }
};
