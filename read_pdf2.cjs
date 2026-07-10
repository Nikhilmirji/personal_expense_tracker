const fs = require('fs');
const pdf = require('pdf-parse');
let dataBuffer = fs.readFileSync('gpay_statement_20260401_20260430.pdf');
pdf(dataBuffer).then(function(data) {
    console.log(data.text.substring(0, 3000));
});
