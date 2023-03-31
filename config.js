import { notionToken } from './secrets.js'

export default  {
    notionToken: notionToken,
    notionApiVersion: '2022-06-28',
    notionSchema: {
        timeEntries: {
            database: "832c343383ef466a9a7e81f7a034155b",
            properties: {
                date: "Dag",
                project: "Project",
                hours: "Uren",
                description: "Omschrijving"
            }
        },
        invoices: {
            database: "1d0b4244-294d-4a28-9d3b-ee693b69a6a0",
            properties: {
                customer: "Klant",
                period: "Periode",
                invoiceNumber: "Factuurnummer",
                invoiceDate: "Factuurdatum",
                amountVat: "BTW",
                amount: "Bruto factuurbedrag",
                sent: "Verzonden",
                expenses: "Expenses"
            }  
        },
        customers: {
            database: "350bf95a-bc42-48fd-8625-f71cff3f519d",
            properties: {
                name: "Name",
                emailAddress: "E-mailadres",
                projects: "Projecten",
                postalAddress: "Adres",
                paymentTerm: "Betaaltermijn",
                status: "Status"
            }
        },
        projects: {
            database: "3d16012805d249358b739a322faa3b76",
            properties: {
                name: "Name",
                customer: "Klant",
                hours: "Uren",
                rate: "Uurtarief",
                turnover: "Omzet",
                status: "Status"

            }
        },
        expenses: {
            database: "db2ba2122c34499699325de82cc61821",
            properties: {
                description: "Description",
                amount: "Bruto bedrag",
                vat: "BTW",
                invoice: "Factuur"
            }
        }
    },
    draftInvoicePrefix: "C-",
    vatPercentageHours: 21
}