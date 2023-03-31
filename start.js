
import {generateInvoice, generateTimesheet } from "./generateDocument.js"

import {getDraftInvoices, getProjects, getCustomer, getExpenses, getTimeEntries, saveInvoice } from "./notion.js"
import config from "./config.js"



const summarizeLineItems = (timeEntries) => {
    return timeEntries.map(project => {
        
        return [
            `Inzet op ${project.name}`, 
            project.timeEntries.reduce((prev, next) => {
                return prev + next.hours
            },0), 
            project.rate, 
            config.vatPercentageHours
        ]
    }).filter(project => project[1] > 0)

}

const invoices = async () => {
    const { results: invoices } = await getDraftInvoices()

    return Promise.all(invoices.map(async invoice => {
        console.log(`Processing invoice ${invoice.properties[config.notionSchema.invoices.properties.invoiceNumber].title[0].plain_text}`)//,invoice.properties["Factuurnummer"].title)

        return {
            id: invoice.id,
            invoiceNumber: invoice.properties[config.notionSchema.invoices.properties.invoiceNumber].title[0].plain_text.replace("C-",""),
            customer: await getCustomer(invoice.properties[config.notionSchema.invoices.properties.customer].relation[0].id),
            period_start: invoice.properties[config.notionSchema.invoices.properties.period].date.start,
            period_end: invoice.properties[config.notionSchema.invoices.properties.period].date.end,
            projects: await getProjects(invoice.properties[config.notionSchema.invoices.properties.customer].relation[0].id)
        }
    }))
}


(await invoices()).forEach(async invoice => {
    const timeEntries = await Promise.all(invoice.projects.map(async project => {
        return {
            id: project.id,
            name: project.name,
            rate: project.rate,
            timeEntries: await getTimeEntries(invoice.period_start, invoice.period_end, project.id)
        }
    }))

    const lineItems = summarizeLineItems(timeEntries).concat(await getExpenses(invoice.id)) //invoice.lineItems,

    const timesheet = timeEntries.reduce((prev, next) => {
        return prev.concat(next.timeEntries.map(entry => {
            return [entry.date, next.name, entry.hours, entry.description]
        }))
    },[]).sort((a, b) => a.date < b.date)

    generateInvoice({
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customer.name, 
        customerAddress: invoice.customer.postalAddress, 
        paymentTermDays: invoice.customer.paymentTermDays, 
        lines: lineItems
        
    })

    generateTimesheet({
        invoiceNumber: invoice.invoiceNumber, 
        period: `van ${invoice.period_start} tot ${invoice.period_end}`,
        customerName: invoice.customer.name, 
        customerAddress: invoice.customer.postalAdress, 
        lines: timesheet
    })

    saveInvoice({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: new Date().toISOString(),
        amount: lineItems.reduce((prev, next) =>{
            return prev + next[1] * next[2]
        },0),
        vat: lineItems.reduce((prev, next) =>{
            return prev + (next[1] * next[2]) / 100 * next[3]
        },0)

    })

    
})

