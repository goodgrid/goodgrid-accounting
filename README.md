# Notion Invoicing for Consultants

## Introduction
This project enables consultants to do project management and time registration in Notion and generate the monthly invoices and timesheets. It builds in a set of databases in Notion for the following entities:

- Customers; an overview of customers with their contact details 
- Projects; a list of projects, linked to customers and with an hourly rate
- Time entries; the database to register spent hours. Spent hours are linked to a project and this indirectly to a customer
- Invoices; invoices with a period to invoice upon, an invoice number and some financial details
- Expenses; extra line-items linked to an invoice not based on spent hours

This node.js project generates two PDF's per draft invoice in the invoice database:

- The invoice with 
    - a line item for the spent hours per project
    - a line item per 'expense' linked to the invoice
- The timesheet listing all spent hours for any project linked to the customer within the invoice period


I created this project for my own use, since [Tellow](www.tellow.nl) no longer did the job for me. Not everyting is parameterized already.


