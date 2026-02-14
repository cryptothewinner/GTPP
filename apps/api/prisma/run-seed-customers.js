
const { register } = require('ts-node');
register({
    compilerOptions: {
        module: 'commonjs'
    },
    transpileOnly: true
});
require('./seed-customers.ts');
