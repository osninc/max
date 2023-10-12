module.exports = {
    resolve: {
        fallback: {
            zlib: require.resolve("browserify-zlib"),
            os: require.resolve("os-browserify/browser")
        },
    }
}