import PDFDocument from "pdfkit-table"
import fs from 'fs'


const basefont = "Montserrat"

const generateInvoice = async (invoice) => {
    const { invoiceNumber, customerName, customerAddress, paymentTermDays, lines } = invoice

    console.log(`>> Generating invoice document for ${invoiceNumber}`)

    const doc = new PDFDocument({ 
        margin: 50, 
        size: 'A4',
        font: `assets/${basefont}-Thin.ttf`,
        info: {
            Title: `Factuur ${invoiceNumber}`,
            Author: "Goodgrid",
            Subject: "Factuur",
        },
        fillColor: "#36599B"
    });
    

    const detailsTable = { 
        headers: [
            {
                label: "Item",
                width: 180
            }, 
            {
                label: "Aantal",
                width: 50
            }, 
            {
                label: "Prijs",
                width: 80,
                renderer: (value, indexColumn, indexRow, row, rectRow, rectCell) => getCurrency(value)
            }, 
            {
                label: "BTW",
                width: 50,
                renderer: (value, indexColumn, indexRow, row, rectRow, rectCell) => getVATString(value)
            }, 
            {
                label: "Totaal excl. BTW",
                width: 80,
                renderer: (value, indexColumn, indexRow, row, rectRow, rectCell) => getCurrency(value)
            }
        ], 
        rows: calulateLines(lines)
    }

    const summaryTable = { 
        headers: [
            {
                property: "subtotal",
                label: "Subtotaal",
                width: 70,
                headerColor: "white",
                renderer: (value, indexColumn, indexRow, row, rectRow, rectCell) => getCurrency(value)
            },{
                property: "vat",
                label: "BTW",
                width: 50,
                headerColor: "white",
                renderer: (value, indexColumn, indexRow, row, rectRow, rectCell) => getCurrency(value)
            }, {
                property: "grandtotal",
                label: "Totaal incl. BTW",
                width: 150,
                headerColor: "white",
                renderer: (value, indexColumn, indexRow, row, rectRow, rectCell) => getCurrency(value)
            }
        ], 
        rows: getSummary(lines),
    }


    doc.font(`assets/${basefont}-Bold.ttf`).fontSize("18").fillColor("#36599B")
    doc.text(`Factuur ${invoiceNumber}`)
        
    doc.image('assets/Goodgrid_logo_CMYK_horizontal_right_blue.png',380, 40, {width: 180})
        
    doc.font(`assets/${basefont}-Thin.ttf`).fontSize("10").fillColor("#36599B")
    doc.text(`${customerName}\r${customerAddress}`,50,150)
    doc.text(`Factuurdatum: ${getDutchDate()}\rVervaldatum: ${getDutchDate(paymentTermDays)}`,380,150)


    await doc.table(detailsTable,{
        width: 800,
        x: 50,
        y: 300,
        padding: 5,
        prepareHeader: () => doc.font(`assets/${basefont}-Thin.ttf`).fontSize(6),
        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
            doc.font(`assets/${basefont}-Thin.ttf`).fontSize(8)
        }
    })

    await doc.table(summaryTable,{
        width: 350,
        x: 300,
        padding: 5,
        prepareHeader: () => doc.font(`assets/${basefont}-Bold.ttf`).fontSize(6),
        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
            if (indexColumn + 1 == row.length) {
                doc.font(`assets/${basefont}-Bold.ttf`).fontSize(12)
            } else {
                doc.font(`assets/${basefont}-Thin.ttf`).fontSize(8)
            }
        },
        divider: {
            header: { disabled: true },
            horizontal: { disabled: true },
        }
    })


    doc.font(`assets/${basefont}-Thin.ttf`).fontSize(10)
    doc.text("We verzoeken u vriendelijk het bovenstaande bedrag voor de genoemde vervaldatum te voldoen op onze bankrekening onder vermelding van het factuurnummer.",50,500)

    doc.font(`assets/${basefont}-Thin.ttf`).fontSize(10)
    doc.text("Goodgrid (Koen Bonnet B.V.)\rGeorges Braquehof 9\r3544KE Utrecht",50,730)
    doc.text("Tel: +31(0)848735177\rE-mail: info@goodgrid.nl\rWebsite: https://www.goodgrid.nl",210,730)
    doc.text("KVK: 56895747\rBTW-id: NL852351628B01\rIBAN: NL86TRIO0784815208\rBIC: TRIONL2U",400,730)

    
    let buffers = []
    doc.on("data", data => {
        
        buffers.push(data)
    })

    doc.on("end", () => {
        return fs.writeFileSync(`Documents/Factuur ${invoiceNumber}.pdf`, Buffer.concat(buffers))
    })

    doc.end()

}  

