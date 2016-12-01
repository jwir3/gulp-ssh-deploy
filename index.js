import gulp from 'gulp';
import * as gulpUtil from 'gulp-util';
import GulpSSH from 'gulp-ssh';
import jetpack from 'fs-jetpack';
import fs from 'fs';
import os from 'os';

export function DeploymentException(message, highlightedText) {
  this.mMessage = message;
  this.mHighlightedText = highlightedText;
}

DeploymentException.prototype = {
  mMessage: null,
  mHighlightedText: null,

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

export function GulpSSHDeploy(aOptions) {
  var self = this;
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
    if (!gulp.tasks.hasOwnProperty(self.mOptions.package_task)) {
      throw new DeploymentException("task not found: ", self.mOptions.package_task);
    }
  }

  if (!self.mOptions.package_json_file_path) {
    self.mOptions.package_json_file_path = 'package.json';
  }

  this.mGulpSSH = new GulpSSH({
    ignoreErrors: false,
    sshConfig: self.mOptions
  });

  self.setupSSHKey();
  self.setupPaths();
  self.addGulpTasks();
}

GulpSSHDeploy.prototype = {
  mGulpSSH: null,
  mOptions: null,
  mCurrentDate: new Date().toISOString(),
  mPackageJson: null,
  mRemoteReleaseDirectory: null,
  mCurrentVersionReleasePath: null,
  mCurrentSymlinkPath: null,

  getPort: function() {
    var self = this;
    return self.mOptions.port;
  },

  getPackageJson: function() {
    var self = this;
    if (!self.mPackageJson) {
      self.mPackageJson = jetpack.read(this.mOptions.package_json_file_path, 'json');
    }

    return self.mPackageJson;
  },

  getRemoteReleasePath: function() {
    return this.mRemoteReleaseDirectory;
  },

  getRemoteReleasePathForCurrentVersion: function() {
    return this.mCurrentVersionReleasePath;
  },

  getCurrentSymlinkPath: function() {
    return this.mCurrentSymlinkPath;
  },

  setupSSHKey: function() {
    var self = this;
    if (!self.mOptions.ssh_key_file
        || !fs.existsSync(self.mOptions.ssh_key_file.replace('~', os.homedir))) {
      throw new DeploymentException("Unable to find ssh key:",
                                    self.mOptions.ssh_key_file);
    }
  },

  setupPaths: function() {
    var self = this;
    var versionFolderName = self.getPackageJson().version;
    self.mRemoteReleaseDirectory = self.mOptions.remote_directory + '/releases';
    self.mCurrentVersionReleasePath = self.mRemoteReleaseDirectory + '/' + versionFolderName;
    self.mCurrentSymlinkPath = self.mOptions.remote_directory + '/current';
  },

  addGulpTasks: function() {
    var self = this;
    self.addTransferDistributionTask();
    self.addCreateSymlinkTask();
    if (self.mOptions.releases_to_keep && self.mOptions.releases_to_keep > 0) {
      self.addRemoveOldReleasesTask();
    }
  },

  addRemoveOldReleasesTask: function() {
    var self = this;
    gulp.task('removeOldReleases', ['transferDistribution'], function() {
      var toRemove = [];

      // Delete all old releases, as specified in the configuration.
      return gulpSSH.exec(['ls ' + self.mRemoteReleaseDirectory])
                    .on ('ssh2Data', (chunk) => {
                      let directories = chunk.toString('utf8').split('\n');
                      var lastDir = directories.pop(); // Last directory is an empty newline
                      var index = 0;
                      for (var index = 0; index < directories.length - (self.mOptions.releases_to_keep); index++) {
                        toRemove.push(directories[index]);
                      }

                      self.removeRemoteReleaseDirectories(toRemove);
                    });
    });
  },

  removeRemoteReleaseDirectories: function(dirs) {
    var self = this;
    var rmDirCommands = [];
    for (var dirIndex in dirs) {
      var nextDir = dirs[dirIndex];
      var removeCommand = 'rm -rf ' + self.mRemoteReleaseDirectory + '/' + nextDir;
      rmDirCommands.push(removeCommand);
    }

    gulpSSH.exec(rmDirCommands, { filePath: 'release-' + currentDate + '.log'})
           .pipe(gulp.dest('logs'));
  },

  addCreateSymlinkTask: function() {
    var self = this;
    gulp.task('createCurrentSymlink', ['transferDistribution'], function() {
      // Create a symlink to the "current" release.
      return gulpSSH.exec(['rm -f ' + self.mCurrentSymlinkPath,
                           'ln -s ' + self.mCurrentVersionReleasePath + " " + self.mCurrentSymlinkPath],
                          { filePath: 'release-' + self.mCurrentDate + '.log'})
                    .pipe(gulp.dest('logs'));
    });

  },

  addTransferDistributionTask: function() {
    var self = this;
    var deps = [];
    // var deps = ['makeRemotePath'];
    if (self.mOptions.package_task) {
      deps.push(self.mOptions.package_task);
    }

    // TODO: Right now, this only transfers .deb and .dmg files. We should add
    //       a parameter so it can transfer any files, given a set of regexs.
    gulp.task('transferDistribution', deps, function() {
      // Upload the packaged release to the server.
      return gulp.src(['./dist/*.deb', './dist/*.dmg'])
                 .pipe(gulpSSH.dest(fullReleaseDirPath));
    });
  }
};
