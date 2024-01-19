{
  description = "A Nix-flake-based development environment for command-server";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs = { self, nixpkgs }:
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forEachSupportedSystem = f: nixpkgs.lib.genAttrs supportedSystems (system: f {
        pkgs = import nixpkgs { inherit system; config.allowUnfree = true; };
      });
    in
    {
      packages = forEachSupportedSystem
        ({ pkgs, ... }:
          let
            attrs = with builtins; fromJSON (readFile ./package.json);
            name = attrs.name;
            version = attrs.version;
          in
          {
            default = pkgs.mkYarnPackage {
              pname = "${name}-${version}";
              src = ./.;

              buildPhase = ''
                # yarn tries to create a .yarn file in $HOME. There's probably a
                # better way to fix this but setting HOME to TMPDIR works for now.
                export HOME="."
                yarn --offline run compile
                # non-existent symlink errors during packaging
                rm ./deps/command-server/command-server
                # need node_modules for vsce, so don't use symlink
                rm ./deps/command-server/node_modules
                cp -R ./node_modules ./deps/command-server
                pushd ./deps/command-server
                echo y | yarn --offline vsce package --yarn -o ./$pname.vsix
                popd
              '';

              installPhase = ''
                mkdir $out
                mv ./deps/command-server/$pname.vsix $out;
              '';

              distPhase = "true";

            };
          });

      devShells = forEachSupportedSystem
        ({ pkgs }: {
          default = pkgs.mkShell
            {
              packages = with pkgs;
                [ yarn typescript ];
            };
        });
    };
}
