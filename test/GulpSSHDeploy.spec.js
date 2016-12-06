import { expect } from 'chai';
import { GulpSSHDeploy, DeploymentException } from '../dist/index';
import jetpack from 'fs-jetpack';
import gulp from 'gulp';
import Filehound from 'filehound';

var options = {
  "host": "endor.glasstowerstudios.com",
  "port": 22,
  "remote_directory": "/var/www/arbitrator.glasstowerstudios.com",
  "username": "scottj",
  "ssh_key_file": "~/.ssh/id_rsa",
  "releases_to_keep": 3,
  "group": "www-glasstower",
  "permissions": "ugo+rX",
};

describe("gulp-ssh-deploy setup", function() {
  it ("should correctly set up an instance of GulpSSHDeploy that has package json information", () => {
    let expectedPackageJsonVersion = jetpack.read('package.json', 'json').version;
    let deployer = new GulpSSHDeploy(options, gulp);
    let packageJson = deployer.getPackageJson();
    expect(packageJson.version).to.eq(expectedPackageJsonVersion);
  });

  it ("should throw an exception if constructed without any options", () => {
    var constructor = function() { return new GulpSSHDeploy(); }
    expect(constructor).to.throw(DeploymentException);
  });

  it ("should throw an exception if the ssh key cannot be found", () => {
    var modifiedOptions = {
      "host": "endor.glasstowerstudios.com",
      "port": 22,
      "remote_directory": "/var/www/arbitrator.glasstowerstudios.com",
      "username": "scottj",
      "ssh_key_file": "/some/nonexistent/path/to/nowhere/ahsastwqka812/id_rsa",
      "releases_to_keep": 3,
      "group": "www-glasstower",
      "permissions": "ugo+rX"
    };

    var constructor = function() { return new GulpSSHDeploy(modifiedOptions, gulp); }
    expect(constructor).to.throw(DeploymentException);
  });

  it ("should throw an exception if a host is not provided", () => {
    var modifiedOptions = {
      "remote_directory": "/var/www/arbitrator.glasstowerstudios.com",
      "username": "scottj",
      "ssh_key_file": "~/.ssh/id_rsa",
    };

    var constructor = function() { return new GulpSSHDeploy(modifiedOptions); }
    expect(constructor).to.throw(DeploymentException);
  });

  it ("should throw an exception if a remote_directory is not provided", () => {
    var modifiedOptions = {
      "host": "endor.glasstowerstudios.com",
      "username": "scottj",
      "ssh_key_file": "~/.ssh/id_rsa",
    };

    var constructor = function() { return new GulpSSHDeploy(modifiedOptions, gulp); }
    expect(constructor).to.throw(DeploymentException);
  });

  it ("should throw an exception if a username is not provided", () => {
    var modifiedOptions = {
      "host": "endor.glasstowerstudios.com",
      "remote_directory": "/var/www/arbitrator.glasstowerstudios.com",
      "ssh_key_file": "~/.ssh/id_rsa",
    };

    var constructor = function() { return new GulpSSHDeploy(modifiedOptions); }
    expect(constructor).to.throw(DeploymentException);
  });

  it ("should throw an exception if an ssh_key_file is not provided", () => {
    var modifiedOptions = {
      "host": "endor.glasstowerstudios.com",
      "remote_directory": "/var/www/arbitrator.glasstowerstudios.com",
      "username": "scottj",
    };

    var constructor = function() { return new GulpSSHDeploy(modifiedOptions, gulp); }
    expect(constructor).to.throw(DeploymentException);
  });

  it ("should not require port, releases_to_keep, group, or permissions options", () => {
    var modifiedOptions = {
      "host": "endor.glasstowerstudios.com",
      "remote_directory": "/var/www/arbitrator.glasstowerstudios.com",
      "username": "scottj",
      "ssh_key_file": "~/.ssh/id_rsa",
    };

    var deployer = new GulpSSHDeploy(modifiedOptions, gulp);
    expect(deployer).to.not.be.null;
    expect(deployer.getPort()).to.eq(22);
  });

  it ("should throw an exception if packaging is requested but the package task is not present", () => {
    var modifiedOptions = {
      "host": "endor.glasstowerstudios.com",
      "port": 22,
      "remote_directory": "/var/www/arbitrator.glasstowerstudios.com",
      "username": "scottj",
      "ssh_key_file": "~/.ssh/id_rsa",
      "releases_to_keep": 3,
      "group": "www-glasstower",
      "permissions": "ugo+rX",
      "package_task": "packageBlahBlahGarbage"
    };

    var constructor = function () { new GulpSSHDeploy(modifiedOptions, gulp); }
    expect(constructor).to.throw(DeploymentException);
  });

  it ("should not throw an exception if packaging is requested and the package task is present", () => {
    var modifiedOptions = {
      "host": "endor.glasstowerstudios.com",
      "port": 22,
      "remote_directory": "/var/www/arbitrator.glasstowerstudios.com",
      "username": "scottj",
      "ssh_key_file": "~/.ssh/id_rsa",
      "releases_to_keep": 3,
      "group": "www-glasstower",
      "permissions": "ugo+rX",
      "package_task": "bogusTask"
    };

    gulp.task("bogusTask", function() {
      console.log("Bogus");
    });

    var constructor = function () { new GulpSSHDeploy(modifiedOptions, gulp); }
    expect(constructor).to.not.throw(DeploymentException);
  });

  it ("should add a gulp task for creating the remote directories", () => {
    gulp.tasks = {};

    new GulpSSHDeploy(options, gulp);

    expect(gulp.tasks).to.have.ownProperty('makeRemoteDirectories');
  });

  it ("should add a gulp task for transfering the packaged distribution to the server using sftp", () => {
    gulp.tasks = {};

    var modifiedOptions = {
      "host": "endor.glasstowerstudios.com",
      "port": 22,
      "remote_directory": "/var/www/arbitrator.glasstowerstudios.com",
      "username": "scottj",
      "ssh_key_file": "~/.ssh/id_rsa",
      "releases_to_keep": 3,
      "group": "www-glasstower",
      "permissions": "ugo+rX"
    };

    new GulpSSHDeploy(modifiedOptions, gulp);

    expect(gulp.tasks).to.have.ownProperty('transferDistribution');
  });

  it ("should appropriately set up the remote paths", () => {
    var modifiedOptions = {
      "host": "endor.glasstowerstudios.com",
      "port": 22,
      "remote_directory": "/var/www/arbitrator.glasstowerstudios.com",
      "username": "scottj",
      "ssh_key_file": "~/.ssh/id_rsa",
      "releases_to_keep": 3,
      "group": "www-glasstower",
      "permissions": "ugo+rX"
    };

    var deployer = new GulpSSHDeploy(modifiedOptions, gulp);
    var version = deployer.getPackageJson().version;
    var expectedReleasesRemotePath = modifiedOptions.remote_directory + '/releases';
    expect(deployer.getRemoteReleasePath()).to.eq(expectedReleasesRemotePath);
    expect(deployer.getRemoteReleasePathForCurrentVersion()).to.eq(expectedReleasesRemotePath + '/' + version);
    expect(deployer.getCurrentSymlinkPath()).to.eq(modifiedOptions.remote_directory + "/current");
  });

  it ("should add a gulp task for creating a symlink to the current release", () => {
    gulp.tasks = {};

    var modifiedOptions = {
      "host": "endor.glasstowerstudios.com",
      "port": 22,
      "remote_directory": "/var/www/arbitrator.glasstowerstudios.com",
      "username": "scottj",
      "ssh_key_file": "~/.ssh/id_rsa",
      "releases_to_keep": 3,
      "group": "www-glasstower",
      "permissions": "ugo+rX"
    };

    new GulpSSHDeploy(modifiedOptions, gulp);

    expect(gulp.tasks).to.have.ownProperty('createCurrentSymlink');
    expect(gulp.tasks.createCurrentSymlink.dep).to.include.members(['transferDistribution'])
  });

  it ("should not add a gulp task for removing old releases if releases_to_keep is not specified", () => {
    gulp.tasks = {};

    var modifiedOptions = {
      "host": "endor.glasstowerstudios.com",
      "port": 22,
      "remote_directory": "/var/www/arbitrator.glasstowerstudios.com",
      "username": "scottj",
      "ssh_key_file": "~/.ssh/id_rsa",
      "group": "www-glasstower",
      "permissions": "ugo+rX"
    };

    new GulpSSHDeploy(modifiedOptions, gulp);

    expect(gulp.tasks).to.not.have.ownProperty('removeOldReleases');
    expect(gulp.tasks).to.have.ownProperty('setReleaseGroup');
    expect(gulp.tasks.setReleaseGroup.dep).to.include.members(['createCurrentSymlink']);
  });

  it ("should add a gulp task for removing old releases if releases_to_keep was specified and greater than 0", () => {
    gulp.tasks = {};

    var modifiedOptions = {
      "host": "endor.glasstowerstudios.com",
      "port": 22,
      "remote_directory": "/var/www/arbitrator.glasstowerstudios.com",
      "username": "scottj",
      "ssh_key_file": "~/.ssh/id_rsa",
      "releases_to_keep": 3,
      "group": "www-glasstower",
      "permissions": "ugo+rX"
    };

    new GulpSSHDeploy(modifiedOptions, gulp);

    expect(gulp.tasks).to.have.ownProperty('removeOldReleases');
    expect(gulp.tasks.removeOldReleases.dep).to.have.members(['createCurrentSymlink'])
  });

  it ("should add a gulp task for setting release group if 'group' is present in the options", () => {
    new GulpSSHDeploy(options, gulp);

    expect(gulp.tasks).to.have.ownProperty('setReleaseGroup');
  });

  it ("should not add a gulp task for setting release group if 'group' is not present in the options", () => {
    gulp.tasks = {};

    var modifiedOptions = {
      "host": "endor.glasstowerstudios.com",
      "port": 22,
      "remote_directory": "/var/www/arbitrator.glasstowerstudios.com",
      "username": "scottj",
      "ssh_key_file": "~/.ssh/id_rsa",
      "permissions": "ugo+rX",
      "releases_to_keep": 3
    };

    new GulpSSHDeploy(modifiedOptions, gulp);

    expect(gulp.tasks).to.not.have.ownProperty('setReleaseGroup');
    expect(gulp.tasks).to.have.ownProperty('setReleasePermissions');
    expect(gulp.tasks.setReleasePermissions.dep).to.include.members(['createCurrentSymlink']);
  });

  it ("should add a gulp task for setting release permissions", () => {
    new GulpSSHDeploy(options, gulp);

    expect(gulp.tasks).to.have.ownProperty('setReleasePermissions');
  });

  it ("should not add a gulp task for setting release permissions if 'permissions' is not present in the options", () => {
    gulp.tasks = {};

    var modifiedOptions = {
      "host": "endor.glasstowerstudios.com",
      "port": 22,
      "remote_directory": "/var/www/arbitrator.glasstowerstudios.com",
      "username": "scottj",
      "ssh_key_file": "~/.ssh/id_rsa",
      "group": "www-glasstower",
      "releases_to_keep": 3
    };

    new GulpSSHDeploy(modifiedOptions, gulp);

    expect(gulp.tasks).to.not.have.ownProperty('setReleasePermissions');
    expect(gulp.tasks).to.have.ownProperty('setReleaseGroup');
    expect(gulp.tasks.release.dep).to.include.members(['setReleaseGroup']);
  });

  it ("should not add gulp tasks for setting release permissions or groups if both permissions and group are not present in the options", () => {
    gulp.tasks = {};

    var modifiedOptions = {
      "host": "endor.glasstowerstudios.com",
      "port": 22,
      "remote_directory": "/var/www/arbitrator.glasstowerstudios.com",
      "username": "scottj",
      "ssh_key_file": "~/.ssh/id_rsa",
      "releases_to_keep": 3
    };

    new GulpSSHDeploy(modifiedOptions, gulp);

    expect(gulp.tasks).to.not.have.ownProperty('setReleasePermissions');
    expect(gulp.tasks).to.not.have.ownProperty('setReleaseGroup');
    expect(gulp.tasks.release.dep).to.include.members(['createCurrentSymlink']);
    expect(gulp.tasks.release.dep).to.not.include.members(['setReleasePermissions', 'setReleaseGroup']);
  });

  it ("should add a gulp task for deploying to a server", () => {
    new GulpSSHDeploy(options, gulp);

    expect(gulp.tasks).to.have.ownProperty('release');
  });

  it ('should plan to copy all files in the test directory for a source specification of "test"', () => {
    var modifiedOptions = {
      "host": "endor.glasstowerstudios.com",
      "port": 22,
      "source_files": "test",
      "remote_directory": "/var/www/arbitrator.glasstowerstudios.com",
      "username": "scottj",
      "ssh_key_file": "~/.ssh/id_rsa",
      "releases_to_keep": 3,
      "group": "www-glasstower",
      "permissions": "ugo+rX"
    };

    let expectedFiles = Filehound.create()
                                 .paths("test")
                                 .findSync();
    let deployer = new GulpSSHDeploy(modifiedOptions, gulp);
    let filesToCopy = deployer.getFilesToCopy();
    expect(filesToCopy).to.have.lengthOf(expectedFiles.length);
    expect(filesToCopy).to.include.members(expectedFiles);
  });
});
