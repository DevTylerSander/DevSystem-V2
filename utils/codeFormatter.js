const prettier = require('prettier');

async function formatCode(code, language) {
    try {
        // Map language to prettier parser
        const parserMap = {
            'javascript': 'babel',
            'typescript': 'typescript',
            'jsx': 'babel',
            'tsx': 'typescript',
            'json': 'json',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'markdown': 'markdown',
            'yaml': 'yaml',
            'python': 'python',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'csharp': 'csharp',
            'php': 'php',
            'ruby': 'ruby',
            'go': 'go',
            'rust': 'rust'
        };

        const parser = parserMap[language.toLowerCase()] || 'babel';
        
        // Language-specific formatting options
        const formatOptions = {
            parser: parser,
            printWidth: 100,
            tabWidth: 4,
            useTabs: false,
            semi: true,
            singleQuote: true,
            trailingComma: 'es5',
            bracketSpacing: true,
            arrowParens: 'avoid',
            endOfLine: 'lf',
            // Preserve whitespace and newlines
            proseWrap: 'preserve',
            htmlWhitespaceSensitivity: 'css',
            // Language-specific options
            ...(language === 'python' && {
                singleQuote: false,
                quoteProps: 'preserve',
                bracketSameLine: false
            }),
            ...(language === 'html' && {
                htmlWhitespaceSensitivity: 'css',
                bracketSameLine: false
            }),
            ...(language === 'markdown' && {
                proseWrap: 'preserve',
                singleQuote: false
            })
        };

        // For languages that don't need formatting, return as is
        if (['plaintext', 'text'].includes(language.toLowerCase())) {
            return code;
        }

        const formattedCode = await prettier.format(code, formatOptions);
        return formattedCode;
    } catch (error) {
        console.error('Error formatting code:', error);
        // If formatting fails, return the original code with preserved whitespace
        return code;
    }
}

module.exports = { formatCode }; 