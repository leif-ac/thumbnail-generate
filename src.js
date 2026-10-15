/**
 * Impede cliques
 */
function disablePage() {
    document.getElementById('page-overlay').classList.add('active');
}

/**
 * Libera cliques
 */
function enablePage() {
    document.getElementById('page-overlay').classList.remove('active');
}


window.utils = {
    disablePage, 
    enablePage
}


 
 //Listeners

 if(document.querySelector(".thumbnail-text") !== null){
    document.querySelector(".thumbnail-text").addEventListener('paste', (event)=>{
       event.preventDefault();
       
           // Obtém o texto simples
        const plainText = (event.clipboardData || window.clipboardData).getData('text');

        // Insere o texto sem formatação
        document.execCommand('insertText', false, plainText);

    })
}

/*document.querySelector(".input-text-box").addEventListener('paste', (event)=>{
   event.preventDefault();
   
       // Obtém o texto simples
    const plainText = (event.clipboardData || window.clipboardData).getData('text');

    // Insere o texto sem formatação
    document.execCommand('insertText', false, plainText);

})*/
/*----------------------------------*/



/**
 * 
 * @param {*} n 
 */
function adjustFontSize(n) {
    const textElement = document.querySelectorAll('.thumbnail-text')[n];

    textElement.closest(".thumbnail-section").dataset.title = textElement.textContent;

    //textElement.innerText = textElement.innerText

    // Captura a posição atual do scroll
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    const height = 189;
    const width = 841.03;
    const maxFont = 90;
    //console.log(height, width);
    const type = "px";
    let fontSize = parseInt(window.getComputedStyle(textElement).fontSize.replace(type, ""));
    //textElement.style.fontSize = `500${type}`

    const sizes = {
        width: parseInt(window.getComputedStyle(textElement).width.replace("px", "")) || width, 
        height: parseInt(window.getComputedStyle(textElement).height.replace("px", ""))
    }

    //console.log(sizes.height, height)
    //Se a fonte estiver muito pequena, irá aumentar o tamanho da letra até ficar em um tamanho bom
    while (sizes.height < height){
        //console.log('aumenta')
        fontSize += 1

        textElement.style.fontSize = `${fontSize}${type}`

        sizes.height = parseInt(window.getComputedStyle(textElement).height.replace("px", ""))
    }

    console.log(sizes.height, height)
    console.log('-----')
    //Se a fonte estiver grande, irá diminiur até ficar em um tamanho bom

    while (sizes.height > height || fontSize > maxFont){
        //console.log('diminui')

        fontSize += -1

        textElement.style.fontSize = `${fontSize}${type}`

        sizes.height = parseInt(window.getComputedStyle(textElement).height.replace("px", ""))

    }
    //console.log(sizes.height, height)
    console.log('<-- FIM --->')

    // Restaura a posição do scroll
    window.scrollTo(scrollX, scrollY);


}

async function downloadThumbnail(n) {
    const container = document.querySelectorAll('.thumbnail-container')[n]; // A área que será capturada

    let version = document.querySelector(".version-input").value || ""
    if (version == "1") { version = "" }

    if (version !== "") { version = `v${version} - ` }

    container.style.padding = '0px'

    const isDark = document.querySelector(".dark-checkbox").checked;

    const canvas = await html2canvas(container, {
        backgroundColor: null, // Remove qualquer fundo branco adicionado pelo html2canvas
        scale: 2              // Usa o tamanho exato sem redimensionamento
    })

    const link = document.createElement('a');
    const htmlNumber = document.querySelectorAll(".input-thumb-number")[n];
    let number = htmlNumber.value == "" ? htmlNumber.placeholder : htmlNumber.value;

    let name = document.querySelectorAll(".thumbnail-section")[n].dataset.title.replace(":", " -");
    if ( name.split('').pop() === '.' ) { 
        const tempName = name.split('');
        tempName.pop();
        name = tempName.join('');
    }
    link.download = `${version}${isDark ? 'ESCURA - ' : ""}${number.toString().padStart(2, '0')} ${name}.png`; // Nome do arquivo
    link.href = canvas.toDataURL('image/png');
    link.click(); // Simula o clique para baixar

    container.style.padding = '20px'
}

async function downloadThumbnails(){
    const arrayThumbs = document.querySelectorAll(".thumbnail-section");

    //console.log(arrayThumbs)
    for (let i = 0; i < arrayThumbs.length; i++) {
        if (document.querySelectorAll(".input-thumb-check")[i].checked) {
            await downloadThumbnail(i);

            await new Promise(resolve => setTimeout(resolve, 100))
        }
    }
}

async function pre_insertHTML() {
    window.utils.disablePage(); // Desativa a interação da página
    const acc = document.querySelector(".box-content");

    // Aguarda o conteúdo ser gerado
    let div = await insertHTML();

    // Atualiza o conteúdo da página
    acc.innerHTML = div.innerHTML;
}


