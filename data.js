import axios from "axios";
import config from "./config.js";

const notionApi = axios.create({
    baseURL: 'https://api.notion.com/v1/',
    headers: {
        'Authorization': `Bearer ${config.notionToken}`,
        accept: 'application/json',
        'Notion-Version': '2022-06-28',
        'content-type': 'application/json'
    } 
})

const getLastDayOfMonth = (month) => {
    //var zeroBasedMonth = month - 1
    var d = new Date(new Date().getFullYear(), month, 0)
    console.log(d.getMonth()+1)
}

const getProjects = async (customerId) => {
    const { data } = await notionApi.post(`databases/${config.notionSchema.projects}/query`, {
        "filter": {
            "and": [{
                "property": "Klant",
                "relation": [{"id": customerId }]
            }]
        }
    })
    return data

}

const getDraftInvoices = async () => {
    const { data } = await notionApi.post(`databases/${config.notionSchema.invoices}/query`, {
        "filter": {
            "and": [{
                "property": "Factuurnummer",
                "title": {
                    "is_empty": true
                }
            }]
        }
    })
    return data
}

const getInvoiceData = async (on_or_after, on_or_before, projectId) => {

    try {
        const { data } = await notionApi.post(`databases/${config.notionSchema.timeEntries}/query`,{
            "filter": {
                "and": [{
                    "property": "Dag",
                    "date": {
                        "on_or_after": on_or_after //`2023-${month}-01`
                    }
                },{
                    "property": "Dag",
                    "date": {
                        "on_or_before": on_or_before //`2023-${month}-${new Date(new Date().getFullYear(), month, 0).getDate()}`
                    }
                },{
                  "property": "Project",
                  "relation": [{"id": customerId }]
                }]
            },
            sorts: [{
                "property": "Dag",
                "direction": "ascending"

            }]
        })

        const entriesPerProject = data.results.reduce((rv, x) => {
            (rv[x.properties.Project.relation[0].id] = rv[x.properties.Project.relation[0].id] || []).push({
                date: x.properties.Dag.date.start,
                hours: x.properties.Uren.number,
                description: x.properties.Omschrijving.title[0].plain_text  
            })
            return rv
        },{})
    
        const projects = await Promise.all(Object.keys(entriesPerProject).map(async (project) => {
    
            const { data } = await notionApi.get(`pages/${project}`)
    
            return {
                clientId: data.properties.Klant.relation[0].id,
                name: data.properties.Name.title[0].plain_text,
                rate: data.properties.Uurtarief.number,
                entries: entriesPerProject[project] 
            }
    
        },{}))
        
    
        const projectsPerClient = projects.reduce((rv, x) => {
            (rv[x.clientId] = rv[x.clientId] || []).push(x)
            return rv
        },{})
    
        const clients = await Promise.all(Object.keys(projectsPerClient).map(async (client) => {
    
            const { data } = await notionApi.get(`pages/${client}`)
    
            return {
                id: data.id,
                name: data.properties.Name.title[0].plain_text,
                address: (data.properties.Adres.rich_text[0]) ? data.properties.Adres.rich_text[0].plain_text : "",
                email: data.properties["E-mailadres"].email,
                paymentTerm: data.properties["Betaaltermijn"].number,
                projects: projectsPerClient[client] 
            }
    
        },{}))
     
        return clients
    
    } catch (error) {
        console.log("Error retrieving invoice data from Notion")
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

const saveInvoice = (id, customerId, period, invoiceDate, amount, vat) => {

    console.log("Persisting invoice", id, customerId, period, invoiceDate, amount, vat)

    
    notionApi.patch(`pages/${id}`,{
        "properties": {
            "Periode": {"select": {"name": period}},
            "Klant": {"relation": [{"id": customerId }]},
            "Factuurdatum": {"date": {"start": new Date().toISOString()}},
            "Bruto factuurbedrag": {"number": amount},
            "BTW": {"number": vat}
    
        }
    })
    .catch(error => {
        console.log("Error saving invoice")
        console.error(error)
    })
}

export { getDraftInvoices, getInvoiceData, allocateInvoiceNumbers, saveInvoice }