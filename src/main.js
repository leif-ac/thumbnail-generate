const CONFIG = {
    font: {
        size: {
            default: {
                value: 1,
                type: 'rem'
            },
        }
    },
    download: { //Resolução atualmente só aceita 16:9
        maxFileSizeBytes: 4 * 1024 * 1024, //Use Infinity para não ter limites. Resultado será sempre em bytes
        width: 1920,
        height: 1920 * (9 / 16),
        format: "image/png"
    }
}

const thumbnailOptions = [
    {
        label: "Default",
        default: true,
        img: "assets/thumbnail-background-v2.png",
    },
    {
        label: "Escuro",
        img: window.base64.dark,
    },
    {
        label: "Lateral",
        img: "assets/thumbnail-lateral.png",
    },
]

function extractText(text) {
    if ( !text ) return [];

    const titles = text.split("\n").map( el => {
        const start = el.split("\\");
        const end = start.pop().split("//");
        return end[0].trim()
    });

    const merge = [];
    let line = [];
    let isMerge = false;

    for ( const el of titles ) {
        if ( el.includes("[[")) {
            line.push( el.split("[[").pop().trim() );
            isMerge = true;

            continue
        }
        
        if ( el.includes("]]") ) {
            line.push( el.split("]]")[0].trim() );
            isMerge = false;
            
            merge.push(line.join("\n"));
            
            line = [];
            continue
        }

        if ( isMerge ) {
            line.push(el);
            continue
        }

        merge.push( el );
    }

    return merge
}

function extractTitles() {
    const arrTitles = [];

    document.querySelectorAll('.thumbnail textarea').forEach( el => arrTitles.push(el.value) )

    return arrTitles
}

function remToPx(value) {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

    return value * rem;
}

function pxToRem(value) {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return value/rem
}

