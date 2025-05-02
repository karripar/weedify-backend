module.exports = {
    apps: [
        {
            name: 'auth',
            script: './auth-server/dist/index.js',
            env: {
                PORT: 3001,
                NODE_ENV: 'production',
            },
        },
        {
            name: 'content',
            script: './content-server/dist/index.js',
            env: {
                PORT: 3002,
                NODE_ENV: 'production',
            },
        },
        {
            name: 'upload',
            script: './upload-server/dist/index.js',
            env: {
                PORT: 3003,
                NODE_ENV: 'production',
            },
        },
    ],
};
