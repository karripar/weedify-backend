module.exports = {
    apps: [
        {
            name: 'auth',
            script: './auth-server/src/index.ts',
            interpreter: "node",
            autorestart: true,
            env: {
                PORT: 3001,
                NODE_ENV: 'production',
            },
        },
        {
            name: 'content',
            script: './content-server/src/index.ts',
            interpreter: "node",
            autorestart: true,
            env: {
                PORT: 3002,
                NODE_ENV: 'production',
            },
        },
        {
            name: 'upload',
            script: './upload-server/src/index.ts',
            interpreter: "node",
            autorestart: true,
            env: {
                PORT: 3003,
                NODE_ENV: 'production',
            },
        },
    ],
};