function normalizeString(text) {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function calcFontSize(element) {
    const elParent = element.closest('.thumbnail');
    const containerTitle = elParent.querySelector(".container-title");
    const title = elParent.querySelector("textarea");

    if ( !containerTitle || !title ) throw new Error("Elementos não encontrados");

    const { height: maxHeight, width: maxWidth } = containerTitle.getBoundingClientRect();
    const defaultSize = CONFIG.font.size.default.type === 'rem' ? remToPx(CONFIG.font.size.default.value) : CONFIG.font.size.default.value;

    const minValue = getComputedStyle(title).getPropertyValue("--font-min").trim();
    const maxValue = getComputedStyle(title).getPropertyValue("--font-max").trim();

    const minSize = minValue === 'none' ? Infinity : minValue.endsWith('rem') ? remToPx(parseFloat(minValue)) : parseFloat(minValue);
    const maxSize = maxValue === 'none' ? Infinity : maxValue.endsWith('rem') ? remToPx(parseFloat(maxValue)) : parseFloat(maxValue);
    
    // Quantos caracteres tem por linha e uma estimativa de quantas vezes tem que dividir a linha para caber todo texto 
    const lineBreak = title.value.split("\n").map(el => {
        return Math.ceil((el.split("").length * defaultSize) / maxWidth); // Estimativa de quantas vezes tem que dividir a linha para caber tudo
    });

    const estimatedLines = Math.ceil(lineBreak.reduce((acc, n) => acc + n, 0));

    const multiplier = Math.ceil(maxHeight / (estimatedLines * defaultSize + estimatedLines));
    // console.log({multiplier, estimatedLines, lineBreak})

    let size = Math.max( minSize, Math.min(defaultSize * multiplier, maxSize ));

    title.style.fontSize = `${size}px`;

    while (
        size > minSize &&
        (
            title.scrollHeight > title.clientHeight ||
            title.scrollWidth > title.clientWidth
        )
    ) {
        size = Math.max(minSize, size - 1);
        title.style.fontSize = `${size}px`;
    }
}

/**
 * 
 * @param {Array} titles 
 */
async function insertHtmlTitles() {
    const containerThumbnails = document.querySelector("#container-thumbnails");
    const fieldTitles = document.querySelector("#field-titles");
    const template = document.querySelector("#thumbnail-template");

    if ( !containerThumbnails ) throw new Error("Campo para colocar Thumbnails ausente");
    if ( !fieldTitles ) throw new Error("Textarea com textos ausentes");

    console.log(fieldTitles.value)
    const titles = extractText(fieldTitles.value);
    const optionSelect = findOptionThumbnail();

    containerThumbnails.innerHTML = "";

    for (let i = 0; i < titles.length; i++) {
        const title = titles[i];
        const n = i + 1;
        
        const clone = template.content.cloneNode(true);
        const thumbnail = clone.querySelector('.thumbnail');
        const textarea = thumbnail.querySelector('textarea');
        const index = thumbnail.querySelector('input[type="number"]');
        const img = thumbnail.querySelector("img");
        const containerTitle = thumbnail.querySelector(".container-title")

        textarea.value = title;

        thumbnail.dataset.title = title;
        thumbnail.dataset.index = n;

        index.placeholder = n;

        img.src = optionSelect.img;

        containerTitle.classList.add(`${optionSelect.id}-container`);
        containerTitle.dataset.thumbType = `${optionSelect.id}-container`;

        textarea.classList.add(optionSelect.id);
        textarea.dataset.thumbType = optionSelect.id;

        containerThumbnails.appendChild(clone);
    } 
    
    await Promise.all([
        document.fonts.ready,
        ...Array.from(
            containerThumbnails.querySelectorAll('img'),
            img => img.decode()
        )
    ]);

    for (const element of containerThumbnails.children) {
        const textarea = element.querySelector('textarea');
        calcFontSize(textarea)
    }
}

function calcIndexTitles() {
    const thumbnailContainer = document.querySelector("#container-thumbnails");
    
    let number = 0;
    const arrNumber = [];

    for (let i = 0; i < thumbnailContainer.children.length; i++) {
        const thumbnail = thumbnailContainer.children[i];
        const elementIndex = thumbnail.querySelector('input[type="number"]');
        const elementCheckbox = thumbnail.querySelector('input[type="checkbox"]');
        const index = elementIndex.value !== "" ? Number(elementIndex.value) : Number(number) + 1;

        console.log({
            realIndex: thumbnail.dataset.index,
            elementValue: elementIndex.value,
            index,
            oldNumber: number
        })

        if ( !elementCheckbox.checked ) continue;

        arrNumber.push(Number(index));

        if ( elementIndex.value === "" ) elementIndex.placeholder = index

        number = Number(index)
    }

    const repeats = [ ... new Set (arrNumber.filter((n, i, arr) => {
        return arr.indexOf(n) !== i
    }))];

    if ( repeats.length > 0 ) alert(`Números thumbnails que se repetem: ${repeats}`)
}

function toggleChoiceOption(event) {
    const element = event.target;
    const optionsElement = document.querySelectorAll('.options-thumb');
    const fieldTitles = document.querySelector("#field-titles");

    const optionSelect = element.name;
    const isChecked = element.querySelector('input[type="checkbox"]');

    for (const el of [...optionsElement]) {
        const id = el.id;

        if ( id !== optionSelect ) el.querySelector("input[type='checkbox']").checked = false;
    }

    const newTitles = extractTitles().map(text => {
        if ( text.includes("\n") ) {
            return `[[ ${text} ]]`
        } else {
            return text
        }
    })
    
    fieldTitles.value = newTitles.join('\n')

    insertHtmlTitles()
}

function findOptionThumbnail() {
    const optionsThumb = document.querySelectorAll(".options-thumb");
    const optionChoiceId = [...optionsThumb].filter( element => element.querySelector( "input[type='checkbox']" ).checked )[0]?.id ?? 'default';
    const optionSelect = optionChoiceId === 'default' ? thumbnailOptions.find( el => el.default ) : thumbnailOptions.find( el => normalizeString(el.label) == optionChoiceId );

    return {
        ...optionSelect,
        id: normalizeString(optionSelect.label)
    }
}

/**Baixar Thumbnail */
async function downloadAllThumbnails() {
    const thumbnails = document.querySelectorAll(".thumbnail button");

    for (const button of thumbnails) {
        const isChecked = button.closest('.thumbnail').querySelector('aside input[type="checkbox"]').checked;
        if ( !isChecked ) continue;

        await downloadThumbnail(button)
    }
}

async function downloadThumbnail( button ) {
    const thumbnail = button.closest('.thumbnail');
    const area = thumbnail.querySelector("main");
    const title = thumbnail.querySelector("textarea");

    const selectThumb = findOptionThumbnail();

    await document.fonts.ready;
    await Promise.all( [...area.querySelectorAll("img") ].map(el => el.decode() ));

    const { width, height } = CONFIG.download;
    const areaWidth = area.getBoundingClientRect().width;

    if ( !areaWidth ) throw new Error("A thumbnail não está visível");

    const titleBox = title.getBoundingClientRect();

    const capture = await html2canvas(area, {
        scale: width / areaWidth,
        backgroundColor: null,
        onclone: (doc, cloneArea) => {
            cloneArea.classList.add("thumbnail-export");

            const clonedTitle = cloneArea.querySelector("textarea");
            const text = doc.createElement("div");
            const styles = getComputedStyle(title);

            for (const property of styles) {
                text.style.setProperty(property, styles.getPropertyValue(property));
            }

            text.textContent = title.value;
            text.className = "export-title";
            text.style.width = `${titleBox.width}px`;
            text.style.height = `${titleBox.height}px`;
            text.style.display = "block";
            text.style.boxSizing = "border-box";
            text.style.minHeight = "0";
            text.style.whiteSpace = "pre-wrap";
            text.style.overflowWrap = "break-word";
            text.style.overflow = "visible";

            clonedTitle.replaceWith(text);
        }
    });

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    canvas.getContext("2d").drawImage(
        capture, 0, 0, width, height
    );

    const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, CONFIG.download.format);
    });

    if (!blob) {
        throw new Error("Não foi possível gerar a imagem");
    }

    if (blob.size > CONFIG.download.maxFileSizeBytes) {
        throw new Error("A imagem ultrapassou o tamanho máximo permitido");
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${constructNameThumb({selectThumb, thumbnailElement: thumbnail})}.${CONFIG.download.format.split("/").pop()}`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}



///
/** Adicionar Checkbox de opções */
for (const option of thumbnailOptions) {
    const id = normalizeString(option.label);

    if ( document.querySelector(`#${id}`) ) {
        console.error(`Erro ao tentar criar opção de Thumbnail "${id}" mais de uma vez.`);
        continue
    }
    if ( option.default ) continue;

    const optionsContainer = document.querySelector("#options");
    const template = document.querySelector("#option-checkbox");

    const clone = template.content.cloneNode(true);
    const elementOption = clone.querySelector("label");

    elementOption.querySelector("span").innerHTML = option.label;
    elementOption.id = normalizeString(option.label);
    elementOption.querySelector('input[type="checkbox"]').name = normalizeString(option.label);
    
    optionsContainer.appendChild(clone)

}

/**Executar calcFontSize sempre que mudar tamanho da tela */
let resizeTimer;

window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
        document.querySelectorAll(".thumbnail textarea").forEach(el => calcFontSize(el))
    }, 50)
})
