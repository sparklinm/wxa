module.exports = {
    root: true,
    env: {
        browser: true,
        node: true,
        es6: true,
    },
    parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 2017,
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'google',
    ],
    plugins: ['jest', '@typescript-eslint'],
    rules: {
        'strict': 0,
        'indent': [
            'error',
            4,
            {
                SwitchCase: 1,
                MemberExpression: 1,
                ArrayExpression: 1,
                FunctionDeclaration: {
                    parameters: 'first',
                },
                CallExpression: {
                    arguments: 1,
                },
                ImportDeclaration: 'first',
                ObjectExpression: 1,
            },
        ],
        'linebreak-style': [0, 'error', 'windows'],
        'require-jsdoc': 'off',
        'key-spacing': [
            'error',
            {
                beforeColon: false,
                afterColon: true,
                mode: 'strict',
            },
        ],
        'keyword-spacing': [
            'error',
            {
                before: true,
                after: true,
            },
        ],
        'array-bracket-newline': [
            'error',
            {
                multiline: true,
            },
        ],
        // 'array-element-newline': [
        //   'error',
        //   {
        //     'multiline': true,
        //   }
        // ],
        'object-property-newline': [
            'error',
            {
                allowAllPropertiesOnSameLine: false,
            },
        ],
        'object-curly-newline': [
            'error',
            {
                ObjectExpression: {
                    multiline: true,
                    minProperties: 1,
                },
                ObjectPattern: {
                    multiline: true,
                },
                ImportDeclaration: {
                    multiline: true,
                    minProperties: 4,
                },
                ExportDeclaration: {
                    multiline: true,
                    minProperties: 3,
                },
            },
        ],
        'space-in-parens': ['error', 'never'],
        '@typescript-eslint/indent': ['error', 4],
        '@typescript-eslint/array-type': [
            'error',
            {
                default: 'array-simple',
                readonly: 'array-simple',
            },
        ],
        '@typescript-eslint/ban-types': [
            'warn',
            {
                'types': {
                    // add a custom message to help explain why not to use it
                    'Foo': 'Don\'t use Foo because it is unsafe',

                    // add a custom message, AND tell the plugin how to fix it
                    'String': {
                        'message': 'Use string instead',
                        'fixWith': 'string',
                    },
                    '{}': {
                        'message': 'Use object instead',
                        'fixWith': 'object',
                    },
                },
            },
        ],
        '@typescript-eslint/no-empty-function': ['off'],
        'max-len': 'off',
    },
    globals: {
        'Component': true,
        'wx': true,
    },
};
