import gulp from 'gulp';
import * as gulpUtil from 'gulp-util';
import GulpSSH from 'gulp-ssh';
import jetpack from 'fs-jetpack';
import fs from 'fs';
import os from 'os';

export function DeploymentException(message) {
  this.mMessage = message;
}

DeploymentException.prototype = {
  mMessage: null
};

export function GulpSSHDeploy(aOptions) {
  var self = this;
  self.mOptions = aOptions;

  if (!self.mOptions) {
    gulpUtil.log(gulpUtil.colors.yellow('Warning:'),
                 "deploy_config in package.json not properly configured. You will not be able to deploy.");
    throw new DeploymentException("deploy_config in package.json not properly configured");
  }

  if (!self.mOptions.package_json_file_path) {
    self.mOptions.package_json_file_path = 'package.json';
  }

  this.mGulpSSH = new GulpSSH({
    ignoreErrors: false,
    sshConfig: self.mOptions
  });

  self.setupPrivateKey();
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

  setupPrivateKey: function() {
    var self = this;
    if (!fs.existsSync(self.mOptions.private_key_file.replace('~', os.homedir))) {
      gulpUtil.log(gulpUtil.colors.yellow('Warning:'), "Unable to find private key:",
                   gulpUtil.colors.cyan(self.mOptions.private_key_file),
                   "You will not be able to deploy");
      throw new DeploymentException("Unable to find private key");
    }
  }
};
