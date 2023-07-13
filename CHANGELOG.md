# Changelog

## [1.8.7](https://github.com/recap-utr/arguebuf-typescript/compare/v1.8.6...v1.8.7) (2023-07-13)


### Bug Fixes

* update xaif schema to latest version ([77af62b](https://github.com/recap-utr/arguebuf-typescript/commit/77af62ba9945910c81538d27a2ef44214b2d2f49))

## [1.8.6](https://github.com/recap-utr/arguebuf-typescript/compare/v1.8.5...v1.8.6) (2023-07-12)


### Bug Fixes

* add methods to add/remove graph elements ([#33](https://github.com/recap-utr/arguebuf-typescript/issues/33)) ([e49f700](https://github.com/recap-utr/arguebuf-typescript/commit/e49f700460539c04096a95a3a0db1b8ad8b08909))

## [1.8.5](https://github.com/recap-utr/arguebuf-typescript/compare/v1.8.4...v1.8.5) (2023-06-06)


### Bug Fixes

* loosen json object constraints ([44b88ae](https://github.com/recap-utr/arguebuf-typescript/commit/44b88aee7cda6733f292504693a25717329b0f95))

## [1.8.4](https://github.com/recap-utr/arguebuf-typescript/compare/v1.8.3...v1.8.4) (2023-06-06)


### Bug Fixes

* improve sadface types ([4f2ba54](https://github.com/recap-utr/arguebuf-typescript/commit/4f2ba542d4049fdda2f8c0ce040b3a482a8acaee))
* update date formats for dayjs ([5e3049c](https://github.com/recap-utr/arguebuf-typescript/commit/5e3049cf9f6b268767e10303b7c03f9296e4c718))

## [1.8.3](https://github.com/recap-utr/arguebuf-typescript/compare/v1.8.2...v1.8.3) (2023-06-05)


### Bug Fixes

* always return value in scheme2string ([0c4f1e4](https://github.com/recap-utr/arguebuf-typescript/commit/0c4f1e4757a0dd72103f91a45278bde5642fe541))
* return lowercased scheme names as label ([5102f07](https://github.com/recap-utr/arguebuf-typescript/commit/5102f07a1d882b1cc84e0ed3d92e77891e3ecbfe))

## [1.8.2](https://github.com/recap-utr/arguebuf-typescript/compare/v1.8.1...v1.8.2) (2023-06-05)


### Bug Fixes

* properly set major claim in graph constructor ([9418814](https://github.com/recap-utr/arguebuf-typescript/commit/94188146e89e8799f7469f94cc574bd800d18428))

## [1.8.1](https://github.com/recap-utr/arguebuf-typescript/compare/v1.8.0...v1.8.1) (2023-06-05)


### Bug Fixes

* declare all classes as immerable ([6e2ca9c](https://github.com/recap-utr/arguebuf-typescript/commit/6e2ca9caa3c1b6360e2277af269775c8a0426c15))

## [1.8.0](https://github.com/recap-utr/arguebuf-typescript/compare/v1.7.3...v1.8.0) (2023-03-18)


### Features

* add loader for xAIF graphs ([#20](https://github.com/recap-utr/arguebuf-typescript/issues/20)) ([d91fa70](https://github.com/recap-utr/arguebuf-typescript/commit/d91fa700055664869e35b2104bc910ce54a6001d))


### Bug Fixes

* make xaif schema more robust ([d3b76d6](https://github.com/recap-utr/arguebuf-typescript/commit/d3b76d6acbe2b00bb06eaea7921c9a694bae6b30))
* use correct capitalization of xaif files ([dbd6063](https://github.com/recap-utr/arguebuf-typescript/commit/dbd60637b021a3e7e4e6910a393c608cde94cbd8))

## [1.7.3](https://github.com/recap-utr/arguebuf-typescript/compare/v1.7.2...v1.7.3) (2023-03-09)


### Bug Fixes

* graphs were not properly copied ([0084fac](https://github.com/recap-utr/arguebuf-typescript/commit/0084fac3fb4e99a0d3fab696813360b795ca7830))

## [1.7.2](https://github.com/recap-utr/arguebuf-typescript/compare/v1.7.1...v1.7.2) (2023-03-01)


### Bug Fixes

* correctly parse protobuf structs ([117935d](https://github.com/recap-utr/arguebuf-typescript/commit/117935d9ec3fda28112a3045398bdab42f76b399))

## [1.7.1](https://github.com/recap-utr/arguebuf-typescript/compare/v1.7.0...v1.7.1) (2023-02-28)


### Bug Fixes

* protobuf import not working for edges ([0200635](https://github.com/recap-utr/arguebuf-typescript/commit/020063520c32a100b367ae505b915b8f0d9c22a1))

## [1.7.0](https://github.com/recap-utr/arguebuf-typescript/compare/v1.6.3...v1.7.0) (2023-02-27)


### Features

* add reference/participant to atom nodes ([fa2fbbe](https://github.com/recap-utr/arguebuf-typescript/commit/fa2fbbe4bcae2adbc8e72e6a66825da1dbdccdff))


### Bug Fixes

* export date from library ([8001996](https://github.com/recap-utr/arguebuf-typescript/commit/8001996c893885f247e58aa2c048e37b418fc83c))

## [1.6.3](https://github.com/recap-utr/arguebuf-typescript/compare/v1.6.2...v1.6.3) (2023-02-27)


### Bug Fixes

* export node label function ([279b29f](https://github.com/recap-utr/arguebuf-typescript/commit/279b29f322c3c5bd458c1624cfef3c37edb3eaa6))

## [1.6.2](https://github.com/recap-utr/arguebuf-typescript/compare/v1.6.1...v1.6.2) (2023-02-26)


### Bug Fixes

* properly export json load/dump ([4e2a1bc](https://github.com/recap-utr/arguebuf-typescript/commit/4e2a1bc95bf2d491b7529ebfaf8df1011c1cfdc4))
* remove readonly annotations fro graph ([1266832](https://github.com/recap-utr/arguebuf-typescript/commit/126683269fe4d59c563051db5e9193e5e7fbee09))
* replace setElements with copy ([b8f68bb](https://github.com/recap-utr/arguebuf-typescript/commit/b8f68bb3983e5a994dacb1f4351abe01b07d0914))

## [1.6.1](https://github.com/recap-utr/arguebuf-typescript/compare/v1.6.0...v1.6.1) (2023-02-25)


### Bug Fixes

* allow dumping of interfaces ([0d0282c](https://github.com/recap-utr/arguebuf-typescript/commit/0d0282c4ebec7bf398d7f99d5d648340e3b65c18))

## [1.6.0](https://github.com/recap-utr/arguebuf-typescript/compare/v1.5.1...v1.6.0) (2023-02-25)


### Features

* add json import/export ([37020cf](https://github.com/recap-utr/arguebuf-typescript/commit/37020cf86e3d539dcd5e98e1e3eaab69d72b0452))
* use node ids instead of objects for edges ([cc13bde](https://github.com/recap-utr/arguebuf-typescript/commit/cc13bdede4598b1f2aa35479828f260bc9f77e3c))


### Bug Fixes

* allow parsing dates from json strings ([0ade6a6](https://github.com/recap-utr/arguebuf-typescript/commit/0ade6a6f13d206286ad5484b975a51abc895a27e))
* overhaul interfaces to simplify them ([e578fde](https://github.com/recap-utr/arguebuf-typescript/commit/e578fdeb8ef4fe3af8e588683a27c55aca0dbbdf))
* properly convert between protobuf/json ([9991fb6](https://github.com/recap-utr/arguebuf-typescript/commit/9991fb68e462a3d55c5ccb77d02b6256bc720010))

## [1.5.1](https://github.com/recap-utr/arguebuf-typescript/compare/v1.5.0...v1.5.1) (2023-02-24)


### Bug Fixes

* update deps ([8f8e1bb](https://github.com/recap-utr/arguebuf-typescript/commit/8f8e1bb9a3551c97f4017291eeccaaa591891bc1))

## [1.5.0](https://github.com/recap-utr/arguebuf-typescript/compare/v1.4.0...v1.5.0) (2023-02-24)


### Features

* add loader for Arg-Tech's OVA v2 ([#17](https://github.com/recap-utr/arguebuf-typescript/issues/17)) ([4196d88](https://github.com/recap-utr/arguebuf-typescript/commit/4196d88224e91eb9296d0cd10ae5a2997912e8af))

## [1.4.0](https://github.com/recap-utr/arguebuf-typescript/compare/v1.3.0...v1.4.0) (2023-02-23)


### Features

* add loader for exports from kialo.com ([#13](https://github.com/recap-utr/arguebuf-typescript/issues/13)) ([5fd3296](https://github.com/recap-utr/arguebuf-typescript/commit/5fd3296919cf49702e4ee553519aeb4f07010c53))

## [1.3.0](https://github.com/recap-utr/arguebuf-typescript/compare/v1.2.0...v1.3.0) (2023-02-07)


### Features

* add loader for argdown files ([#12](https://github.com/recap-utr/arguebuf-typescript/issues/12)) ([c9ed073](https://github.com/recap-utr/arguebuf-typescript/commit/c9ed0735912296d49539e772313d2b58be24b050))

## [1.2.0](https://github.com/recap-utr/arguebuf-typescript/compare/v1.1.0...v1.2.0) (2023-02-06)


### Features

* restructure package ([3f47ca8](https://github.com/recap-utr/arguebuf-typescript/commit/3f47ca8bb1874b5092308f2671155c0f107a25bf))


### Bug Fixes

* update deps ([a4f0ac7](https://github.com/recap-utr/arguebuf-typescript/commit/a4f0ac722b3968b8f9122ff50ab5d68cc1aa2ded))

## [1.1.0](https://github.com/recap-utr/arguebuf-typescript/compare/v1.0.6...v1.1.0) (2023-01-30)


### Features

* add fromProtobuf converter ([#11](https://github.com/recap-utr/arguebuf-typescript/issues/11)) ([d407f6b](https://github.com/recap-utr/arguebuf-typescript/commit/d407f6b9117ada8ef58cb7c5c296c315ca4e9fd9))
* add toProtobuf export feature ([#9](https://github.com/recap-utr/arguebuf-typescript/issues/9)) ([a421670](https://github.com/recap-utr/arguebuf-typescript/commit/a421670933c40590139a5a87370976924454240c))
* use custom model for handling the graph ([84f676f](https://github.com/recap-utr/arguebuf-typescript/commit/84f676f86c219df282b2bc9faf9d2352f00167b5))


### Bug Fixes

* use explicit types for interface/constructor ([025501e](https://github.com/recap-utr/arguebuf-typescript/commit/025501ea3fc3c6fe763003f189041539e5c436c9))
* use scheme type as node label ([9e48016](https://github.com/recap-utr/arguebuf-typescript/commit/9e480168724e8c231d92eaf0020bbc7dcb377763))

## [1.0.6](https://github.com/recap-utr/arguebuf-typescript/compare/v1.0.5...v1.0.6) (2023-01-21)


### Bug Fixes

* export uuid from arg-services ([e303f10](https://github.com/recap-utr/arguebuf-typescript/commit/e303f1081758d092f399c21f84b8280c43593281))

## [1.0.5](https://github.com/recap-utr/arguebuf-typescript/compare/v1.0.4...v1.0.5) (2023-01-21)


### Bug Fixes

* update included files ([5d1f0df](https://github.com/recap-utr/arguebuf-typescript/commit/5d1f0df050b6a7fa2ac41b33328e661a1c0c65b0))

## [1.0.4](https://github.com/recap-utr/arguebuf-typescript/compare/v1.0.3...v1.0.4) (2023-01-21)


### Bug Fixes

* include all files in dist ([59d676b](https://github.com/recap-utr/arguebuf-typescript/commit/59d676b3ccf526bf39b968806812f7d3f964d07b))

## [1.0.3](https://github.com/recap-utr/arguebuf-typescript/compare/v1.0.2...v1.0.3) (2023-01-21)


### Bug Fixes

* add prepack script ([82460ae](https://github.com/recap-utr/arguebuf-typescript/commit/82460ae0eb0cd862bbd97356ff9e97810e88970b))

## [1.0.2](https://github.com/recap-utr/arguebuf-typescript/compare/v1.0.1...v1.0.2) (2023-01-20)


### Bug Fixes

* add readme ([5d5d321](https://github.com/recap-utr/arguebuf-typescript/commit/5d5d32164e15b248a619bd05cb5da7b4f520ff7a))

## [1.0.1](https://github.com/recap-utr/arguebuf-typescript/compare/v1.0.0...v1.0.1) (2023-01-20)


### Bug Fixes

* enable automatic releases ([79a780a](https://github.com/recap-utr/arguebuf-typescript/commit/79a780a77cc77274536f9d04d9957cbbfc0cbdb6))
