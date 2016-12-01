import gulp from 'gulp';
import * as gulpUtil from 'gulp-util';
import GulpSSH from 'gulp-ssh';
import jetpack from 'fs-jetpack';
import fs from 'fs';
import os from 'os';

export function DeploymentException(message, sshKeyFile) {
  this.mMessage = message;
  this.mSSHKeyFile = sshKeyFile;
}

DeploymentException.prototype = {
  mMessage: null,
  mSSHKeyFile: null,

  printWarning: function() {
    var self = this;
    if (!self.mSSHKeyFile) {
      gulpUtil.log(gulpUtil.colors.yellow('Warning:'), self.mMessage, "You will not be able to deploy.");
    } else {
      gulpUtil.log(gulpUtil.colors.yellow('Warning:'), self.mMessage,
                   gulpUtil.colors.cyan(self.mSSHKeyFile),
                   "You will not be able to deploy.");
    }
  }
};

export function GulpSSHDeploy(aOptions) {
  var self = this;
  self.mOptions = aOptions;

  if (!self.mOptions) {
    throw new DeploymentException("deploy_config in package.json not properly configured.");
  }

  if (!self.mOptions.package_json_file_path) {
    self.mOptions.package_json_file_path = 'package.json';
  }

  this.mGulpSSH = new GulpSSH({
    ignoreErrors: false,
    sshConfig: self.mOptions
  });

  self.setupSSHKey();
  // self.addGulpTasks();
}

GulpSSHDeploy.prototype = {
  mGulpSSH: null,
  mOptions: null,
  mCurrentDate: new Date().toISOString(),
  mPackageJson: null,

  getPackageJson: function() {
    var self = this;
    if (!self.mPackageJson) {
      self.mPackageJson = jetpack.read(this.mOptions.package_json_file_path, 'json');
    }

    return self.mPackageJson;
  },

  setupSSHKey: function() {
    var self = this;
    if (!fs.existsSync(self.mOptions.ssh_key_file.replace('~', os.homedir))) {
      throw new DeploymentException("Unable to find ssh key:",
                                    self.mOptions.ssh_key_file);
    }
  }
};
