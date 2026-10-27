{
  lib,
  buildNpmPackage,
  importNpmLock,
  oxlint,
  tsgolint,
  link-arguebase,
}:
let
  npmDeps = importNpmLock {
    npmRoot = ../.;
  };
in
buildNpmPackage {
  inherit npmDeps;
  inherit (npmDeps) pname version;
  inherit (importNpmLock) npmConfigHook;

  src = ../.;

  doCheck = true;
  nativeCheckInputs = [
    oxlint
    tsgolint
  ];
  checkPhase = ''
    runHook preCheck

    ${lib.getExe link-arguebase}
    oxlint --type-aware --type-check --deny-warnings
    npm test

    runHook postCheck
  '';

  meta = {
    description = "Create and analyze argument graphs and serialize them via Protobuf";
    license = lib.licenses.mit;
    maintainers = with lib.maintainers; [ mirkolenz ];
    homepage = "https://github.com/recap-utr/arguebuf-typescript";
  };
}
