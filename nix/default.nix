{ inputs, ... }:
{
  imports = [
    inputs.treefmt-nix.flakeModule
  ];
  systems = import inputs.systems;

  perSystem =
    { pkgs, config, ... }:
    {
      devShells.default = pkgs.callPackage ./shell.nix {
        inherit (config.packages) link-arguebase;
        treefmt = config.treefmt.build.wrapper;
      };
      checks = {
        inherit (config.packages) arguebuf;
      };
      packages = {
        default = config.packages.arguebuf;
        arguebuf = pkgs.callPackage ./package.nix {
          inherit (config.packages) link-arguebase;
        };
        arguebase = pkgs.fetchFromGitHub {
          owner = "recap-utr";
          repo = "arguebase-public";
          rev = "468f32818cebe90a837427f4e5f471463159b637";
          hash = "sha256-dF5vJBxVG4qJr+9ZJje27HXU1B+UmP9uzPh+ERUnRsg=";
        };
        link-arguebase = pkgs.writeShellScriptBin "link-arguebase" ''
          mkdir -p data
          ln -sfn ${config.packages.arguebase} data/arguebase
        '';
        release-env = pkgs.buildEnv {
          name = "release-env";
          paths = with pkgs; [ nodejs ];
        };
      };
      treefmt = {
        projectRootFile = "flake.nix";
        programs = {
          nixfmt.enable = true;
          oxfmt = {
            enable = true;
            excludes = [ "CHANGELOG.md" ];
          };
        };
      };
    };
}
