const loadingToast = createToast("One Moment Please!", -1);
const urlInp = document.getElementById("url");
const getLinksBtn = document.getElementById("get-links-btn");
const resultsDiv = document.getElementById("results");
const copyLinksBtn = document.getElementById("copy-links");
const checkAllCheckbox = document.getElementById("check-all");
const checkAllLabel = document.getElementById("check-all-label");
const filterLabel = document.getElementById("filter-label");
const filterInp = document.getElementById("filter");
const imagesCheckbox = document.getElementById("images-checkbox")
const hyperlinksCheckbox = document.getElementById("hyperlinks-checkbox")

// const PROXY_URL = "/link-scraper/api/index.php";
const PROXY_URL = "./api/index.php"

getLinksBtn.addEventListener("click", onGetUrlClick);
checkAllCheckbox.addEventListener("click", onCheckAllClick);
copyLinksBtn.addEventListener("click", onCopyLinksClick);
filterInp.addEventListener("input", onFilterInputChange);

/*
* Sends a POST request to the backend which will then send a GET request to given URL
* @returns 
*/
async function getPageData(){
    // Show loading toast...
    loadingToast.showToast();
    // Clear previous results
    clearPreviousResults();
    // Send post request with the URL to the backend proxy
    return await axios.post(PROXY_URL, {
        url: urlInp.value.trim()
    }) // Once it finished, return the data
    .then((response) => response.data)
    .catch((error) => { // Handle any errors
        // Start by setting generic text
        let errorText = "An error occurred";
        // Code 400 is a Bad Request, so change the text to reflect that
        if(error.response.data.status === 400){
            // Bad Request
            errorText = "Please provide a valid URL"
        }
        // Create and show a toast with the error text inside
        createToast(errorText, 5000).showToast();
    });
};

/**
 * Parse through the requested page and display the results
 * @param {*} data - the html from the requested url
 */
async function parsePageData(data){
    // Parse the html
    const html = $.parseHTML( data );
    let links, srcs
    let tag = {
        name: "",
        attr: ""
    }
    if(hyperlinksCheckbox.checked){
        // change tag values => <a> tag
        tag.name = "a", tag.attr = "href"
        // set links
        links = getLinksFromHTML(html, tag)
        // display them on the page
        displayLinks(links, "Hyperlinks");
    }
    if(imagesCheckbox.checked){
        // change tag values => <img> tag
        tag.name = "img", tag.attr = "src"
        // set srcs
        srcs = getLinksFromHTML(html, tag)
        // display them on the page
        displayLinks(srcs, "Images")
    }
}








/**
 * Fires when Get Links button is clicked.
 * @param {Event} e 
 */
function onGetUrlClick(e){
    // prevent any default actions
    e.preventDefault();
    // toggle the form state 
    toggleResultFormState(false);
    // Get data from the inputted URL
    getPageData() // Once the request finished, parse the page data
    .then((pageData) => parsePageData(pageData))
    .catch((error) => { // Handle any errors
        // Generic error response...
        const errorText = "An error occurred";
        createToast(errorText, 5000).showToast();
        console.log(error);
        throw new Error(error);
    })
    // finally, hide the loading toast
    .finally(() => loadingToast.hideToast());
}

/**
 * Fires when the Check All button is clicked
 * @param {Event} e 
 */
function onCheckAllClick(e){
    // Loop over every element with attribute name="links"
    $('[name="links"]').each((index, value) => {
        // Ignore any links that are currently invisible/hidden
        if($(value).parent().css("display") !== "none"){
            if(e.currentTarget.checked){
                // If checked, then all links should be checked as well
                value.checked = true;
            }
            else{
                // if unchecked, all links shouldnt be checked
                value.checked = false;
            }
        }
    });
}

/**
 * Fires when the Copy Links button is clicked
 * @param {Event} e 
 */
function onCopyLinksClick(e){
    // Prevent any default actions
    e.preventDefault();
    // Set links array
    let links = [];
    // Get text value of every element with the attribute name="links" and add that text to the links array above
    $('input[name="links"]:checked').each((index, value) => {
        links.push($(value).parent().text());
    });
    // Take each element in the array and combine it so that each link is on its own line
    let textToCopy = links.join("\n");
    // Copy the links text to the clipboard
    navigator.clipboard.writeText(textToCopy);
    // Create and show toast displaying how many links were copied
    createToast("Copied " + links.length + " link(s)", 3000).showToast();
}

/**
 * Fires when the search input changes
 * @param {Event} e 
 */
