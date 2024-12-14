import { PDFDocument, PDFForm, createPDFAcroFields } from 'npm:pdf-lib'

export async function prepareImageDataUrl(filePath: string): Promise<string> {
    try {
        const imageBuffer = await Deno.readFile(filePath, {});
        const imageExtension = filePath.split('.').pop() || "";
        const base64Image = btoa(String.fromCharCode(...imageBuffer));
        return `data:image/${imageExtension};base64,${base64Image}`;
    } catch (error) {
        throw new Error(`Failed to prepare image URL for file: ${filePath}`, { cause: error });
    }
}


export async function fillAndSavePdfForm(form: PDFForm, pdfDoc: PDFDocument, outputPdfPath: string, data: Record<string, string>) {


    // Set field values based on field names
    Object.entries(data).forEach(([fieldName, value]) => {
        const field = form.getTextField(fieldName); // Adjust for other field types
        if (field) {
            field.setText(value);
        }
    });

    // Save the filled PDF
    const filledPdfBytes = await pdfDoc.save();
    Deno.writeFileSync(outputPdfPath, filledPdfBytes);
}


export async function readPdfFormFields(pdfPath: string) {
    const pdfBytes = Deno.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    const form = pdfDoc.getForm();
    const fields = form.getFields()



    return { fields, form, pdfDoc };
}

export type CheckBoxOption = {
    formFullName: string,
    label: string
}


export function setupAcroFieldCheckBox(form: PDFForm, fieldName: string) {

    const kids = createPDFAcroFields(
        form.getCheckBox(fieldName).acroField.Kids()
    ).map(_ => _[0]);

    const options: CheckBoxOption[] = []
    kids.forEach((kid, _index) => {
        if (typeof kid.getPartialName() === "undefined") {
            // @ts-ignore getOnValue works but has linter errors
            const label = kid.getOnValue().encodedName.replace('/', '')
            kid.setPartialName(`${fieldName}-${label}`);
            options.push({ formFullName: kid.getPartialName() as string, label })
        }
    });
    return options
}






