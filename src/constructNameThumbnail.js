/**
 * -default: v${version}_${index // com dois números pelo menos}_${title}.${format}
 * -dark: v${version}_DARK_${index // com dois números pelo menos}_${title}.${format}
 * 
 * @param {HTMLElement} thumbnailElement
 * @param { Object } selectThumb 
 * @returns 
 */
function constructNameThumb({ thumbnailElement, selectThumb }) {
    const elementVersion = document.querySelector(".version").querySelector('input[type="number"]');
    const indexElement = thumbnailElement.querySelector("aside input[type='number']");
    
    const version = elementVersion.value !== "" ? elementVersion.value : elementVersion.placeholder;
    const title = thumbnailElement.querySelector("textarea").value;
    const index = indexElement.value !== "" ? indexElement.value : indexElement.placeholder;

    let defaultName = "v" + String(version) + "_" + String(parseFloat(index)).padStart(2, "0") + "_";

    defaultName = defaultName.replace("v1_", "");

    console.log(selectThumb.id)

    switch (selectThumb.id) {
        case "escuro": {
            defaultName += `DARK_${title}`
        } break;
        
        case "lateral": {
            return `LATERAL--${title}`
        } break
    
        default: {
            defaultName += title
        } break;
    }

    return defaultName
}