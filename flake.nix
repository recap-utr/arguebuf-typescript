{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    systems.url = "github:nix-systems/default";
    flake-parts.url = "github:hercules-ci/flake-parts";
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
            arguebuf =
              let
                npmDeps = pkgs.importNpmLock {
                  npmRoot = ./.;
                };
              in
              pkgs.buildNpmPackage {
                inherit npmDeps;
                inherit (npmDeps) pname version;
                inherit (pkgs.importNpmLock) npmConfigHook;

                src = ./.;
                checkPhase = ''
                  runHook preCheck

                  ${lib.getExe config.packages.link-arguebase}
                  npm run check

                  runHook postCheck
                '';

                meta = with lib; {
                  description = "Create and analyze argument graphs and serialize them via Protobuf";
                  license = licenses.mit;
                  maintainers = with maintainers; [ mirkolenz ];
                  homepage = "https://github.com/recap-utr/arguebuf-typescript";
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
              paths = with pkgs; [ nodejs ];
            };
          };
          devShells.default = pkgs.mkShell {
            shellHook = ''
              ${lib.getExe' pkgs.nodejs "npm"} install
              ${lib.getExe config.packages.link-arguebase}
            '';
            packages = with pkgs; [ nodejs ];
          };
        };
    };
}
