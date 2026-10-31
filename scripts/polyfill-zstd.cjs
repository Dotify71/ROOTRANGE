const zlib = require('node:zlib');
if (!zlib.createZstdDecompress) {
  zlib.createZstdDecompress = function() {
    return new (require('node:stream').Transform)();
  };
}
if (!zlib.constants.ZSTD_d_windowLogMax) {
  zlib.constants.ZSTD_d_windowLogMax = 100;
}
