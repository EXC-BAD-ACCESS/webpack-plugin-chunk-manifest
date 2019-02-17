class ChunkManifest {
  constructor({ filename, transform }) {
    this.filename = filename
    this.options = { transform: transform || (v => v) }
  }

  apply(compiler) {
    compiler.plugin('this-compilation', compilation => {
      const template = compilation.mainTemplate

      template.plugin('require-ensure', (_, c, hash) => {
        const filename = template.outputOptions.chunkFilename || template.outputOptions.filename

        const register = (manifest, chunk) => {
          if (chunk.id in manifest) return manifest

          manifest[chunk.id] = compilation.hooks.assetPath.call(filename, { hash, chunk });

          return chunk.chunkGroup.getChildren().reduce(register, manifest)
        }

        if (filename) {
          const manifest = [c].reduce(register, {})
          const buffer = new Buffer(JSON.stringify(this.options.transform(manifest), null, 2))

          compilation.assets[this.filename] = {
            source () {
              return buffer
            },
            size () {
              return buffer.length
            }
          }
        }

        return _
      })
    })
  }
}

module.exports = ChunkManifest
