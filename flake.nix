{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    systems.url = "github:nix-systems/default";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };
  outputs = inputs @ {
    nixpkgs,
    flake-parts,
    systems,
    ...
  }:
    flake-parts.lib.mkFlake {inherit inputs;} {
      systems = import systems;
      perSystem = {pkgs, ...}: let
        packages = with pkgs; [nodejs_20];
      in {
        packages.releaseEnv = pkgs.buildEnv {
          name = "release-env";
          paths = packages;
        };
        devShells.default = pkgs.mkShell {
          shellHook = "npm install";
          inherit packages;
        };
      };
    };
}
