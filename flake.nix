{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    systems.url = "github:nix-systems/default";
    flake-parts.url = "github:hercules-ci/flake-parts";
    npmlock2nix = {
      url = "github:nix-community/npmlock2nix";
      flake = false;
    };
    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };
  outputs =
    inputs@{
      flake-parts,
      systems,
      ...
    }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = import systems;
      imports = [
        inputs.treefmt-nix.flakeModule
      ];
      perSystem =
        {
          pkgs,
          lib,
          config,
          ...
        }:
        let
          nodejs = pkgs.nodejs_20;
          npmlock2nix = import inputs.npmlock2nix { inherit pkgs; };
        in
        {
          treefmt = {
            projectRootFile = "flake.nix";
            programs = {
              prettier = {
                enable = true;
                excludes = [
                  "CHANGELOG.md"
                ];
              };
              nixfmt.enable = true;
            };
          };
          checks = {
            inherit (config.packages) arguebuf;
          };
          packages = {
            default = config.packages.arguebuf;
            arguebuf = npmlock2nix.v2.build {
              src = ./.;
              installPhase = ''
                runHook preInstall

                mkdir -p $out
                cp -r dist/. $out

                runHook postInstall
              '';
              doCheck = true;
              checkPhase = ''
                runHook preCheck

                ${lib.getExe config.packages.link-arguebase}
                npm run check

                runHook postCheck
              '';
              node_modules_attrs = {
                inherit nodejs;
              };
            };
            arguebase = pkgs.fetchFromGitHub {
              owner = "recap-utr";
              repo = "arguebase-public";
              rev = "468f32818cebe90a837427f4e5f471463159b637";
              hash = "sha256-dF5vJBxVG4qJr+9ZJje27HXU1B+UmP9uzPh+ERUnRsg=";
            };
            link-arguebase = pkgs.writeShellScriptBin "link-arguebase" ''
              mkdir -p data
              rm -f data/arguebase
              ln -sf ${config.packages.arguebase} data/arguebase
            '';
            release-env = pkgs.buildEnv {
              name = "release-env";
              paths = [ nodejs ];
            };
          };
          devShells.default = pkgs.mkShell {
            shellHook = ''
              ${lib.getExe' nodejs "npm"} install
              ${lib.getExe nodejs} --version > .node-version
              ${lib.getExe config.packages.link-arguebase}
            '';
            packages = [ nodejs ];
          };
        };
    };
}
