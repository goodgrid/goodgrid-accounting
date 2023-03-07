import axios from "axios";
import invoiceGenerator from "./generate-invc.js";
import config from "./config.js";

const notionApi = axios.create({
    baseURL: 'https://api.notion.com/v1/',
    headers: {
        'Authorization': 'Bearer secret_4CjidWYfleik4U2myS6BhbagDdqi9vxwqfxYvriLD0O',
        accept: 'application/json',
        'Notion-Version': '2022-06-28',
        'content-type': 'application/json'
    } 
})


const documentGenerator = async () => {
    try {
        const response = await notionApi.post(`databases/${config.notionSchema.invoices}/query`,{
            "filter": {
                "property": "Factuurdatum",
                "date": {
                    "is_empty": true
                }
            }
        })

        const invoices = await Promise.all(response.data.results.map(async invoice => {

            const { data: client } = await notionApi.get(`pages/${invoice.properties.Klant.relation[0].id}`)

            console.log(`Getting data for ${client.properties.Name.title[0].plain_text}`)
            return {
                invoiceNumber: invoice.properties.Factuurnummer.title[0].plain_text,
                client: client.properties.Name.title[0].plain_text,
                address: (client.properties.Adres.rich_text.length > 0) ? client.properties.Adres.rich_text[0].plain_text : "",
                email: client.properties["E-mailadres"].email,
                projects: await Promise.all(client.properties.Projecten.relation.map(async project => {
                    const { data: projectData } = await notionApi.get(`pages/${project.id}`)

                    //console.log(projectData.properties.Name.title[0].plain_text, await getHoursForPreviousMonth(projectData.id))
                    return {
                        title: projectData.properties.Name.title[0].plain_text,
                        rate: projectData.properties.Uurtarief.number,
                        vat: 21,
                        hours: await getHoursForPreviousMonth(projectData.id)
                    }
                }).filter(async project => {
                    console.log(project)
                })),
                paymentTerm: client.properties.Betaaltermijn.number

            }
        }))

        console.log(invoices)

        invoices.map(async (invoice, idx) => {
            invoiceGenerator(
                invoice.invoiceNumber,
                {
                    name: invoice.client,
                    address: invoice.address
                },
                invoice.paymentTerm,
                invoice.projects.map(project => {
                    return [
                        project.title,
                        project.hours,
                        project.rate,
                        project.vat
                    ]
                })
            )
        })
    } catch(error) {
        console.log(error)
    }
}

export default documentGenerator

const getHoursForPreviousMonth = async (projectId) => {

    const response = await notionApi.post(`databases/${config.notionSchema.timeEntries}/query`,{
        "filter": {
            "and": [{ 
            
                "property": "Project",
                "relation": {
                    "contains": projectId
                }
            },{ 
            
                "property": "Dag",
                "date": {
                    "on_or_after": "2023-01-01"
                }
            },{ 
            
                "property": "Dag",
                "date": {
                    "on_or_before": "2023-01-31"
                }
            }]
        },
        "sorts": [
        ]
    
    
    })

    return response.data.results.reduce((prev, next) => {
        
        return prev + next.properties.Uren.number
    },0)
    

}


