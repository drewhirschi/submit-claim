import "jsr:@std/dotenv/load";

import { CompletionModels, getStructuredCompletion } from "./icd.helpers.ts";

import { z } from "zod";

// delverables
// - Implementation of the agent system
//     - Code that processes medical text input and generates ICD - 10 codes in the specified JSON format
//         - System should handle sample input cases like the provided patient case study
//             - Output should match the expected format shown in the sample output

export const ICD10CodeSchema = z.object({ code: z.string(), description: z.string(), evidence: z.string() })

const input = `An 18-year-old male patient presented to the emergency department with severe headache and fever due to lack of improvement with conventional treatment of viral upper respiratory infections.
Among the personal history, only infectious mononucleosis stands out.
After a catarrhal of one week of evolution, with general malaise, dry cough and fever(up to 38.5 oC), the patient develops global headache, more intense in the frontal region, in the last 48 hours, initially without rhinorrhea.
    Isolatedly, he had minimal purulent nasal secretion that has ever been bloody in recent days.
You have not had loss of consciousness, seizures, thiram, or chills.
On physical examination, we found: Ta: 37.5 oC; TA: 137 / 73 mmHg; P: 71 bpm.
Good general appearance with proper hydration and mucocutaneous perfusion.
    She's not impressive.
Febrile faces.
No painful spots in the percussion of the sinuses
A skin rash maculous and erythematous neck affects the trunk and neck.
    Laterocervical, axillary, or inguinal lymphadenopathies are not present.
Cardiac auscultation revealed crack, without murmurs.
Pulmonary auscultation revealed a conserved vesicular murmur, with no presence of roncus, crackles or wheezing.
The abdomen is blunt, depressible and does not have masses or enlargement.
The upper and lower extremities do not present pathological data, with distal pulses present.
The neurological examination is strictly normal, with no data on focality or meningism.
The corresponding complementary examinations were performed, with a rigorously normal chest X - ray, non - pathological urine analysis and blood count, highlighting leukocytosis with the presence of young sinuses(cayed: 0, 3dl) and differential diagnosis of glucose.
At the same time, a radiographic study of the paranasal sinuses in which no data compatible with sinusitis were observed; then, to rule out complications(such as thrombosis of the left cranial sinus or related encephalitis), the study showed.
1.
Once confirmed in the diagnosis of sinusitis in the cephalosporin, it was decided to admit the patient to the hospital for a correct evolutionary surveillance of the patient and start intravenous antibiotic treatment with third generation cephalosporins, treatment with ceasymptomised headache 48 hours without complications.`


//Implement a system of agents to process medical text and generate ICD-10 codes as described in the referenced paper.
// The system should focus on getting agents to work together effectively and output data in the expected format.

async function code(input: string): Promise<z.infer<typeof ICD10CodeSchema>[]> {
    // Your code here
    const codesRes = await getStructuredCompletion({
        model: CompletionModels.gpt4o,
        schema: z.object({ codes: z.array(ICD10CodeSchema) }),
        system: "extract icd codes from medical text",
        user: input
    })

    if (!codesRes) {
        throw new Error('There was an error getting the completion');
    }


    return codesRes.codes
}



code(input).then(console.log).catch(console.error);
