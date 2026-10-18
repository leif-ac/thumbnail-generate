const { inlineSource } = require("inline-source");
const postcss = require("postcss");
const postcssImport = require("postcss-import");
const fs = require("node:fs");
const path = require("node:path");

async function build() {
    const root = path.resolve(__dirname, "..");
    const cssPath = path.join(root, "styles/styles.css");

    const result = await postcss([postcssImport()]).process(
        fs.readFileSync(cssPath, "utf8"),
        { from: cssPath }
    );

    let sourceHtml = fs.readFileSync(
        path.join(root, "index.html"),
        "utf8"
    );

    sourceHtml = sourceHtml.replace(
        /<link\b[^>]*href=["']styles\/styles\.css["'][^>]*>/i,
        () => `<style>\n${result.css}\n</style>`
    );

    const license = fs.readFileSync(
        path.join(root, "lib/html2canvas/html2canvas-LICENSE.txt"),
        "utf8"
    );

    sourceHtml = sourceHtml.replace(
        "</head>",
        () => `<!--\nhtml2canvas — MIT\n${license}\n-->\n</head>`
    );

    const html = await inlineSource(sourceHtml, {
        rootpath: root,
        compress: false
    });

    fs.mkdirSync(path.join(root, "dist"), { recursive: true });
    fs.writeFileSync(path.join(root, "dist/index.html"), html);
}

build().catch(error => {
    console.error(error);
    process.exitCode = 1;
});