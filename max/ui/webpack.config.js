module.exports = {
    resolve: {
        fallback: {
            assert: false,
            crypto: false,
            os: false,
            path: false,
            zlib: false,
            stream: false,
            buffer: false,
            url: false,
            http: false,
            https: false,
            process: false,
            
        },
    },
};