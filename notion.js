import axios from "axios";
import config from "./config.js";

const notionApi = axios.create({
    baseURL: 'https://api.notion.com/v1/',
    headers: {
        'Authorization': `Bearer ${config.notionToken}`,
        accept: 'application/json',
        'Notion-Version': config.notionApiVersion,
        'content-type': 'application/json'
    } 
})


const getCustomer = async (customerId) => {
    
    try {
        const { data } = await notionApi.get(`pages/${customerId}`)
        return {
            name: data.properties[config.notionSchema.customers.properties.name].title[0].plain_text,
            postalAddress: data.properties[config.notionSchema.customers.properties.postalAddress].rich_text[0].plain_text,
            emailAddress: data.properties[config.notionSchema.customers.properties.emailAddress].email,
            paymentTermDays: data.properties[config.notionSchema.customers.properties.paymentTerm].number
        }
    
    } catch(error) {
        console.log("Error while talking to notion", error.message)
    }
   
}

const getProjects = async (customerId) => {
    try {
        const { data } = await notionApi.post(`databases/${config.notionSchema.projects.database}/query`, {
            "filter": {
                "and": [{
                    "property": config.notionSchema.projects.properties.customer,
                    "relation": {"contains": customerId }
                }]
            }
        })
        return data.results.map(project => {
            
            return {
                id: project.id,
                name: project.properties[config.notionSchema.projects.properties.name].title[0].plain_text,
                rate: project.properties[config.notionSchema.projects.properties.rate].number
            }
        })
    } catch(error) {
        console.log("Error getting projects for customer")
        console.error(error.response ? error.response.data : error.message)
    }
}

const getExpenses = async (invoiceId) => {
    try {
        const { data } = await notionApi.post(`databases/${config.notionSchema.expenses.database}/query`, {
            "filter": {
                "and": [{
                    "property": config.notionSchema.expenses.properties.invoice,
                    "relation": {"contains": invoiceId }
                }]
            }
        })
        return data.results.map(expense => {

            return [
                expense.properties[config.notionSchema.expenses.properties.description].title[0].plain_text,
                1,
                expense.properties[config.notionSchema.expenses.properties.amount].number,
                expense.properties[config.notionSchema.expenses.properties.vat].number,

            ]
        })
    } catch(error) {
        console.log("Error getting exprenses for invoices")
        console.error(error.response ? error.response.data : error.message)
    }
}


const getDraftInvoices = async () => {
    const { data } = await notionApi.post(`databases/${config.notionSchema.invoices.database}/query`, {
        "filter": {
            "and": [{
                "property": config.notionSchema.invoices.properties.invoiceNumber,
                "title": {
                    "starts_with": config.draftInvoicePrefix
                }
            }]
        }
    })
    return data
}



const getTimeEntries = async (on_or_after, on_or_before, projectId) => {


    try {
        const { data } = await notionApi.post(`databases/${config.notionSchema.timeEntries.database}/query`,{
            "filter": {
                "and": [
                    {
                    "property": config.notionSchema.timeEntries.properties.date,
                    "date": {
                        "on_or_after": on_or_after 
                    }
                    },{
                        "property": config.notionSchema.timeEntries.properties.date,
                        "date": {
                            "on_or_before": on_or_before 
                        }
                    },{
                        "property": config.notionSchema.timeEntries.properties.project,
                        "relation": {"contains": projectId }
                    }
                ]
            },
            sorts: [{
                "property": config.notionSchema.timeEntries.properties.date,
                "direction": "ascending"

            }]
        })

        return data.results.map(entry => {
            return {
                projectId: projectId,
                date: entry.properties[config.notionSchema.timeEntries.properties.date].date.start,
                hours: entry.properties[config.notionSchema.timeEntries.properties.hours].number,
                description: entry.properties[config.notionSchema.timeEntries.properties.description].title[0].plain_text  
            }
        })
    
    } catch (error) {
        console.log("Error retrieving time entries from Notion")
        console.error(error.message)
    }



}

const allocateInvoiceNumbers = async (amount) => {
    const response = await notionApi.post(`databases/${config.notionSchema.invoices}/query`,{
            
        "sorts": [
            {
                "property": "Factuurnummer",
                "direction": "descending"
            }
        ],
        page_size: 1
    
    })

    
    const lastInvoiceNumber = response.data.results[0].properties.Factuurnummer.title[0].plain_text

    const [ prefix, num ] = lastInvoiceNumber.split("-")

    const allocatdInvoiceNumbers = []
    for (let i=Number(num) + 1;i<Number(num) + amount + 1;i++) {
        const allocatedInvoiceNumber = `${new Date().getFullYear()}-${String(i).padStart(5,"0")}`

        const { data } = await notionApi.post(`pages/`,{
            "parent": {
                "database_id": config.notionSchema.invoices
            },
            "properties": {
                "Factuurnummer": {
                    "title": [
                        {
                            "text": {
                                "content": allocatedInvoiceNumber
                            }
                        }
                    ]
                }
            }
    
        })        

        allocatdInvoiceNumbers.push({
            invoiceId: data.id,
            invoiceNumber: allocatedInvoiceNumber
        })
    }

    return allocatdInvoiceNumbers
    

}

const saveInvoice = (properties) => {
    const { id, invoiceNumber, invoiceDate, amount, vat } = properties

    //console.log(properties)
    notionApi.patch(`pages/${id}`,{
        "properties": {
            "Factuurnummer": [{"text": {"content": invoiceNumber}}],
            "Factuurdatum": {"start": invoiceDate},
            //"Bruto factuurbedrag": {"number": amount},
            //"BTW": {"number": vat}
    
        }
    })
    .catch(error => {
        console.log("Error saving invoice")
        console.error(error.response.data.message)
    })
}

export { getDraftInvoices, getCustomer,getProjects, getExpenses, getTimeEntries, allocateInvoiceNumbers, saveInvoice }