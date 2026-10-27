{
  treefmt,
  link-arguebase,
  mkShell,
  nodejs,
  lib,
}:
mkShell {
  shellHook = ''
    ${lib.getExe' nodejs "npm"} install
    ${lib.getExe link-arguebase}
  '';
  packages = [
    nodejs
    treefmt
  ];
}
