import { Groq } from "groq-sdk";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const groq = new Groq({
    apiKey: GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
});

const SCHEMA_CONTEXT = `
Table: "business_analytics"
Columns:
- order_id (text)
- row_id (integer)
- order_date (text)
- customer_id (text)
- customer_name (text)
- segment (text) - values: Consumer, Corporate, Home Office
- product_id (text)
- product_name (text)
- category (text) - values: Furniture, Office Supplies, Technology
- sub_category (text)
- region (text) - values: West, East, Central, South
- state (text)
- city (text)
- sales (numeric)
- quantity (integer)
- profit (numeric)
- profit_margin_percent (numeric)
- revenue_per_unit (numeric)
- loss_amount (numeric)
- gross_margin (numeric)
- gross_margin_percent (numeric)
- delivery_days (integer)
- consumer_sales (numeric)
- corporate_sales (numeric)
- furniture_sales (numeric)
- technology_sales (numeric)
- west_sales (numeric)
- east_sales (numeric)
- order_year (text)
- order_month (text)
`;


export async function classifyIntent(userMessage) {
    if (!GROQ_API_KEY) {
        throw new Error("Groq API Key is missing");
    }

    const systemPrompt = `
You are an intent classifier for a business analytics chatbot.
Your ONLY job is to determine if the user's message is:
1. "data_query" - They want to query, analyze, or visualize business data (sales, profits, customers, products, regions, etc.)
2. "general_chat" - They are greeting, asking about capabilities, or having general conversation

Respond with ONLY a JSON object, no other text:
{"intent": "data_query" | "general_chat"}

Examples:
- "hey" → {"intent": "general_chat"}
- "hello" → {"intent": "general_chat"}
- "what can you do?" → {"intent": "general_chat"}
- "show me sales by region" → {"intent": "data_query"}
- "what are the top products?" → {"intent": "data_query"}
- "profit margin analysis" → {"intent": "data_query"}
- "thanks" → {"intent": "general_chat"}
`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0,
            max_tokens: 50,
        });

        const content = completion.choices[0]?.message?.content || '{"intent": "general_chat"}';
        const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Intent Classification Error:", error);

        return { intent: "general_chat" };
    }
}


export async function generateChatResponse(userMessage) {
    if (!GROQ_API_KEY) {
        throw new Error("Groq API Key is missing");
    }

    const systemPrompt = `
You are a friendly Business Analytics AI Assistant.
You help users analyze their business data including sales, profits, customers, products, and regional performance.

Available data includes:
- Sales and profit metrics
- Customer segments (Consumer, Corporate, Home Office)
- Product categories (Furniture, Office Supplies, Technology)
- Regional breakdown (West, East, Central, South)
- Time-based analysis (by year and month)

Respond conversationally. If the user greets you, greet them back and briefly mention what you can help with.
Keep responses concise and helpful.
`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 300,
        });

        return completion.choices[0]?.message?.content || "Hello! How can I help you analyze your data today?";

    } catch (error) {
        console.error("Chat Response Error:", error);
        return "Hello! I'm your data analytics assistant. Ask me about sales, profits, customers, or products.";
    }
}

export async function transformToSupabaseQuery(userQuery) {
    if (!GROQ_API_KEY) {
        throw new Error("Groq API Key is missing");
    }

    const systemPrompt = `
You are a Supabase Query Expert. 
Convert the user's natural language request into a JSON object for querying the database.

Database Schema:
${SCHEMA_CONTEXT}

Rules:
1. Return ONLY valid JSON. No markdown, no comments, no explanations.
2. JSON structure:
   {
     "table": "business_analytics",
     "select": "column1, column2, column3",
     "filters": [
       { "column": "col_name", "operator": "eq|gt|lt|gte|lte|like|ilike", "value": "value" }
     ],
     "order": { "column": "col_name", "ascending": true|false },
     "limit": 100
   }
3. Select only relevant columns for the user's question.
4. Use appropriate filters based on the question.
5. Default limit to 100 rows.
6. For text searches, use "ilike" operator with % wildcards.
`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userQuery }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
        });

        const content = completion.choices[0]?.message?.content;
        const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Groq Query Gen Error:", error);
        throw new Error("Failed to generate query from AI");
    }
}

export async function generateInsightAndSummary(userQuery, data) {
    if (!GROQ_API_KEY) {
        throw new Error("Groq API Key is missing");
    }

    const previewData = data.length > 50 ? data.slice(0, 50) : data;
    const dataContext = JSON.stringify(previewData);

    const systemPrompt = `
You are a Data Business Analyst.
The user asked: "${userQuery}"

Data Retrieved (${data.length} rows total, showing first ${previewData.length}):
${dataContext}

Your Task:
1. Provide a clear, direct answer to the user's question (2-3 sentences).
2. Extract exactly 3 key insights from this data.
3. Be specific with numbers and percentages.

Response Format (JSON ONLY, no other text):
{
  "summary": "Direct answer to the question with key findings.",
  "keyInsights": [
    { "title": "Short Title", "content": "Specific insight with numbers." },
    { "title": "Short Title", "content": "Insight with data." },
    { "title": "Short Title", "content": "Insight with analysis." }
  ]
}
`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Analyze the data." }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
        });

        const content = completion.choices[0]?.message?.content;
        const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Groq Insight Gen Error:", error);
        return {
            summary: "I've retrieved the data. Please review the table below.",
            keyInsights: []
        };
    }
}