async function insertHTML() {
    const acc = document.querySelector(".box-content");
    const oldContent = document.querySelector(".input-text-box").value;
    acc.innerHTML = "";

    const text = document.querySelector(".input-text-box").value.trim();

    // Separar parágrafos
    let arrayTitles = text.split("\n").filter(el => el !== "");
    let arrayTitlesOld = oldContent.split("\n").filter(el => el !== "");

    // Processar títulos
    arrayTitles = arrayTitles.map(el => {
        if(el.includes("//")){el = el.split("//")[0]}
        let arrayTemp = el.split("\\").filter(item => item !== "");
        let value = arrayTemp.length > 2 ? arrayTemp[arrayTemp.length - 2] : arrayTemp[0];
        if(arrayTemp[2] == undefined && arrayTemp.length >= 2){value = arrayTemp[1]}
        value = changeAspas(value)
        return value
    });

    const div = document.createElement("div");

    // Gerar HTML
    for (let i = 0; i < arrayTitles.length; i++) {
        const paths = {
            default: './assets/thumbnail-background-v2.png',
            dark: './assets/thumbnail-background-dark.png'
        };

        const img = document.querySelector('.dark-checkbox').checked
            ? paths.dark
            : paths.default;
        
        const html = `
            <section class="thumbnail-section" data-number="${i}" data-title="${arrayTitles[i]}">
                <aside class="thumbnail-option">
                    <div class="thumbnail-number">
                        <input class="input-thumb-check" type="checkbox" checked oninput="trashThumb(${i})">
                        <input class="input-thumb-number" placeholder="${i + 1}" type="number" oninput="changePlaceholder(${i})">
                    </div>
                    <div class="thumbnail-container">
                        <img class="thumbnail-img" src="${img}" alt="thumbnail">
                        <div class="thumbnail-text-container">
                            <span class="thumbnail-text" contenteditable="true" oninput="adjustFontSize(${i})">${arrayTitles[i].trim()}</span>
                        </div>
                    </div>
                </aside>
                <aside class="aside-button">
                    <button class="download-button" onclick="downloadThumbnail(${i})">
                        Baixar Thumbnail
                    </button>
                </aside>
            </section>
        `;
        div.innerHTML += html;
    }

    // Ajustar cada linha com atraso
    //console.log(arrayTitles.length == 0 )
    for (let i = 0; i < arrayTitles.length; i++) {
        setTimeout(() => {
            adjustFontSize(i);
        }, i * 10); // Define o atraso de 10ms entre as execuções;

        if(i == arrayTitles.length - 1){

            console.log(arrayTitles.length)
            window.utils.enablePage()
        }
    }

    if(arrayTitles.length == 0){
        window.utils.enablePage()
    }
    

    //Atualizar o conteúdo após os ajustes
    return div
}

function changePlaceholder(n, changeValue){
    const arrayInput = document.querySelectorAll(".input-thumb-number");

    let currentValue = arrayInput[n].value == "" ? arrayInput[n].placeholder : arrayInput[n].value;
    currentValue = parseInt(currentValue)

    if(changeValue !== undefined){
        currentValue = changeValue;
        currentValue = parseInt(currentValue);
    } else {
        currentValue ++
    }

    //console.log(arrayInput)
    for (let i = n + 1; i < arrayInput.length; i++) {
        arrayInput[i].placeholder = parseInt(currentValue)

        if(document.querySelectorAll(".input-thumb-check")[i].checked){
            currentValue ++
        }
    }
}

//Não baixar estas thumbs
function trashThumb(n){
    const checkbox = document.querySelectorAll(".input-thumb-check")[n];
    const numberInput = document.querySelectorAll(".input-thumb-number")[n];
    let number = numberInput.value == "" ? numberInput.placeholder : numberInput.value
    //console.log(checkbox.checked, n, parseInt(number))

    if(!checkbox.checked){
        changePlaceholder(n, parseInt(number))
    } else {
        changePlaceholder(n, parseInt(number) + 1)
    }
}

/** Função para aumentar a altura da text area se o texto for muito grande
 * 
 * @param {*} textarea 
 */
function autoResize(textarea) {
    textarea.style.height = "auto"; // Redefine a altura para recalcular
    textarea.style.height = `${textarea.scrollHeight}px`; // Define a altura com base no scrollHeight
}

/*Mudar aspas para adaptar entrada e saida*/
function changeAspas(text){
    let arrayText = text.split("");
    let newText = "";

    
    for(i = 0; i < arrayText.length; i++){
        let el = arrayText[i];
        let next = arrayText[i+1];
        let old = arrayText[i-1];
        
        if(el == '"'){
            el = '”'

            if(old == " " || old == undefined){
                el = '“' 
            }
        }

        if(el == "'"){
            el = "’"
            
            if(old == " " || old == undefined){
                el = "‘"
            }
        }

        newText += el
    }

    console.log(newText)
    return newText
}




document.addEventListener("DOMContentLoaded", async ()=>{
    const param = new URLSearchParams(window.location.search);
    const text = param.get("text");
    console.log(param, text)
    
    if(text){
        console.log(document.querySelector(".input-text-box"))
        document.querySelector(".input-text-box").value = text
        await pre_insertHTML()
        autoResize(document.querySelector(".input-text-box"))
    }
})
