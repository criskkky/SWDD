// ==UserScript==

// @name                SWDD - Steam Workshop Description Downloader
// @namespace           SWDD
// @version             1.0.0
// @description         Adds buttons to download workshop descriptions in .MD and .BBCode format on Steam Workshop.
// @description:en      Adds buttons to download workshop descriptions in .MD and .BBCode format on Steam Workshop.
// @description:es      Añade botones para descargar descripciones de la workshop de Steam en formato .MD y .BBCode.

// @author              https://criskkky.carrd.co/
// @updateURL           https://github.com/criskkky/SWDD
// @downloadURL         https://github.com/criskkky/SWDD
// @supportURL          https://github.com/criskkky/SWDD/issues
// @homepageURL         https://github.com/criskkky/SWDD
// @icon                https://raw.githubusercontent.com/criskkky/criskkky.github.io/main/media/icons/swdd.png

// @grant               none
// @match               https://steamcommunity.com/sharedfiles/filedetails/*
// ==/UserScript==

/* <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!>
BEFORE USING THIS SCRIPT, YOU MUST KNOW THAT:
  ✗ Unsupported:
  -> Tables
  -> Noparse

  ⌾ May be unaccurate:
  -> Blockquotes

ANYWAYS, YOU CAN HELP ME IMPROVE THIS SCRIPT BY DOING A PULL REQUEST
OR OPENING AN ISSUE ON GITHUB (https://github.com/criskkky/SWDD) :D
AVOID USING OFUSCATED CODE, PLEASE, OR YOUR PR WILL BE REJECTED. THANKS!
*/

// Function to download content as a file
function downloadContent(content, fileName) {
  var blob = new Blob([content], { type: 'text/plain' });
  var link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
}

function getDescription() {
  var descriptionElement = document.querySelector('.workshopItemDescription');
  if (descriptionElement) {
    // Get the HTML content of the description
    var descriptionHTML = descriptionElement.innerHTML;

    return descriptionHTML;
  }
  return null;
}

function getHTMLtoBBC(descriptionHTML) {
  // Custom replacements for Steam HTML to BBCode conversion
  var bbReplacements = {
    // Essential
    '<br>': '\n',
    '<span>([\\s\\S]*?)<\/span>': '$1',
    // Headers
    '<div class="bb_h1">([^<]+)<\/div>': '[h1]$1[/h1]\n',
    '<div class="bb_h2">([^<]+)<\/div>': '[h2]$1[/h2]\n',
    '<div class="bb_h3">([^<]+)<\/div>': '[h3]$1[/h3]\n',
    // Font styling
    '<b>([\\s\\S]*?)<\/b>': '[b]$1[/b]',
    '<u>([\\s\\S]*?)<\/u>': '[u]$1[/u]',
    '<i>([\\s\\S]*?)<\/i>': '[i]$1[/i]',
    // Font formatting
    '<span class="bb_strike">([\\s\\S]*?)<\/span>': '[strike]$1[/strike]',
    '<span class="bb_spoiler">([\\s\\S]*?)<\/span>': '[spoiler]$1[/spoiler]',
    '<a[^>]*class="bb_link"[^>]*href="([^"]+)"(?:[^>]*target="([^"]+)")?(?:[^>]*rel="([^"]+)")?[^>]*>([\\s\\S]*?)<\/a>': '[url=$1]$4[/url]',
    // Lists
    '<ul class="bb_ul">([\\s\\S]*?)<\/ul>': '\n[list]\n$1\n[/list]',
    '<li>([\\s\\S]*?)<\/li>': '[*]$1',
    '<ol>([\\s\\S]*?)<\/ol>': '\n[olist]\n$1\n[/olist]',
    // +Font formatting
    '<div class="bb_code">([\\s\\S]*?)<\/div>': '\n[code]\n$1[/code]\n',
    // TODO: Fix noparse. It's not working properly. Do PR if you can fix it.
    // TODO: Fix bb_table. It's not working properly. Do PR if you can fix it.
    '<div class="bb_table_tr">([\\s\\S]*?)<\/div>': '\n[tr]\n$1\n[/tr]\n',
    '<div class="bb_table_th">([\\s\\S]*?)<\/div>': '[th]$1[/th]',
    '<div class="bb_table_td">([\\s\\S]*?)<\/div>': '[td]$1[/td]',
    // Images
    '<img src="([^"]+)"[^>]*>': '[img]$1[/img]',
    // Others
    '<hr>': '[hr]',
    '<blockquote class="bb_blockquote">([\\s\\S]*?)</blockquote>' : '[quote]$1[/quote]',
  };

  // Apply custom replacements
  for (var pattern in bbReplacements) {
    var regex = new RegExp(pattern, 'gi');
    descriptionHTML = descriptionHTML.replace(regex, bbReplacements[pattern]);
  }

  // Clear unsupported tags
  descriptionHTML = descriptionHTML.replace(/<(?!\/?(h1|h2|h3|b|u|i|strike|spoiler|ul|li|ol|code|tr|th|td|img|hr|blockquote|\/blockquote))[^>]+>/g, '');

  var bbcodeContent = descriptionHTML;

  return bbcodeContent;
}