function onFilterInputChange(e){
    // Loop through each link and only display the ones that match the search filter, highlighting the matched search
    $('.link').each((index, value) => {
        // First, remove any existing "mark" (highlight)
        $(value).unmark();
        // If link includes the current value of the search input
        if(value.textContent.includes(e.currentTarget.value)){
            // Create new mark using the link as a container
            const mark = new Mark(value);
            // Mark/highlight the link where the text is equal to the current search input
            mark.mark(e.currentTarget.value);
            // Display the link
            $(value).show();
        }
        else{
            // If link doesnt contain filter text, hide the element
            $(value).hide();
        }
    });
}









/* HELPER FUNCTIONS */

/**
 * Clears the #results div of all content
 */
function clearPreviousResults(){
    $(resultsDiv).empty();
}

/**
 * Displays the links found on the page
 * @param {Array} arr - the array of links
 * @param {String} title - The title text to put in the h2
 */
function displayLinks(arr, title){
    // display section title
    $(`<h2 class="mt-4">${title}</h2>`).appendTo(resultsDiv);
    // If there were no links found, display message
    if(arr.length === 0){
        $(`<div class="text-center fs-2">Not Found</div>`).appendTo(resultsDiv);
    }
    else{
        toggleResultFormState(true);
        const div = $('<div>', {
            class: 'list-group'
        });
        arr.forEach(link => {
            $(`<label class="list-group-item link"><input type="checkbox" name="links" class="form-check-input me-1" value="" /><span class="mx-3">${link}</span></label>`).appendTo(div);
        });
        div.appendTo(resultsDiv);
    }
}

/**
 * Toggles various styles and states based on the boolean value passed.
 * @param {Boolean} active true if the form needs to be changed to active, false otherwise
 */
function toggleResultFormState(active = true){
    if(active){
        // Need to change state to active
        copyLinksBtn.disabled = false;
        checkAllCheckbox.disabled = false;
        checkAllLabel.classList.remove("text-muted");
        filterLabel.classList.remove("text-muted","bg-white");
        filterInp.disabled = false;
    }
    else{
        // Need to change state to disabled
        copyLinksBtn.disabled = true;
        checkAllCheckbox.disabled = true;
        checkAllLabel.classList.add("text-muted");
        filterLabel.classList.add("text-muted","bg-white");
        filterInp.disabled = true;
    }
}

/**
 * Get all the unique, valid links from the html given a tag name and an attribute
 * @param {*} html - The html returned from JQuerys parseHTML()
 * @param {*} tag - An object representing a tag, with properties "name" and "attr"
 * tag = { name: "a", attr: "src" }
 * @returns {Array} - an array of links (strings)
 */
function getLinksFromHTML(html, tag){
    // Get all the tags from the parsed html
    const tags = $(html).find(tag.name);
    // From all the tags, return the value of the provided attribute
    const links = $.map(tags, function (value, index) {
        return $(value).attr(tag.attr)
    });
    // Filter the array to drop any links that arent useful (null, #id)
    const validLinks = links.filter(link => {
        // Check if link is not empty and make sure it is not an id
        if(link && !link.startsWith("#")){
            return link;
        }
    });
    // Remove all duplicate links from the array by converting to set
    let validUniqueLinks = Array.from(new Set(validLinks));
    // Convert all the relative links to absolute links
    const finalLinks = $.map(validUniqueLinks, function (value, index) {
        // If it already starts with http, assume the link is already absolute
        if(value.startsWith("https://") || value.startsWith("http://")){
            return value;
        }
        else{
            // Create URL from what we inputted
            const url = new URL(urlInp.value.trim());
            // Get the beginning part of the URL (https://example.com)
            let prefix = url.origin;
            // Now we combine the prefix to the relative URL to make an abosolute URL,
            // First, handle the double slash situation (https://example.com//relative)
            if(prefix.endsWith("/") && value.startsWith("/")){
                // remove last character (/) in prefix so there is no double slash
                // https://example.com//relative => https://example.com/relative
                prefix = prefix.slice(0, -1);
            }
            // Second, handle the no slash situation (https://example.comrelative)
            else if(!prefix.endsWith("/") && !value.startsWith("/")){
                // Adding "/" to the end of the prefix
                // https://example.comrelative => https://example.com/relative
                prefix = prefix + "/";
            }
            // https://example.com + /relative
            return prefix + value;
        }
    });
    return finalLinks
}

/**
 * Creates a toast to be displayed at the bottom center of the screen
 * @param {string} message the message to display in the toast
 * @param {number} duration the duration in milliseconds that the toast should be displayed (-1 for infinite)
 * @returns {Toastify} a new toast
 */
function createToast(message, duration = 3000){
    return Toastify({
        text: message,
        duration: duration,
        gravity: "bottom",
        position: "center",
        stopOnFocus: "false",
    });
}