const generateTimesheet = async (invoice) => {
    const { invoiceNumber, period, customerName, customerAddress, lines } = invoice

    console.log(`>> Generating timesheet for ${invoiceNumber}`)

    const doc = new PDFDocument({ 
        margin: 50, 
        size: 'A4',
        font: `assets/${basefont}-Thin.ttf`,
        info: {
            Title: `Specificatie bij factuur ${invoiceNumber}`,
            Author: "Goodgrid",
            Subject: "Specificatie",
        },
        fillColor: "#36599B"
    });


    const timesheetTable = { 
        headers: [
            {
                label: "Datum",
                width: 60
            }, 
            {
                label: "Project",
                width: 150
            }, 
            {
                label: "Uren",
                width: 30,
                
            }, 
            {
                label: "Omschrijving",
                width: 250,
                
            }
        ], 
        rows: lines
    }


    doc.font(`assets/${basefont}-Bold.ttf`).fontSize("18").fillColor("#36599B")
    doc.text(`Specificatie`)
        
    doc.image('assets/Goodgrid_logo_CMYK_horizontal_right_blue.png',380, 40, {width: 180})
        
    doc.font(`assets/${basefont}-Thin.ttf`).fontSize("10").fillColor("#36599B")
    doc.text(`${customerName}`,50,150)

    doc.text(`Behorend bij factuur ${invoiceNumber}`,300,150)
    doc.text(`Periode: ${period}`,300,165)
    

    await doc.table(timesheetTable,{
        width: 800,
        x: 50,
        y: 200,
        padding: 5,
        prepareHeader: () => doc.font(`assets/${basefont}-Thin.ttf`).fontSize(6),
        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
            doc.font(`assets/${basefont}-Thin.ttf`).fontSize(8)
        }
    })

    doc.font(`assets/${basefont}-Thin.ttf`).fontSize(10)
    doc.text("Goodgrid (Koen Bonnet B.V.)\rGeorges Braquehof 9\r3544KE Utrecht",50,730)
    doc.text("Tel: +31(0)848735177\rE-mail: info@goodgrid.nl\rWebsite: https://www.goodgrid.nl",210,730)
    doc.text("KVK: 56895747\rBTW-id: NL852351628B01\rIBAN: NL86TRIO0784815208\rBIC: TRIONL2U",400,730)

    
    let buffers = []
    doc.on("data", data => {
        buffers.push(data)
    })

    doc.on("end", () => {
        return fs.writeFileSync(`Documents/Specificatie ${invoiceNumber}.pdf`, Buffer.concat(buffers))
    })

    doc.end()

}  


const calulateLines = (lines) => {
    return lines.map(line => {
        return [line[0], line[1], line[2], line[3], line[1] * line[2]]
    })
}

const getSummary = (lines) => {
    
    const subtotal = lines.reduce((prev, next) => {
            return Number(prev) + (Number(next[1] * next[2]))
    },0)
    
    const vat = lines.reduce((prev, next) => {
        return prev + (next[1] * next[2]) * 0.21
    },0)
    
    return [[subtotal, vat, subtotal + vat]]
}

const getCurrency = (value) => {
    return `${Number(value).toLocaleString("nl-NL", {style: "currency", currency: "EUR"})}`
}


const getVATString = (value) => {
    return `${value}%`
}

const getDutchDate = (daysFromNow = 0) => {
    const now = new Date()
    const dt = new Date(now.setDate(now.getDate() + daysFromNow)).toLocaleDateString("nl-NL")

    
    return String(dt).split("-").map(part => {
        return String(part).padStart(2,"0")
    }).join("-")

}

export { generateInvoice, generateTimesheet }
