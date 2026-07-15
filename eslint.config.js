import js from "@eslint/js";
import globals from "globals";

export default [
    js.configs.recommended,
    {
        ignores: ["src/vendor/**"]
    },
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.amd,
                ...globals.es2015
            }
        },
        rules: {
            "linebreak-style": ["error", "unix"],
            "semi": ["error", "always"],
            "no-empty": ["error", { "allowEmptyCatch": true }],
            "no-unused-vars": ["warn", { "varsIgnorePattern": "^_", "argsIgnorePattern": "^_", "caughtErrors": "none" }]
        }
    }
];
