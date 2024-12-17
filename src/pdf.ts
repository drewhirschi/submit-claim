import "jsr:@std/dotenv/load";

import { CheckBoxOption, fillAndSavePdfForm, prepareImageDataUrl, readPdfFormFields, setupAcroFieldCheckBox } from "./pdf.helpers.ts";
import { decrypt, info } from "node-qpdf2";

import OpenAI from "npm:openai";

const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
});






const templatePdfPath = 'docs/forms/premera.pdf';


// node-qpdf2 requires qpdf to be installed and on the env PATH
// const pdfInfo = await info({ input: templatePdfPath });
// if (pdfInfo != "File is not encrypted") {
//     console.log('decrypting ', templatePdfPath)


//     Deno.copyFile(templatePdfPath, templatePdfPath.split('.')[0] + '-encrypted.pdf');


//     const pdf = {
//         input: templatePdfPath,
//         output: templatePdfPath,
//         password: "",
//     }

//     await decrypt(pdf);
// }


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

const data = content ? JSON.parse(content) : {}

await fillAndSavePdfForm(form, pdfDoc, templatePdfPath.split('.')[0] + '-filled.pdf', data)






