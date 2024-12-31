import { AzureOpenAI } from "npm:openai";
import { ChatCompletionContentPart } from "npm:openai/resources/chat/completions";
import { z } from "npm:zod";
import { zodResponseFormat } from "npm:openai/helpers/zod";

export enum CompletionModels {
    gpt4o = "gpt-4o",
    gpt4oMini = "gpt-4o-mini",
    gpt4turbo = "gpt-4-turbo",
}
interface CompletionOptions {
    system: string;
    user: string;
    model?: CompletionModels;
    imageUrl?: string;
}
interface StructuredCompletionOptions<Z extends z.ZodTypeAny> extends CompletionOptions {
    schema: Z;
}

const apiKey = Deno.env.get("OPENAI_API_KEY");
if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
}

export async function getStructuredCompletion<Z extends z.ZodTypeAny = z.ZodNever>({
    model = CompletionModels.gpt4o,
    system,
    user,
    schema,
    imageUrl,
}: StructuredCompletionOptions<Z>): Promise<z.infer<Z> | null> {

    const deployment = model;
    const apiVersion = "2024-08-01-preview";

    const openai = new AzureOpenAI({
        apiKey,
        deployment,
        apiVersion,

    });

    try {
        const userMessageContent: Array<ChatCompletionContentPart> = [{ type: "text", text: user }];
        if (imageUrl) {
            userMessageContent.push({
                type: "image_url",
                image_url: { url: imageUrl },
            });
        }
        const response = await openai.beta.chat.completions.parse({
            model,
            messages: [
                { role: "system", content: system },
                { role: "user", content: userMessageContent },
            ],
            response_format: zodResponseFormat(schema, "root"),
        });
        const responseParsed = response.choices[0].message.parsed;
        if (!responseParsed) {
            return null;
        }

        return responseParsed as z.infer<Z>;
    } catch (error) {
        console.error(error);
        return null;
    }
}