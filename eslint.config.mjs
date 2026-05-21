import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig([{
    languageOptions: {
        globals: {
            ...globals.node,
        },
    },

    rules: {
        "no-undef": "error",
        "no-unused-vars": ["error", { "caughtErrors": "none" }],
        "eol-last": "error",
        "dot-notation": "error",
        "no-empty": ["error", {
            allowEmptyCatch: true,
        }],
    },
}]);
