import invoiceGenerator from "./generate-invc.js"
import {getDraftInvoices, getInvoiceData, allocateInvoiceNumbers, saveInvoice } from "./data.js"
import timesheetGenerator from "./generate-spec.js"

const months = [
    "Januari",
    "Februari",
    "Maart",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Augustus",
    "September",
    "Oktober",
    "November",
    "December"
]

const invoicer = async () => {
    const { results: invoices } = await getDraftInvoices()

    invoices.map(invoice => {
        console.log(invoice.properties.Klant.id, invoice.properties.Periode.date)
    })
}

const invoicerOld = async (month) => {

    console.log(`Generating invoices for ${months[month -1]} ${new Date().getFullYear()}`)

    const invoiceData = await getInvoiceData(String(month).padStart(2,"0"))

    if (invoiceData) {

        const allocatedInvoiceNumbers = await allocateInvoiceNumbers(invoiceData.length)

        invoiceData.forEach((client,idx)  => {

            invoiceGenerator(
                allocatedInvoiceNumbers[idx].invoiceNumber,
                client.name,
                client.address,
                client.paymentTerm,
                client.projects.map(project => {
                    return [
                        project.name, 
                        project.entries.reduce((prev, next) => {
                            return prev + next.hours
                        },0), 
                        project.rate, 
                        21
                    ]
                })

            )

            timesheetGenerator(
                allocatedInvoiceNumbers[idx].invoiceNumber,
                `${months[month -1]} ${new Date().getFullYear()}`,
                client.name,
                client.address,
                client.projects.reduce((prev, next) => {
                    return prev.concat(next.entries.map(entry => {
                        return [entry.date, next.name, entry.hours, entry.description]
                    }))
                },[])
            )

            console.log(client.projects.reduce((prevProjects, currentProject) => {
                return prevProjects + currentProject.entries.reduce((prevEntries, currentEntry) => {
                    return prevEntries + (currentEntry.hours * currentEntry.rate)
                },0)
            },0))

            saveInvoice(
                allocatedInvoiceNumbers[idx].invoiceId, 
                client.id,
                `${months[month -1]} ${new Date().getFullYear()}`,
                new Date(),
                ...client.projects.reduce((prevProjects, currentProject) => {
                    return prevProjects + currentProject.entries.reduce((prevEntries, currentEntry) => {
                        return [
                            prevEntries + (currentEntry.hours * currentEntry.rate)
                        ]
                    },0)
                },0)
            )
            


        })
    } 
}



invoicer(process.argv[2])