function getHTMLtoMD(descriptionHTML) {
  // Custom replacements for Steam HTML to Markdown conversion
  // Didn't used turndown because it doesn't support some tags
  var mdReplacements = {
    // Essential
    '<br>': '\n',
    '<span>([\\s\\S]*?)<\/span>': '$1',
    // Headers
    '<div class="bb_h1">([\\s\\S]*?)<\/div>': '# $1\n',
    '<div class="bb_h2">([\\s\\S]*?)<\/div>': '## $1\n',
    '<div class="bb_h3">([\\s\\S]*?)<\/div>': '### $1\n',
    // Font styling
    '<b>([\\s\\S]*?)<\/b>': '**$1**',
    '<u>([\\s\\S]*?)<\/u>': '__$1__',
    '<i>([\\s\\S]*?)<\/i>': '*$1*',
    // Font formatting
    '<span class="bb_strike">([\\s\\S]*?)<\/span>': '~~$1~~',
    '<span class="bb_spoiler">([\\s\\S]*?)<\/span>': '<details><summary>Spoiler</summary>$1</details>',
    '<a[^>]*class="bb_link"[^>]*href="([^"]+)"(?:[^>]*target="([^"]+)")?(?:[^>]*rel="([^"]+)")?[^>]*>([\\s\\S]*?)<\/a>': '[$4]($1)',
    // Lists
    '<li>([\\s\\S]*?)<\/li>': '* $1',
    '<ol>([\\s\\S]*?)<\/ol>': (match, p1, offset, string) => {
      const lines = p1.trim().split('\n');
      let currentIndex = 1;
    
      const formattedLines = lines.map((line, index) => {
        // Check if the current line starts a new ordered list
        const isNewList = line.trim().startsWith('<li>');
    
        // If it's a new list, reset currentIndex to 1
        if (isNewList) {
          currentIndex = 1;
        }
    
        // Replace asterisks (*) or hyphens (-) with incremental numbers
        return line.replace(/^\s*[\*\-]/, () => {
          const updatedNumber = currentIndex++;
          return `${updatedNumber}.`;
        });
      });
    
      return `<ol>\n${formattedLines.join('\n')}\n</ol>`;
    },        
    // +Font formatting
    '<div class="bb_code">([\\s\\S]*?)<\/div>': '\n```\n$1\n```\n',
    // TODO: Fix noparse. It's not working properly. Do PR if you can fix it.
    // TODO: Fix bb_table. It's not working properly. Do PR if you can fix it.
    // TODO: Fix bb_table_tr. It's not working properly. Do PR if you can fix it.
    // TODO: Fix bb_table_th. It's not working properly. Do PR if you can fix it.
    // TODO: Fix bb_table_td. It's not working properly. Do PR if you can fix it.
    // Images
    '<img src="([^"]+)"[^>]*>': '![image]($1)',
    // Others
    '<hr>': '---',
    '<blockquote class="bb_blockquote">([\\s\\S]*?)</blockquote>' : '> $1',
  };

  // Apply custom replacements
  for (var pattern in mdReplacements) {
    var regex = new RegExp(pattern, 'gi');
    descriptionHTML = descriptionHTML.replace(regex, mdReplacements[pattern]);
  }

  // Clear unsupported tags except for <details><summary>Spoiler</summary>$1</details>
  descriptionHTML = descriptionHTML.replace(/<(?!details><summary>Spoiler<\/summary>\$1<\/details>)[^>]+>/g, '');

  var markdownContent = descriptionHTML;

  return markdownContent;
}

function insertButton(downloadButton) {
  var fixedMargin = document.querySelector('.game_area_purchase_margin');
  if (fixedMargin) {
    // Better alignment ...
    fixedMargin.style.marginBottom = 'auto';
    // Find the element after which the button should be inserted
    var targetElement = document.querySelector('.workshopItemDescription');
    if (targetElement) {
      // Insert the button after the target element
      targetElement.parentNode.insertBefore(downloadButton, targetElement.nextSibling);
    }
  }
}

// Create the download button for Markdown
function createDownloadButtonMD() {
  var downloadButton = document.createElement('button');
  downloadButton.innerHTML = '<img src="https://raw.githubusercontent.com/criskkky/criskkky.github.io/main/media/icons/cloud-download-white.svg" style="vertical-align: middle; margin-right: 5px; max-width: 20px; max-height: 20px;">Download .MD';
  downloadButton.classList.add('btn_green_white_innerfade', 'btn_border_2px', 'btn_medium');
  downloadButton.style.marginBottom = '5px';
  downloadButton.style.marginRight = '5px';
  downloadButton.style.padding = '5px 10px';
  downloadButton.addEventListener('click', function () {
    var markdownContent = getHTMLtoMD(getDescription());
    if (markdownContent) {
      downloadContent(markdownContent, 'WorkshopDownload.md');
    } else {
      alert('No content found in Markdown format.');
    }
  });

  insertButton(downloadButton);
}

// Create the download button for BBCode
function createDownloadButtonBBC() {
  var downloadButton = document.createElement('button');
  downloadButton.innerHTML = '<img src="https://raw.githubusercontent.com/criskkky/criskkky.github.io/main/media/icons/cloud-download-white.svg" style="vertical-align: middle; margin-right: 5px; max-width: 20px; max-height: 20px;">Download .BBCode';
  downloadButton.classList.add('btn_green_white_innerfade', 'btn_border_2px', 'btn_medium');
  downloadButton.style.marginBottom = '5px';
  downloadButton.style.marginRight = '5px';
  downloadButton.style.padding = '5px 10px';
  downloadButton.addEventListener('click', function () {
    var bbcodeContent = getHTMLtoBBC(getDescription());
    if (bbcodeContent) {
      downloadContent(bbcodeContent, 'WorkshopDownload.bbcode');
    } else {
      alert('No content found in BBCode format.');
    }
  });

  insertButton(downloadButton);
}

// Execute the functions when the page loads
window.addEventListener('load', function () {
  createDownloadButtonMD();
  createDownloadButtonBBC();
});