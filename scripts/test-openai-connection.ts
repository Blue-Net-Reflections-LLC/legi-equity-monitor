import OpenAI from 'openai';
import { validateConfig } from './bill-analysis/config';

async function testConnection() {
    const envConfig = validateConfig();
    
    const openai = new OpenAI({
        apiKey: envConfig.openaiApiKey,
        baseURL: envConfig.openaiBaseUrl
    });

    try {
        console.log('Testing OpenAI connection...');
        console.log('Testing structured response...');
        
        const completion = await openai.chat.completions.create({
            model: envConfig.openaiModel,
            messages: [
                {
                    role: "system",
                    content: "You must respond with valid JSON matching this structure exactly: { \"test\": { \"status\": \"success\", \"supports_json\": boolean } }"
                },
                {
                    role: "user",
                    content: "Respond with a JSON object indicating successful connection."
                }
            ],
        });
        console.log('Completion:', completion);
        console.log('Raw Response:', completion.choices[0].message.content);
        
        // Test JSON parsing
        const response = JSON.parse(completion.choices[0].message.content || '');
        console.log('Parsed Response:', response);
        console.log('Test completed successfully');
        
    } catch (error) {
        console.error('Connection test failed:', error);
        process.exit(1);
    }
}

console.log('Starting test...');
testConnection(); 