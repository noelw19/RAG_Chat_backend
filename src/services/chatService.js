
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

        this.condenseQuestionTemplate = `Given the following conversation and a follow-up question, rephrase the follow-up question to be a standalone question that captures all necessary context from the conversation.

Chat History:
{chat_history}

Follow-up Question: {question}

Standalone Question:`;

        this.answerTemplate = `You are a helpful AI assistant that helps users find information from documentation. You have access to documentation chunks and need to answer the user's question based on this information.

Context information from the documentation:
{context}

User question: {question}

Instructions:
1. Answer the question based only on the provided context.
2. If the context doesn't contain the answer, say "I don't have enough information to answer that question based on the documentation provided."
3. Don't make up information or use knowledge outside of the provided context.
4. Keep your answer concise, clear, and directly address the user's question.
5. If appropriate, include code examples or step-by-step instructions from the documentation.

Answer:`;
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
                {
                    context: RunnableSequence.from([
                        prevResult => prevResult.standalone_question,
                        retriever,
                        docs => docs.map(doc => doc.pageContent).join("\n\n")
                    ]),
                    question: ({ standalone_question }) => standalone_question
                },
                answerPrompt,
                this.llm,
                new StringOutputParser()
            ]);

            // Create conversational chain
            const conversationalChain = RunnableSequence.from([
                {
                    standalone_question: standaloneQuestionChain,
                    original_input: new RunnablePassthrough()
                },
                retrievalChain
            ]);

            return conversationalChain;
        } catch (error) {
            logger.error(`Error creating chat chain: ${error.message}`, { documentId, error });
            throw error;
        }
    }

    // Format chat history from array of messages
    formatChatHistory(messages) {
        return messages.map(message => {
            if (message.role === 'user') {
                return `Human: ${message.content}`;
            } else {
                return `Assistant: ${message.content}`;
            }
        }).join('\n');
    }

    // Process chat with history
    async processChat(documentId, question, chatHistory = []) {
        try {
            const chain = await this.createChain(documentId);

            // Format chat history
            const formattedHistory = this.formatChatHistory(chatHistory);

            console.log(formattedHistory)

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
