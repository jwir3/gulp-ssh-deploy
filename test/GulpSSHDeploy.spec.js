import { expect } from 'chai';
import { GulpSSHDeploy, DeploymentException } from '../index';
import jetpack from 'fs-jetpack';

var options = {
  "host": "endor.glasstowerstudios.com",
  "port": 22,
  "remote_directory": "/var/www/arbitrator.glasstowerstudios.com",
  "username": "scottj",
  "private_key_file": "~/.ssh/id_rsa",
  "releases_to_keep": 3,
  "group": "www-glasstower",
  "permissions": "ugo+rX"
};

describe("Basic Object Testing", function() {
  it ("should correctly set up an instance of GulpSSHDeploy that has package json information", () => {
    let expectedPackageJsonVersion = jetpack.read('package.json', 'json').version;
    let deployer = new GulpSSHDeploy(options);
    let packageJson = deployer.getPackageJson();
    expect(packageJson.version).to.eq(expectedPackageJsonVersion);
  });

  it ("should throw an exception if constructed without any options", () => {
    var constructor = function() { return new GulpSSHDeploy(); }
    expect(constructor).to.throw(DeploymentException);
  });

  it ("should throw an exception if the private key cannot be found", () => {
    var modifiedOptions = {
      "host": "endor.glasstowerstudios.com",
      "port": 22,
      "remote_directory": "/var/www/arbitrator.glasstowerstudios.com",
      "username": "scottj",
      "private_key_file": "/some/nonexistent/path/to/nowhere/ahsastwqka812/id_rsa",
      "releases_to_keep": 3,
      "group": "www-glasstower",
      "permissions": "ugo+rX"
    };

    var constructor = function() { return new GulpSSHDeploy(modifiedOptions); }
    expect(constructor).to.throw(DeploymentException);
  });
});
