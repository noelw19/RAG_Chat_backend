
// src/services/chatService.js
const { ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { RunnableSequence, RunnablePassthrough } = require("@langchain/core/runnables");
const { openaiApiKey, models, tokenLimits } = require('../config/config');
const vectorStoreService = require('./vectorStore');
const logger = require('../utils/logger');

class ChatService {
    constructor() {
        this.llm = new ChatOpenAI({
            openAIApiKey: openaiApiKey,
            model: models.chat,
            temperature: 0.2,
            maxTokens: 1024
        });

        this.condenseQuestionTemplate = `Given the following conversation and a follow-up question, rephrase the follow-up question to be a standalone question.

Chat History:
{chat_history}

Follow-up Question: {question}

Standalone Question:`;

        this.answerTemplate = `You are a helpful AI assistant specialized in retrieving and synthesizing information from provided documents and conversation history. Your primary function is to answer user questions by referencing only the specific information available to you in each query.

Document Context:
{context}

Chat History:
{chat_history}

User Question: {question}

Instructions:
1. Analyze the user's question carefully to understand what information they're seeking.
2. Search the provided document context first for relevant information.
3. If the document context doesn't contain sufficient information, check the chat history for relevant details or previous answers to similar questions.
4. If the user asks about their previous messages or questions, refer specifically to the chat history.
5. Only use information present in either the document context or chat history.
6. If neither source contains the information needed to answer the question accurately, respond with: "I don't have enough information in the provided context or chat history to answer this question."
7. Do not reference external knowledge or make assumptions beyond what's explicitly provided.
8. Format your response clearly and concisely:
   - For procedural questions, include step-by-step instructions if available
   - For code-related questions, include relevant code examples from the context
9. Maintain a helpful, professional tone throughout your response.
10. Focus on answering exactly what was asked without unnecessary elaboration.

Your response:`;
    }

    async createChain(documentId) {
        try {
            // Load vector store
            const vectorStore = await vectorStoreService.loadVectorStore(documentId);

            // Create retriever
            const retriever = vectorStore.asRetriever({
                k: 5,
                searchType: "similarity"
            });

            // Create prompt templates
            const condenseQuestionPrompt = PromptTemplate.fromTemplate(this.condenseQuestionTemplate);
            const answerPrompt = PromptTemplate.fromTemplate(this.answerTemplate);

            // Create standalone question chain
            const standaloneQuestionChain = RunnableSequence.from([
                condenseQuestionPrompt,
                this.llm,
                new StringOutputParser()
            ]);

            // Create retrieval chain
            const retrievalChain = RunnableSequence.from([
                (e) => {
                    console.log(e)
                    return e
                },
                {
                    context: RunnableSequence.from([
                        prevResult => prevResult.standalone_question,
                        retriever,
                        docs => docs.map(doc => doc.pageContent).join("\n\n")
                    ]),
                    question: ({ standalone_question }) => standalone_question,
                    chat_history: ({original_input}) => original_input.chat_history
                },
                (e) => {
                    console.log(e)
                    return e
                },
                answerPrompt,
                this.llm,
                new StringOutputParser()
            ]);

            // Create conversational chain
            const conversationalChain = RunnableSequence.from([
                {
                    standalone_question: standaloneQuestionChain,
                    original_input: new RunnablePassthrough(),
                },
                (e) => {
                    console.log(e)
                    return e
                },
                retrievalChain
            ]);

            return conversationalChain;
        } catch (error) {
            logger.error(`Error creating chat chain: ${error.message}`, { documentId, chatHistory, error });
            throw error;
        }
    }

    // Format chat history from array of messages
    formatChatHistory(messages) {
        console.log("messages here: ", messages)
        return messages[0].map(message => {
            if (message.role === 'user') {
                return `Human: ${message.text}`;
            } else {
                return `Assistant: ${message.text}`;
            }
        }).join('\n');
    }

    // Process chat with history
    async processChat(documentId, question, chatHistory = []) {
        try {
            const chain = await this.createChain(documentId);

            // Format chat history
            const formattedHistory = this.formatChatHistory([chatHistory]);

            console.log("Formatted: " ,formattedHistory)

            // Invoke chain
            const response = await chain.invoke({
                question: question,
                chat_history: formattedHistory
            });

            return response;
        } catch (error) {
            logger.error(`Error processing chat: ${error.message}`, { documentId, question, error });
            throw error;
        }
    }
}

module.exports = new ChatService();
