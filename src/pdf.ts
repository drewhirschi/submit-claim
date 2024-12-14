import "jsr:@std/dotenv/load";

import { CheckBoxOption, fillAndSavePdfForm, readPdfFormFields, setupAcroFieldCheckBox } from "./pdf.helpers.ts";

import OpenAI from "npm:openai";
import { prepareImageDataUrl } from "./pdf.helpers.ts";

// import { createClient } from 'npm:@supabase/supabase-js'

const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
});

// const supabase = createClient(
//     Deno.env.get("SUPABASE_URL")!,
//     Deno.env.get("SUPABASE_SERVICE_KEY")!
// );




// const templatePdfPath = 'docs/forms/regence.pdf';
const templatePdfPath = 'docs/forms/premera.pdf';

const { fields, form, pdfDoc } = await readPdfFormFields(templatePdfPath);

const checkboxes: {
    name: string,
    options: CheckBoxOption[]
}[] = []

const textFields: string[] = []

fields.forEach(field => {

    switch (field.constructor.name) {
        case "PDFTextField":
            textFields.push(field.getName())
            break;
        case "PDFCheckBox": {

            const checkboxOptions = setupAcroFieldCheckBox(form, field.getName());
            checkboxes.push({
                name: field.getName(),
                options: checkboxOptions
            })

            break;
        }
        default:
            console.log(field.constructor.name)
            break;

    }
});

console.log('after set up')

checkboxes.forEach(checkbox => {
    console.log(checkbox.name)
    checkbox.options.forEach(option => {
        console.log(option.formFullName, option.label)
    })
    console.log("".padEnd(50, '-'))
})


const systemMessage = `Here are keys from a insurance claim form: 
${textFields.join('\n')}
${checkboxes.map(checkbox => {
    return `${checkbox.name}, options: ` + checkbox.options.map(option => option.label).join(',')
}).join('\n')}

You will be provided images of bills and insurance cards that contain info for the form.
Respond with JSON where the key is from the keys provided where the relevant data is in the image.
`

console.log(systemMessage)

// Deno.exit(0)

const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": systemMessage
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": await prepareImageDataUrl('docs/david_bill.png')
                    }
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": await prepareImageDataUrl('docs/david_inscard.png')
                    }
                }
            ]
        }
    ],
    response_format: {
        "type": "json_object"
    },
});



const content = response.choices[0].message.content

console.log(content)

// const content = `{
//     "Section.1.PatientFirstName": "David",
//     "Section.1.PatientLastName": "Kartchner",
//     "Section.1.PatientDOB": "08/10/1992",
//     "Section.1.DaytimePhone": "(801) 870-3022",
//     "Section.1.NameofIllness": "Psychotherapy, 45 min",
//     "Section.1.ProviderName": "Steve Fogleman, PhD",
//     "Section.1.InjuryDate": "04/15/2024",
//     "Section.1.NameofIllness1": "Psychotherapy, 45 min",
//     "Section.1.ProviderName1": "Steve Fogleman, PhD",
//     "Section.1.InjuryDate1": "04/22/2024"
// }
// `
// const data = content ? JSON.parse(content) : {}

// await fillAndSavePdfForm(form, pdfDoc, 'docs/output.pdf', data)


console.log('done')




