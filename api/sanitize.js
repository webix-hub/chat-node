const htmlLess = /</g;
const quote = /"/g;

function safeHTML(input) {
  return (input || "").toString().replace(htmlLess, "&lt;");
}

function safeUrl(input) {
  return (input || "").toString().replace(quote, "");
}

module.exports = { safeHTML, safeUrl };
