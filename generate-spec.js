import PDFDocument from "pdfkit-table"
import fs from 'fs'

const basefont = "Montserrat"

const timesheetGenerator = async (invoiceNumber, period, customerName, customerAddress, lines) => {

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
    doc.text(`${customerName}\r${customerAddress}`,50,150)
    doc.text(`Periode: ${period}`,380,150)


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


const getDutchDate = (daysFromNow = 0) => {
    const now = new Date()
    const dt = new Date(now.setDate(now.getDate() + daysFromNow)).toLocaleDateString("nl-NL")

    
    return String(dt).split("-").map(part => {
        return String(part).padStart(2,"0")
    }).join("-")

}

export default timesheetGenerator